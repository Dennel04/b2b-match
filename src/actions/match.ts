'use server';

import { ask, askText } from '@/lib/claude';
import { describeLeaks, findLeaks } from '@/lib/leak';
import { checkCompatibility, describeCompatibility, FORMAT_LABELS } from '@/lib/overlap';
import { adminClient, serverClient } from '@/lib/supabase';
import { briefPrompt } from '@/prompts/brief';
import { MatchScoresSchema, matchPrompt } from '@/prompts/match';
import {
  BuyerTurnSchema,
  EnvelopeSchema,
  SellerTurnSchema,
  buyerTurnPrompt,
  envelopePrompt,
  sellerTurnPrompt,
} from '@/prompts/negotiate';
import type {
  AgentDialogueLine,
  BuyerTerms,
  Compatibility,
  CompanyProfile,
  DealEnvelope,
  Match,
  MatchAction,
  MatchStatus,
  Negotiation,
  SellerTerms,
} from '@/types';

const SCORE_THRESHOLD = 70;

/** Four exchanges: enough to converge on a format, short enough to read on stage. */
const ROUNDS = 4;

const EMPTY_BUYER_TERMS: BuyerTerms = {
  budget_ceiling: null,
  contract_formats: [],
  start_by: null,
  requirements: [],
  dealbreakers: [],
};

const EMPTY_SELLER_TERMS: SellerTerms = {
  budget_floor: null,
  contract_formats: [],
  available_from: null,
  capabilities: [],
};

/**
 * All matching runs through the service role: the problem text is read server-side only and
 * never leaves at any step.
 *
 * Two stages, in order:
 *   1. Mechanical terms check — free, filters out anyone incompatible on money, timing,
 *      contract format or requirements.
 *   2. Claude scores only the survivors.
 */
export async function findMatches(problemId: string): Promise<Match[]> {
  const admin = adminClient();

  const { data: problem, error: pErr } = await admin
    .from('problems').select('*').eq('id', problemId).single();
  if (pErr || !problem) throw pErr ?? new Error('Problem not found');

  const { data: sellers } = await admin
    .from('companies')
    .select('id, profile_json, seller_terms')
    .in('role', ['seller', 'both'])
    .neq('id', problem.company_id);

  const buyerTerms: BuyerTerms = problem.buyer_terms ?? EMPTY_BUYER_TERMS;

  // Stage 1: mechanical check. Neither side sees the other's figures.
  const viable = (sellers ?? [])
    .filter((s) => s.profile_json)
    .map((s) => ({
      id: s.id,
      profile: s.profile_json as CompanyProfile,
      compatibility: checkCompatibility(buyerTerms, (s.seller_terms ?? EMPTY_SELLER_TERMS) as SellerTerms),
    }))
    .filter((s) => !s.compatibility.hard_fail);

  if (!viable.length) return [];

  // Stage 2: semantic scoring of whoever cleared the terms.
  const { results } = await ask(
    MatchScoresSchema,
    matchPrompt(
      problem.text,
      viable.map((s) => ({
        id: s.id,
        summary: s.profile.summary,
        services: s.profile.services,
      })),
    ),
    { effort: 'high' },
  );

  const byId = new Map(viable.map((s) => [s.id, s]));
  const rows = results
    .filter((r) => r.score >= SCORE_THRESHOLD && byId.has(r.seller_company_id))
    .map((r) => ({
      buyer_company_id: problem.company_id,
      seller_company_id: r.seller_company_id,
      problem_id: problemId,
      score: Math.round(r.score),
      reasoning_public: r.reasoning_public,
      compatibility_json: byId.get(r.seller_company_id)!.compatibility,
      status: 'proposed' as const,
    }));
  if (!rows.length) return [];

  const { data, error } = await admin.from('matches').insert(rows).select();
  if (error) throw error;
  return data as Match[];
}

/**
 * The core of the product. Each round is TWO separate model calls, one per agent, and the
 * seller's call never receives the problem text — only what the buyer's agent said out loud.
 * That is what makes "the vendor never saw your problem" a fact about the code rather than a
 * claim about a prompt.
 *
 * The result is cached, so a demo match is generated once and replayed instantly on stage.
 */
export async function negotiate(matchId: string): Promise<Negotiation> {
  const admin = adminClient();
  const { data: m } = await admin
    .from('matches')
    .select(
      '*, problems(text, buyer_terms), seller:companies!matches_seller_company_id_fkey(profile_json, seller_terms)',
    )
    .eq('id', matchId)
    .single();
  if (!m) throw new Error('Match not found');

  if (m.agent_dialogue_json && m.deal_envelope_json) {
    return { lines: m.agent_dialogue_json, envelope: m.deal_envelope_json };
  }

  const problemText = m.problems.text as string;
  const seller = m.seller.profile_json as CompanyProfile;
  const sellerTerms = (m.seller.seller_terms ?? EMPTY_SELLER_TERMS) as SellerTerms;
  const buyerTerms: BuyerTerms = m.problems.buyer_terms ?? EMPTY_BUYER_TERMS;
  const compatibility = (m.compatibility_json ??
    checkCompatibility(buyerTerms, sellerTerms)) as Compatibility;
  const compatibilitySummary = describeCompatibility(compatibility);

  const lines: AgentDialogueLine[] = [];

  for (let round = 0; round < ROUNDS; round++) {
    const isLast = round === ROUNDS - 1;

    const buyer = await ask(
      BuyerTurnSchema,
      buyerTurnPrompt({
        problemText,
        dealbreakers: buyerTerms.dealbreakers,
        compatibilitySummary,
        transcript: lines,
        isFirst: round === 0,
        isLast,
      }),
      { effort: 'medium' },
    );
    lines.push({ speaker: 'buyer_agent', text: buyer.text, withheld: buyer.withheld });

    // Note what is NOT passed here: problemText, buyerTerms, dealbreakers.
    const vendor = await ask(
      SellerTurnSchema,
      sellerTurnPrompt({
        sellerSummary: seller.summary,
        sellerServices: seller.services,
        compatibilitySummary,
        transcript: lines,
        isLast,
      }),
      { effort: 'medium' },
    );
    lines.push({ speaker: 'seller_agent', text: vendor.text });
  }

  // Fail closed: a transcript carrying the problem across must never reach the other side.
  const leaks = findLeaks(problemText, lines);
  if (leaks.length) {
    throw new Error(`Negotiation discarded — the problem text leaked at ${describeLeaks(leaks)}`);
  }

  const decided = await ask(
    EnvelopeSchema,
    envelopePrompt({
      transcript: lines,
      compatibilitySummary,
      allowedFormats: compatibility.contract_formats,
    }),
    { effort: 'high' },
  );

  // What the platform already knows for certain is copied, never asked of the model.
  const envelope: DealEnvelope = {
    verdict: decided.verdict,
    agreed_format:
      decided.agreed_format && compatibility.contract_formats.includes(decided.agreed_format)
        ? decided.agreed_format
        : null,
    budget_compatible: compatibility.budget === 'ok',
    earliest_start: sellerTerms.available_from,
    open_questions: decided.open_questions,
    confidence: decided.confidence,
  };

  await admin
    .from('matches')
    .update({
      agent_dialogue_json: lines,
      deal_envelope_json: envelope,
      status: envelope.verdict === 'reject' ? 'declined' : 'proposed',
    })
    .eq('id', matchId);

  return { lines, envelope };
}

/**
 * Double opt-in, enforced here rather than assumed by the UI: the buyer signals interest first,
 * and only then can the seller accept. Clients cannot write `matches` directly (see migration
 * 0002), so this is the only door.
 */
export async function setMatchStatus(matchId: string, action: MatchAction): Promise<Match> {
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = adminClient();
  const { data: m } = await admin
    .from('matches')
    .select(
      `id, status,
       buyer:companies!matches_buyer_company_id_fkey(owner_id),
       seller:companies!matches_seller_company_id_fkey(owner_id)`,
    )
    .eq('id', matchId)
    .single();
  if (!m) throw new Error('Match not found');

  // A `!fkey` embed on a many-to-one is a single object at runtime; the untyped client guesses array.
  const row = m as unknown as {
    status: MatchStatus;
    buyer: { owner_id: string };
    seller: { owner_id: string };
  };

  const isBuyer = row.buyer.owner_id === user.id;
  const isSeller = row.seller.owner_id === user.id;
  if (!isBuyer && !isSeller) throw new Error('Not a party to this match');

  const status = nextStatus(row.status, action, isBuyer, isSeller);

  const { data, error } = await admin
    .from('matches').update({ status }).eq('id', matchId).select().single();
  if (error) throw error;
  return data as Match;
}

function nextStatus(
  current: MatchStatus,
  action: MatchAction,
  isBuyer: boolean,
  isSeller: boolean,
): MatchStatus {
  if (action === 'decline') return 'declined';

  if (action === 'interested') {
    if (!isBuyer) throw new Error('Only the buyer can express interest');
    if (current !== 'proposed') throw new Error(`Cannot express interest from "${current}"`);
    return 'buyer_interested';
  }

  if (!isSeller) throw new Error('Only the seller can accept');
  if (current !== 'buyer_interested') {
    throw new Error('The buyer has not expressed interest yet — this is the double opt-in');
  }
  return 'accepted';
}

export async function generateBrief(matchId: string): Promise<string> {
  const admin = adminClient();
  const { data: m } = await admin
    .from('matches')
    .select(`*, problems(text),
             buyer:companies!matches_buyer_company_id_fkey(name),
             seller:companies!matches_seller_company_id_fkey(name, profile_json)`)
    .eq('id', matchId)
    .single();
  if (!m) throw new Error('Match not found');
  if (m.brief_md) return m.brief_md;
  if (m.status !== 'accepted') throw new Error('Briefing requires both sides to have accepted');

  const seller = m.seller.profile_json as CompanyProfile;
  const envelope = m.deal_envelope_json as DealEnvelope | null;

  const brief = await askText(
    briefPrompt({
      buyerName: m.buyer.name,
      sellerName: m.seller.name,
      problemText: m.problems.text,
      sellerSummary: seller.summary,
      score: m.score,
      agreedFormat: envelope?.agreed_format ? FORMAT_LABELS[envelope.agreed_format] : null,
      openQuestions: envelope?.open_questions ?? [],
    }),
  );

  await admin.from('matches').update({ brief_md: brief }).eq('id', matchId);
  return brief;
}
