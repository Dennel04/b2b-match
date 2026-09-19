'use server';

import { ask } from '@/lib/claude';
import { currentUser, serverClient } from '@/lib/supabase';
import { InterviewSchema, interviewPrompt } from '@/prompts/interview';
import type { ActionResult, CompanyProfile, InterviewTurn, Problem, ProblemInput } from '@/types';
import { writeFailed } from './result';

/**
 * One interview turn. Pass the caller's company profile when there is one: the questions get
 * sharper and the ones the profile already answers are skipped.
 */
export async function runInterview(
  turns: InterviewTurn[],
  company?: CompanyProfile | null,
  /** The parts of the business the UI offers, so the interviewer picks one of them. */
  departments: string[] = [],
  /** What the person already typed into the form themselves — never asked about again. */
  known = '',
) {
  const today = new Date().toISOString().slice(0, 10);
  const context = company
    ? { industry: company.industry, size_hint: company.size_hint, summary: company.summary }
    : null;
  // 6000, not the 1500 this started at: on DeepSeek the thinking shares the output budget, so
  // 1500 overflowed on nearly every turn, and an overflow is not a trim — complete() doubles the
  // budget and generates the whole reply again. The logs were unambiguous: 1 call 4.6-7.4s,
  // 2 calls 15-19s, 3 calls 29-41s, with finished replies landing around 4k tokens. Paying for
  // headroom once beats paying for the same answer three times.
  return ask(InterviewSchema, interviewPrompt(turns, today, context, departments, known), { effort: 'low', maxTokens: 6000, label: 'interview' });
}

/**
 * Write the problem down. RLS (`problems_owner`) already limits the insert to a company the
 * caller owns; the check below is the readable error, not the guard.
 */
export async function saveProblem(input: ProblemInput): Promise<ActionResult<Problem>> {
  const user = await currentUser();
  if (!user) return { ok: false, message: 'Sign in again to continue' };

  // The transcript is the only record of what was actually asked. It came back empty from the
  // first real runs and there was no way to tell a chat that stored nothing from a form filled
  // in by hand, so the count is logged: `scripts/interviews.ts` reads the rest back.
  console.log(
    `[save] problem  turns=${input.interview_json?.length ?? 0}  dept=${input.department ?? '—'}`,
  );

  const db = await serverClient();
  const { data, error } = await db.from('problems').insert(input).select().single();
  if (error) return writeFailed('saveProblem', error, 'problem');
  return { ok: true, data: data as Problem };
}
