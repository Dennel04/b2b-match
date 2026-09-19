/**
 * The background matcher. Nobody presses "find matches" any more: this runs on a cron and does
 * everything the platform can work out on its own.
 *
 *   npm run sweep              — until the work runs out
 *   npm run sweep -- --dry     — say what it would do, call nothing
 *
 * Two kinds of work, in this order:
 *   1. a problem that has vendors nobody has judged for it yet — new problem, or a vendor that
 *      registered since the last pass. `match_candidates` is the memory of what has been
 *      compared, so "who is new" is a set difference, not a guess about similar fields.
 *   2. a match whose agents have not talked yet.
 *
 * Every step it takes is recorded before the next one starts, so stopping it halfway and
 * starting it again costs nothing and repeats nothing. That is what makes it safe on a cron.
 * Two copies at once would still duplicate model calls — the crontab holds a flock for that.
 */
import { findMatches, negotiate } from '../src/actions/match';
import { matchableSellers, needsNegotiation, staleProblems } from '../src/lib/sweep';
import { adminClient } from '../src/lib/supabase';
import type { Match } from '../src/types';

const dry = process.argv.includes('--dry');

async function main() {
  const db = adminClient();
  const started = Date.now();

  const [{ data: sellers }, { data: problems }, { data: candidates }] = await Promise.all([
    // profile_json comes along because a vendor without one is not work to do — see
    // matchableSellers(). The column is the vendor's own storefront, not anyone's problem.
    db.from('companies').select('id, profile_json').in('role', ['seller', 'both']),
    // Newest first: someone who wrote a problem this morning is matched before a month-old one
    // is re-swept against one new vendor.
    db.from('problems').select('id, company_id, text').order('created_at', { ascending: false }),
    db.from('match_candidates').select('problem_id, seller_company_id'),
  ]);

  const everySeller = matchableSellers((sellers ?? []) as { id: string; profile_json: unknown }[]);
  const considered = new Map<string, Set<string>>();
  for (const c of candidates ?? []) {
    const seen = considered.get(c.problem_id as string) ?? new Set<string>();
    seen.add(c.seller_company_id as string);
    considered.set(c.problem_id as string, seen);
  }

  const stale = staleProblems(
    (problems ?? []).map((p) => ({ id: p.id as string, company_id: p.company_id as string, text: p.text as string })),
    everySeller,
    considered,
  );

  console.log(`${stale.length}/${problems?.length ?? 0} problem(s) have vendors nobody has judged`);

  let found = 0;
  for (const p of stale) {
    const text = p.text.slice(0, 60);
    if (dry) {
      console.log(`  would match  ${p.id.slice(0, 8)}  "${text}…"`);
      continue;
    }
    try {
      const matches = await findMatches(p.id);
      found += matches.length;
      console.log(`  matched      ${p.id.slice(0, 8)}  "${text}…"  → ${matches.length} new`);
    } catch (e) {
      console.error(`  FAILED       ${p.id.slice(0, 8)}  ${(e as Error).message}`);
    }
  }

  // Read after matching, so anything found a moment ago negotiates in the same pass.
  const { data: pending } = await db
    .from('matches')
    .select('id, score, negotiation_started_at, deal_envelope_json')
    .is('deal_envelope_json', null)
    .order('created_at', { ascending: false });

  const todo = needsNegotiation(
    (pending ?? []) as unknown as Pick<Match, 'id' | 'score' | 'deal_envelope_json' | 'negotiation_started_at'>[],
  );

  console.log(`${todo.length} match(es) waiting on their agents`);

  for (const m of todo) {
    if (dry) {
      console.log(`  would talk   ${m.id.slice(0, 8)}  score ${m.score}`);
      continue;
    }
    const t = Date.now();
    try {
      const result = await negotiate(m.id);
      if (!result.ok) {
        console.log(`  refused      ${m.id.slice(0, 8)}  ${result.message}`);
        continue;
      }
      const { envelope } = result.data;
      console.log(
        `  talked       ${m.id.slice(0, 8)}  score ${m.score} → ${envelope.verdict} ` +
          `(confidence ${envelope.confidence}) in ${((Date.now() - t) / 1000).toFixed(1)}s`,
      );
    } catch (e) {
      console.error(`  FAILED       ${m.id.slice(0, 8)}  ${(e as Error).message}`);
    }
  }

  console.log(`swept in ${((Date.now() - started) / 1000).toFixed(1)}s — ${found} new match(es)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
