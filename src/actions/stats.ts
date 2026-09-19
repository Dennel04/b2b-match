'use server';

import { adminClient, serverClient } from '@/lib/supabase';
import type { BlockedReason, Compatibility, CompanyStats, Requirement } from '@/types';

/**
 * The company's own funnel, for its dashboard.
 *
 * Reads with the service role because `match_candidates` is closed to every client (migration
 * 0006): those rows know which buyer considered which vendor. What comes back here is counts
 * about the caller's own company and nothing else — no problem ids, no buyer names, no dates
 * that would let a vendor work out who is currently shopping in its category.
 */
export async function getCompanyStats(): Promise<CompanyStats> {
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = adminClient();
  const { data: company } = await admin
    .from('companies').select('id').eq('owner_id', user.id).limit(1).maybeSingle();
  if (!company) throw new Error('No company yet — finish setup first');

  const [candidates, sellerMatches, problems] = await Promise.all([
    admin
      .from('match_candidates')
      .select('cleared_terms, compatibility_json, score, became_match')
      .eq('seller_company_id', company.id),
    admin
      .from('matches')
      .select('status, deal_envelope_json')
      .eq('seller_company_id', company.id),
    admin.from('problems').select('id').eq('company_id', company.id),
  ]);

  const rows = candidates.data ?? [];
  const scores = rows.map((r) => r.score).filter((s): s is number => s !== null);

  const matches = sellerMatches.data ?? [];
  const countStatus = (status: string) => matches.filter((m) => m.status === status).length;

  const problemIds = (problems.data ?? []).map((p) => p.id);
  const [buyerCandidates, buyerMatches] = await Promise.all([
    problemIds.length
      ? admin.from('match_candidates').select('cleared_terms').in('problem_id', problemIds)
      : Promise.resolve({ data: [] as { cleared_terms: boolean }[] }),
    problemIds.length
      ? admin.from('matches').select('status').in('problem_id', problemIds)
      : Promise.resolve({ data: [] as { status: string }[] }),
  ]);

  return {
    seller: {
      considered: rows.length,
      cleared_terms: rows.filter((r) => r.cleared_terms).length,
      shown: rows.filter((r) => r.became_match).length,
      avg_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      proceed: matches.filter((m) => m.deal_envelope_json?.verdict === 'proceed').length,
      buyer_interested: countStatus('buyer_interested'),
      accepted: countStatus('accepted'),
      declined: countStatus('declined'),
      blocked_by: blockedReasons(rows),
    },
    buyer: {
      problems: problemIds.length,
      candidates_evaluated: (buyerCandidates.data ?? []).length,
      cleared_terms: (buyerCandidates.data ?? []).filter((c) => c.cleared_terms).length,
      matches: (buyerMatches.data ?? []).length,
      accepted: (buyerMatches.data ?? []).filter((m) => m.status === 'accepted').length,
    },
  };
}

const REQUIREMENT_LABELS: Record<Requirement, string> = {
  gdpr_dpa: 'You do not offer to sign a DPA',
  iso27001: 'You are not ISO 27001 certified',
  eu_data_residency: 'You do not offer EU data residency',
  estonian_language: 'You do not work in Estonian',
  english_language: 'You do not work in English',
  on_site: 'You do not work on site',
  industry_refs: 'You have no references in their industry',
};

/** Why this vendor lost, in its own terms. The fix is always on the vendor's side of the wall. */
function blockedReasons(
  rows: { cleared_terms: boolean; compatibility_json: Compatibility | null }[],
): BlockedReason[] {
  const counts = new Map<string, number>();
  const bump = (reason: string) => counts.set(reason, (counts.get(reason) ?? 0) + 1);

  for (const row of rows) {
    if (row.cleared_terms || !row.compatibility_json) continue;
    const c = row.compatibility_json;
    if (c.budget === 'gap') bump('Your minimum deal size was above their ceiling');
    if (c.timeline === 'gap') bump('You were not free by the date they needed');
    if (!c.contract_formats.length) bump('No contract format you both accept');
    for (const missing of c.missing_requirements) bump(REQUIREMENT_LABELS[missing]);
  }

  return [...counts].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
}
