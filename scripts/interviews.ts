/**
 * Read back what the interview actually asked and what people actually answered.
 * Run: npx tsx --env-file=.env.local scripts/interviews.ts        — the last 10
 *      npx tsx --env-file=.env.local scripts/interviews.ts 3      — the last 3
 *
 * `interview_json` is the transcript the screen stored, so this is the real thing, not a
 * reconstruction: every question in the order it was asked, scripted ones included. Reading it
 * is how you find out that a question was asked twice, or that a chip list was offered to
 * someone it made no sense for — both invisible from the code alone.
 *
 * It prints problems the signed-in service role can see, which is all of them. Keep the output
 * out of anything public: these are private problems.
 */
import { adminClient } from '../src/lib/supabase';
import type { BuyerTerms, InterviewTurn } from '../src/types';

const limit = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 10);

async function main() {
  const db = adminClient();
  const { data, error } = await db
    .from('problems')
    .select('id, text, department, buyer_terms, interview_json, created_at, companies(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  for (const p of data ?? []) {
    const company = (p.companies as unknown as { name: string } | null)?.name ?? 'unknown';
    const turns = (p.interview_json ?? []) as InterviewTurn[];
    const t = p.buyer_terms as BuyerTerms | null;

    console.log(`\n${'─'.repeat(78)}`);
    console.log(`${company}  ·  ${new Date(p.created_at).toLocaleString('en-GB')}  ·  ${p.id.slice(0, 8)}`);
    console.log(`department: ${p.department ?? '—'}`);
    console.log(`terms:      ceiling ${t?.budget_ceiling ? `€${t.budget_ceiling.amount} ${t.budget_ceiling.period}` : '—'}` +
      `  start ${t?.start_by ?? '—'}  formats ${t?.contract_formats.join('/') || '—'}` +
      `  requires ${t?.requirements.join('/') || '—'}`);
    console.log(`\n${p.text.split('\n')[0]}`);
    console.log(`\n${turns.length} turns:`);
    turns.forEach((x, i) => {
      console.log(`\n  ${i + 1}. Q: ${x.question || '(no question recorded)'}`);
      console.log(`     A: ${x.answer}`);
    });
  }
  console.log(`\n${'─'.repeat(78)}\n${data?.length ?? 0} problems\n`);
}

void main();
