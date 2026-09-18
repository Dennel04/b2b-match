'use server';

import { ask, askText } from '@/lib/claude';
import { checkCompatibility, describeCompatibility, FORMAT_LABELS } from '@/lib/overlap';
import { adminClient, serverClient } from '@/lib/supabase';
import { briefPrompt } from '@/prompts/brief';
import { MatchScoresSchema, matchPrompt } from '@/prompts/match';
import { NegotiationSchema, negotiatePrompt } from '@/prompts/negotiate';
import type {
  BuyerTerms,
  CompanyProfile,
  DealEnvelope,
  Match,
  MatchAction,
  Negotiation,
  SellerTerms,
} from '@/types';

const SCORE_THRESHOLD = 70;

const EMPTY_BUYER_TERMS: BuyerTerms = {
  budget_ceiling: null,
  contract_formats: [],
  start_by: null,
  requirements: [],
  dealbreakers: [],
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
      compatibility: checkCompatibility(buyerTerms, (s.seller_terms ?? {
        budget_floor: null,
        contract_formats: [],
        available_from: null,
        capabilities: [],
      }) as SellerTerms),
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
 * The core of the product: the agents negotiate with no human in the loop.
 * The result is cached in the database — nothing may hang on stage.
 */
export async function negotiate(matchId: string): Promise<Negotiation> {
  const admin = adminClient();
  const { data: m } = await admin
    .from('matches')
    .select('*, problems(text, buyer_terms), seller:companies!matches_seller_company_id_fkey(profile_json)')
    .eq('id', matchId)
    .single();
  if (!m) throw new Error('Match not found');

  if (m.agent_dialogue_json && m.deal_envelope_json) {
    return { lines: m.agent_dialogue_json, envelope: m.deal_envelope_json };
  }

  const seller = m.seller.profile_json as CompanyProfile;
  const buyerTerms: BuyerTerms = m.problems.buyer_terms ?? EMPTY_BUYER_TERMS;

  const result = await ask(
    NegotiationSchema,
    negotiatePrompt({
      problemText: m.problems.text,
      dealbreakers: buyerTerms.dealbreakers,
      sellerSummary: seller.summary,
      sellerServices: seller.services,
      compatibilitySummary: describeCompatibility(m.compatibility_json),
    }),
    { effort: 'high' },
  );

  await admin
    .from('matches')
    .update({
      agent_dialogue_json: result.lines,
      deal_envelope_json: result.envelope,
      status: result.envelope.verdict === 'reject' ? 'declined' : 'proposed',
    })
    .eq('id', matchId);

  return result;
}

export async function setMatchStatus(matchId: string, action: MatchAction): Promise<Match> {
  const status =
    action === 'interested' ? 'buyer_interested' : action === 'accept' ? 'accepted' : 'declined';

  const db = await serverClient();
  const { data, error } = await db
    .from('matches').update({ status }).eq('id', matchId).select().single();
  if (error) throw error;
  return data as Match;
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
