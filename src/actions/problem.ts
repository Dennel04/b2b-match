'use server';

import { ask } from '@/lib/claude';
import { serverClient } from '@/lib/supabase';
import { InterviewSchema, interviewPrompt } from '@/prompts/interview';
import type { CompanyProfile, InterviewTurn, Problem, ProblemInput } from '@/types';

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
  return ask(InterviewSchema, interviewPrompt(turns, today, context, departments, known), { effort: 'low', maxTokens: 1500 });
}

export async function saveProblem(input: ProblemInput): Promise<Problem> {
  const db = await serverClient();
  const { data, error } = await db.from('problems').insert(input).select().single();
  if (error) throw error;
  return data as Problem;
}
