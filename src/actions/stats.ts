'use server';

import { adminClient, serverClient } from '@/lib/supabase';
import type { ActionResult, BlockedReason, Compatibility, CompanyStats, Requirement } from '@/types';

/**
 * The company's own funnel, for its dashboard.
 *
 * Reads with the service role because `match_candidates` is closed to every client (migration
 * 0006): those rows know which buyer considered which vendor. What comes back here is counts
 * about the caller's own company and nothing else — no problem ids, no buyer names, no dates
 * that would let a vendor work out who is currently shopping in its category.
 *
 * Returns, never throws. The dashboard awaits this during render, and Next.js strips the message
 * off anything a Server Action throws in production (CLAUDE.md), so an explanation has to come
 * back as data or it reaches the browser as "Minified React error #441".
 */
export async function getCompanyStats(): Promise<ActionResult<CompanyStats>> {
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, message: 'Sign in to see your dashboard.' };

  const admin = adminClient();
  // One owner can own several companies — the seed gives the demo account all of them — and an
  // unordered `limit(1)` lets two queries pick two different rows. Oldest first, so this half of
  // the screen is about the same company as the half the page reads for itself.
  const { data: company } = await admin
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!company) return { ok: false, message: 'Finish setting up your company and this fills in.' };

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

  const buyerRows = buyerCandidates.data ?? [];
  const buyerMatchRows = buyerMatches.data ?? [];

  const selling = funnel(
    rows.length,
    rows.filter((r) => r.cleared_terms).length,
    rows.filter((r) => r.became_match).length,
    matches.length,
  );
  const buying = funnel(
    buyerRows.length,
    buyerRows.filter((c) => c.cleared_terms).length,
    buyerMatchRows.length,
    buyerMatchRows.length,
  );

  return {
    ok: true,
    data: {
      seller: {
        considered: selling.considered,
        cleared_terms: selling.cleared_terms,
        shown: selling.shown,
        avg_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        proceed: matches.filter((m) => m.deal_envelope_json?.verdict === 'proceed').length,
        buyer_interested: countStatus('buyer_interested'),
        accepted: countStatus('accepted'),
        declined: countStatus('declined'),
        blocked_by: blockedReasons(rows),
      },
      buyer: {
        problems: problemIds.length,
        candidates_evaluated: buying.considered,
        cleared_terms: buying.cleared_terms,
        matches: buying.shown,
        accepted: buyerMatchRows.filter((m) => m.status === 'accepted').length,
      },
    },
  };
}

/**
 * The three top steps, floored so a step can never be narrower than the one below it.
 *
 * A match IS a vendor that was shown, and therefore one that cleared the terms and was
 * considered. `match_candidates` only started recording at migration 0006, and `findMatches()`
 * re-marks an existing pair `became_match: false` when it runs a second time on the same
 * problem, so the candidate rows can under-report. Without this floor the funnel reads
 * "considered 0 → shown 5", which is worse than an approximation: it is wrong.
 */
function funnel(considered: number, cleared: number, became: number, matches: number) {
  const shown = Math.max(became, matches);
  const clearedTerms = Math.max(cleared, shown);
  return { considered: Math.max(considered, clearedTerms), cleared_terms: clearedTerms, shown };
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
