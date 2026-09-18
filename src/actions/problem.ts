'use server';

import { ask } from '@/lib/claude';
import { serverClient } from '@/lib/supabase';
import { InterviewSchema, interviewPrompt } from '@/prompts/interview';
import type { InterviewTurn, Problem, ProblemInput } from '@/types';

export async function runInterview(turns: InterviewTurn[]) {
  const today = new Date().toISOString().slice(0, 10);
  return ask(InterviewSchema, interviewPrompt(turns, today), { effort: 'low' });
}

export async function saveProblem(input: ProblemInput): Promise<Problem> {
  const db = await serverClient();
  const { data, error } = await db.from('problems').insert(input).select().single();
  if (error) throw error;
  return data as Problem;
}
