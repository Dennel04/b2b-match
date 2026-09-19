/**
 * Pre-generate everything the demo will show, so nothing calls the model on stage.
 * Run: npm run warm                        — every problem: find matches, negotiate each one
 *      npm run warm -- --one               — the first problem only, for a quick end-to-end test
 *      npm run warm -- --company=Apteek    — problems of companies whose name contains this
 *
 * Results are cached in the database; re-running only fills what is missing.
 */
import { findMatches, negotiate } from '../src/actions/match';
import { adminClient } from '../src/lib/supabase';
import type { Match } from '../src/types';

const onlyOne = process.argv.includes('--one');
const companyFilter = process.argv.find((a) => a.startsWith('--company='))?.slice('--company='.length).toLowerCase();

async function main() {
  const db = adminClient();
  const { data: problems, error } = await db
    .from('problems')
    .select('id, text, companies(name)')
    .order('created_at');
  if (error) throw error;
  if (!problems?.length) throw new Error('No problems in the database — run npm run seed first');

  const ownerOf = (p: unknown) => (p as { companies: { name: string } }).companies.name;
  let todo = companyFilter ? problems.filter((p) => ownerOf(p).toLowerCase().includes(companyFilter)) : problems;
  if (onlyOne) todo = todo.slice(0, 1);
  console.log(`${todo.length} problem(s) to warm\n`);

  for (const p of todo) {
    const owner = ownerOf(p);
    console.log(`▶ ${owner}: "${p.text.slice(0, 70)}…"`);

    const { data: existing } = await db.from('matches').select('*').eq('problem_id', p.id);
    let matches = (existing ?? []) as Match[];

    if (!matches.length) {
      const t = Date.now();
      matches = await findMatches(p.id);
      console.log(`  matched ${matches.length} vendor(s) in ${((Date.now() - t) / 1000).toFixed(1)}s`);
      if (!matches.length) console.log('  (nothing above threshold — the filter or the scorer said no)');
    } else {
      console.log(`  ${matches.length} match(es) already stored`);
    }

    for (const m of matches) {
      if (m.status === 'declined' && m.deal_envelope_json) continue;
      if (m.agent_dialogue_json && m.deal_envelope_json) {
        console.log(`  · ${m.id.slice(0, 8)} score ${m.score} — negotiation cached`);
        continue;
      }
      const t = Date.now();
      try {
        const result = await negotiate(m.id);
        if (!result.ok) {
          console.log(`  · ${m.id.slice(0, 8)} REFUSED: ${result.message}`);
          continue;
        }
        const { lines, envelope } = result.data;
        const withheld = lines.filter((l) => l.withheld).length;
        console.log(
          `  · ${m.id.slice(0, 8)} score ${m.score} → ${envelope.verdict} ` +
            `(${envelope.agreed_format ?? 'no format'}, confidence ${envelope.confidence}, ` +
            `${withheld} withheld) in ${((Date.now() - t) / 1000).toFixed(1)}s`,
        );
      } catch (e) {
        console.log(`  · ${m.id.slice(0, 8)} FAILED: ${(e as Error).message}`);
      }
    }
    console.log();
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
