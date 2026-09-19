/**
 * Fills match_candidates for problems that were matched before migration 0004 existed.
 * Run once, after applying 0004: npm run backfill:candidates
 *
 * Recomputes the mechanical stage only — checkCompatibility() is pure and free — so this costs
 * no model calls and creates no matches. Scores come from the matches that were actually
 * stored; vendors that cleared the terms but scored below the threshold keep score = null,
 * because that number was never recorded.
 */
import { checkCompatibility } from '../src/lib/overlap';
import { adminClient } from '../src/lib/supabase';
import type { BuyerTerms, SellerTerms } from '../src/types';

const EMPTY_BUYER: BuyerTerms = {
  budget_ceiling: null, contract_formats: [], start_by: null, requirements: [], dealbreakers: [],
};
const EMPTY_SELLER: SellerTerms = {
  budget_floor: null, contract_formats: [], available_from: null, capabilities: [],
};

async function main() {
  const db = adminClient();

  const { data: problems, error: pErr } = await db
    .from('problems').select('id, company_id, buyer_terms');
  if (pErr) throw pErr;

  const { data: sellers, error: sErr } = await db
    .from('companies').select('id, profile_json, seller_terms').in('role', ['seller', 'both']);
  if (sErr) throw sErr;

  const { data: matches, error: mErr } = await db
    .from('matches').select('problem_id, seller_company_id, score');
  if (mErr) throw mErr;

  const matched = new Map(
    (matches ?? []).map((m) => [`${m.problem_id}:${m.seller_company_id}`, m.score as number]),
  );

  const rows = [];
  for (const problem of problems ?? []) {
    const buyerTerms = (problem.buyer_terms ?? EMPTY_BUYER) as BuyerTerms;
    for (const seller of sellers ?? []) {
      if (seller.id === problem.company_id || !seller.profile_json) continue;
      const compatibility = checkCompatibility(buyerTerms, (seller.seller_terms ?? EMPTY_SELLER) as SellerTerms);
      const score = matched.get(`${problem.id}:${seller.id}`);
      rows.push({
        problem_id: problem.id,
        seller_company_id: seller.id,
        cleared_terms: !compatibility.hard_fail,
        compatibility_json: compatibility,
        score: score ?? null,
        became_match: score !== undefined,
      });
    }
  }

  const { error } = await db
    .from('match_candidates').upsert(rows, { onConflict: 'problem_id,seller_company_id' });
  if (error) throw error;

  const cleared = rows.filter((r) => r.cleared_terms).length;
  console.log(
    `${rows.length} candidate rows across ${problems?.length ?? 0} problems: ` +
      `${cleared} cleared the terms, ${rows.filter((r) => r.became_match).length} became matches.`,
  );
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
