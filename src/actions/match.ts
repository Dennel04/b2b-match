'use server';

import { ask, askText } from '@/lib/claude';
import { describeLeaks, findLeaks } from '@/lib/leak';
import { checkCompatibility, describeCompatibility, FORMAT_LABELS } from '@/lib/overlap';
import { adminClient, currentUser } from '@/lib/supabase';
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
  ActionResult,
  AgentDialogueLine,
  BuyerTerms,
  Compatibility,
  CompanyProfile,
  DealEnvelope,
  Match,
  MatchAction,
  MatchStatus,
  MatchView,
  Negotiation,
  SellerTerms,
} from '@/types';

const SCORE_THRESHOLD = 70;

/** Four exchanges: enough to converge on a format, short enough to read on stage. */
const ROUNDS = 4;

/** A negotiation with no envelope and a stamp older than this is abandoned, not running. */
const STALE_AFTER_MS = 5 * 60 * 1000;

const isRunning = (startedAt: string | null, envelope: unknown) =>
  !envelope && !!startedAt && Date.now() - new Date(startedAt).getTime() < STALE_AFTER_MS;

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
 *
 * Safe to call over and over on the same problem, which is what `scripts/sweep.ts` does: stage 1
 * is redone for everyone because it is free and vendors move their terms, while stage 2 sees
 * only vendors nobody has priced for this problem yet. A sweep that finds nobody new is two
 * queries and an upsert.
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

  // What this problem has already been through. The sweep calls this again every time a new
  // vendor appears, so without it the model would re-price every pair it has already judged.
  const [{ data: priorCandidates }, { data: existing }] = await Promise.all([
    admin.from('match_candidates').select('seller_company_id, score').eq('problem_id', problemId),
    admin.from('matches').select('seller_company_id').eq('problem_id', problemId),
  ]);
  /** Seller → the score it already has. Carried forward so an upsert never erases one. */
  const scored = new Map<string, number>(
    (priorCandidates ?? [])
      .filter((c) => c.score !== null)
      .map((c) => [c.seller_company_id as string, c.score as number]),
  );
  // Running this twice on one problem must not produce a second copy of every match.
  const alreadyMatched = new Set((existing ?? []).map((m) => m.seller_company_id as string));

  // Stage 1: mechanical check. Neither side sees the other's figures. Re-run for everyone on
  // every sweep, scored or not: it is free, and a vendor that named its floor last week is
  // compared on that floor today.
  const evaluated = (sellers ?? [])
    .filter((s) => s.profile_json)
    .map((s) => ({
      id: s.id,
      profile: s.profile_json as CompanyProfile,
      compatibility: checkCompatibility(buyerTerms, (s.seller_terms ?? EMPTY_SELLER_TERMS) as SellerTerms),
    }));
  const viable = evaluated.filter((s) => !s.compatibility.hard_fail);
  /** Only these reach the model: cleared the terms, and nobody has priced them for this problem yet. */
  const fresh = viable.filter((s) => !scored.has(s.id));

  /** The funnel, including everyone who lost here — a vendor cannot be told why otherwise. */
  const recordCandidates = (matched: Set<string>) =>
    admin.from('match_candidates').upsert(
      evaluated.map((s) => ({
        problem_id: problemId,
        seller_company_id: s.id,
        cleared_terms: !s.compatibility.hard_fail,
        compatibility_json: s.compatibility,
        score: scored.get(s.id) ?? null,
        became_match: matched.has(s.id),
      })),
      { onConflict: 'problem_id,seller_company_id' },
    );

  // Nobody new to judge. The compatibility written above is still worth storing — a vendor's
  // terms may have moved since the last sweep — but there is nothing to ask the model.
  if (!fresh.length) {
    await recordCandidates(alreadyMatched);
    return [];
  }

  // Stage 2: semantic scoring of whoever cleared the terms and has not been scored before.
  const { results } = await ask(
    MatchScoresSchema,
    matchPrompt(
      problem.text,
      fresh.map((s) => ({
        id: s.id,
        summary: s.profile.summary,
        services: s.profile.services,
      })),
    ),
    { effort: 'high' },
  );

  const byId = new Map(fresh.map((s) => [s.id, s]));
  for (const r of results) {
    if (byId.has(r.seller_company_id)) scored.set(r.seller_company_id, Math.round(r.score));
  }
  const rows = results
    .filter(
      (r) =>
        r.score >= SCORE_THRESHOLD && byId.has(r.seller_company_id) && !alreadyMatched.has(r.seller_company_id),
    )
    .map((r) => ({
      buyer_company_id: problem.company_id,
      seller_company_id: r.seller_company_id,
      problem_id: problemId,
      score: Math.round(r.score),
      reasoning_public: r.reasoning_public,
      compatibility_json: byId.get(r.seller_company_id)!.compatibility,
      status: 'proposed' as const,
    }));

  await recordCandidates(new Set([...alreadyMatched, ...rows.map((r) => r.seller_company_id)]));
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
export async function negotiate(matchId: string): Promise<ActionResult<Negotiation>> {
  const admin = adminClient();
  const { data: m } = await admin
    .from('matches')
    .select(
      '*, problems(text, buyer_terms), seller:companies!matches_seller_company_id_fkey(profile_json, seller_terms)',
    )
    .eq('id', matchId)
    .single();
  if (!m) return { ok: false, message: 'Match not found' };

  if (m.agent_dialogue_json && m.deal_envelope_json) {
    return { ok: true, data: { lines: m.agent_dialogue_json, envelope: m.deal_envelope_json } };
  }
  if (isRunning(m.negotiation_started_at, m.deal_envelope_json)) {
    return { ok: false, message: 'The negotiation is already running — watch it below' };
  }

  const problemText = m.problems.text as string;
  const seller = m.seller.profile_json as CompanyProfile;
  const sellerTerms = (m.seller.seller_terms ?? EMPTY_SELLER_TERMS) as SellerTerms;
  const buyerTerms: BuyerTerms = m.problems.buyer_terms ?? EMPTY_BUYER_TERMS;
  const compatibility = (m.compatibility_json ??
    checkCompatibility(buyerTerms, sellerTerms)) as Compatibility;
  const compatibilitySummary = describeCompatibility(compatibility);

  const lines: AgentDialogueLine[] = [];
  // Each line is stored as it is produced, so a screen polling getMatchView() sees the rounds.
  const publish = () =>
    admin.from('matches').update({ agent_dialogue_json: lines }).eq('id', matchId);

  await admin
    .from('matches')
    .update({ agent_dialogue_json: [], deal_envelope_json: null, negotiation_started_at: new Date().toISOString() })
    .eq('id', matchId);

  for (let round = 0; round < ROUNDS; round++) {
    const isLast = round === ROUNDS - 1;

    const buyerPrompt = {
      problemText,
      dealbreakers: buyerTerms.dealbreakers,
      compatibilitySummary,
      transcript: lines,
      isFirst: round === 0,
      isLast,
    };
    let buyer = await ask(BuyerTurnSchema, buyerTurnPrompt(buyerPrompt), { effort: 'medium', label: 'buyer-turn' });

    // Check each buyer line as it is produced: one regeneration is cheaper than discarding
    // the whole negotiation at the end, and the final guard below still fails closed.
    const slip = findLeaks(problemText, [{ speaker: 'buyer_agent', text: buyer.text }]);
    if (slip.length) {
      buyer = await ask(
        BuyerTurnSchema,
        buyerTurnPrompt({ ...buyerPrompt, rephrase: slip[0].fragment }),
        { effort: 'medium', label: 'buyer-rephrase' },
      );
    }
    lines.push({ speaker: 'buyer_agent', text: buyer.text, withheld: buyer.withheld });
    await publish();

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
      { effort: 'medium', label: 'seller-turn' },
    );
    lines.push({ speaker: 'seller_agent', text: vendor.text });
    await publish();
  }

  // Fail closed: a transcript carrying the problem across must never reach the other side.
  const leaks = findLeaks(problemText, lines);
  if (leaks.length) {
    await admin
      .from('matches')
      .update({ agent_dialogue_json: null, negotiation_started_at: null })
      .eq('id', matchId);
    console.error(`[leak] match ${matchId} discarded at ${describeLeaks(leaks)}`);
    return {
      ok: false,
      message: 'The agents’ transcript failed the privacy check and was discarded. Run it again.',
    };
  }

  const decided = await ask(
    EnvelopeSchema,
    envelopePrompt({
      transcript: lines,
      compatibilitySummary,
      allowedFormats: compatibility.contract_formats,
    }),
    { effort: 'high', label: 'envelope' },
  );

  // What the platform already knows for certain is copied, never asked of the model. The one
  // exception is the format when neither side had named any: there is no intersection to check
  // it against, and what the agents settled on is then the whole point of having asked them.
  const formatStands =
    compatibility.formats === 'unknown' ||
    (!!decided.agreed_format && compatibility.contract_formats.includes(decided.agreed_format));

  const envelope: DealEnvelope = {
    verdict: decided.verdict,
    agreed_format: formatStands ? decided.agreed_format : null,
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

  return { ok: true, data: { lines, envelope } };
}

/**
 * Double opt-in, enforced here rather than assumed by the UI: the buyer signals interest first,
 * and only then can the seller accept. Clients cannot write `matches` directly (see migration
 * 0002), so this is the only door.
 */
export async function setMatchStatus(
  matchId: string,
  action: MatchAction,
): Promise<ActionResult<Match>> {
  const user = await currentUser();
  if (!user) return { ok: false, message: 'Sign in again to continue' };

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
  if (!m) return { ok: false, message: 'Match not found' };

  // A `!fkey` embed on a many-to-one is a single object at runtime; the untyped client guesses array.
  const row = m as unknown as {
    status: MatchStatus;
    buyer: { owner_id: string };
    seller: { owner_id: string };
  };

  const isBuyer = row.buyer.owner_id === user.id;
  const isSeller = row.seller.owner_id === user.id;
  if (!isBuyer && !isSeller) return { ok: false, message: 'This match is not yours' };

  const next = nextStatus(row.status, action, isBuyer, isSeller);
  if (!next.ok) return next;
  const status = next.status;

  const { data, error } = await admin
    .from('matches').update({ status }).eq('id', matchId).select().single();
  if (error) throw error;
  return { ok: true, data: data as Match };
}

/**
 * The one read path for a match screen. Loads with the service role, then projects by role:
 * the problem text goes only to its owner, names only once both sides accepted. This is where
 * "what the buyer sees / what the seller sees" is decided — not in a component.
 */
export async function getMatchView(matchId: string): Promise<MatchView> {
  const user = await currentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: m } = await adminClient()
    .from('matches')
    .select(
      `*, problems(text),
       buyer:companies!matches_buyer_company_id_fkey(name, owner_id, profile_json),
       seller:companies!matches_seller_company_id_fkey(name, owner_id, profile_json)`,
    )
    .eq('id', matchId)
    .single();
  if (!m) throw new Error('Match not found');

  const row = m as unknown as Match & {
    problems: { text: string };
    buyer: { name: string; owner_id: string; profile_json: CompanyProfile | null };
    seller: { name: string; owner_id: string; profile_json: CompanyProfile | null };
  };

  const isBuyer = row.buyer.owner_id === user.id;
  const isSeller = row.seller.owner_id === user.id;
  if (!isBuyer && !isSeller) throw new Error('Not a party to this match');

  const accepted = row.status === 'accepted';
  const negotiating = isRunning(row.negotiation_started_at, row.deal_envelope_json);
  // On the demo account one owner holds both companies; the buying side is the one it reads.
  const seenAt = isBuyer ? row.buyer_seen_at : row.seller_seen_at;
  const negotiation: MatchView['negotiation'] =
    row.agent_dialogue_json && (row.deal_envelope_json || negotiating)
      ? { lines: row.agent_dialogue_json, envelope: row.deal_envelope_json }
      : null;

  return {
    id: row.id,
    status: row.status,
    score: row.score,
    reasoning_public: row.reasoning_public,
    viewer: isBuyer && isSeller ? 'both' : isBuyer ? 'buyer' : 'seller',
    buyer: {
      name: accepted || isBuyer ? row.buyer.name : null,
      industry: row.buyer.profile_json?.industry ?? 'undisclosed industry',
      size_hint: row.buyer.profile_json?.size_hint ?? '',
    },
    seller: {
      name: accepted || isSeller ? row.seller.name : null,
      summary: row.seller.profile_json?.summary ?? '',
    },
    problem_text: isBuyer ? row.problems.text : null,
    compatibility: row.compatibility_json,
    negotiation,
    negotiating,
    unseen: !seenAt,
    brief_md: accepted ? row.brief_md : null,
  };
}

/**
 * The companies this user owns. Both `seen` calls below take ids from the browser, so neither
 * may trust them: what the user owns is read here, and the writes are limited to it.
 */
async function ownedCompanyIds(): Promise<string[]> {
  const user = await currentUser();
  if (!user) return [];
  const { data } = await adminClient().from('companies').select('id').eq('owner_id', user.id);
  return (data ?? []).map((c) => c.id as string);
}

/**
 * The sidebar badge. Matching runs in the background now, so a match arrives while nobody is
 * on the screen — this is the number that says so. Declined matches are not news.
 */
export async function unseenMatchCount(): Promise<number> {
  const mine = await ownedCompanyIds();
  if (!mine.length) return 0;

  const list = mine.join(',');
  const { data } = await adminClient()
    .from('matches')
    .select('buyer_company_id, seller_company_id, buyer_seen_at, seller_seen_at')
    .neq('status', 'declined')
    .or(`buyer_company_id.in.(${list}),seller_company_id.in.(${list})`);

  const owns = new Set(mine);
  // Counted per row, not per side: the demo account owns both companies of every match and
  // must still see one notification, not two.
  return (data ?? []).filter(
    (m) =>
      (owns.has(m.buyer_company_id as string) && !m.buyer_seen_at) ||
      (owns.has(m.seller_company_id as string) && !m.seller_seen_at),
  ).length;
}

/**
 * These matches have now been on screen, so they stop being news. Called from the matches
 * screen after it has mounted — not while it renders, or prefetching the route from the
 * sidebar would clear the badge for someone who never opened it.
 */
export async function markMatchesSeen(matchIds: string[]): Promise<void> {
  const mine = await ownedCompanyIds();
  if (!matchIds.length || !mine.length) return;

  const admin = adminClient();
  const at = new Date().toISOString();
  await Promise.all([
    admin.from('matches').update({ buyer_seen_at: at })
      .in('id', matchIds).in('buyer_company_id', mine).is('buyer_seen_at', null),
    admin.from('matches').update({ seller_seen_at: at })
      .in('id', matchIds).in('seller_company_id', mine).is('seller_seen_at', null),
  ]);
}

/** The opt-in order itself. Every refusal here is a message the person is meant to read. */
function nextStatus(
  current: MatchStatus,
  action: MatchAction,
  isBuyer: boolean,
  isSeller: boolean,
): { ok: true; status: MatchStatus } | { ok: false; message: string } {
  if (action === 'decline') return { ok: true, status: 'declined' };

  if (action === 'interested') {
    if (!isBuyer) return { ok: false, message: 'Only the buyer can express interest' };
    if (current !== 'proposed') {
      return { ok: false, message: `Interest cannot be expressed from “${current}”` };
    }
    return { ok: true, status: 'buyer_interested' };
  }

  if (!isSeller) return { ok: false, message: 'Only the vendor can accept the meeting' };
  if (current !== 'buyer_interested') {
    return { ok: false, message: 'The buyer has not expressed interest yet — this is the double opt-in' };
  }
  return { ok: true, status: 'accepted' };
}

export async function generateBrief(matchId: string): Promise<ActionResult<string>> {
  const admin = adminClient();
  const { data: m } = await admin
    .from('matches')
    .select(`*, problems(text),
             buyer:companies!matches_buyer_company_id_fkey(name),
             seller:companies!matches_seller_company_id_fkey(name, profile_json)`)
    .eq('id', matchId)
    .single();
  if (!m) return { ok: false, message: 'Match not found' };
  if (m.brief_md) return { ok: true, data: m.brief_md };
  if (m.status !== 'accepted') {
    return { ok: false, message: 'The briefing appears once both sides have accepted the meeting' };
  }

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
    4000,
    'brief',
  );

  await admin.from('matches').update({ brief_md: brief }).eq('id', matchId);
  return { ok: true, data: brief };
}
