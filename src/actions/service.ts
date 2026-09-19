'use server';

import { ask } from '@/lib/claude';
import { currentUser, serverClient } from '@/lib/supabase';
import { ServiceInterviewSchema, serviceInterviewPrompt } from '@/prompts/service';
import type { ActionResult, CompanyProfile, InterviewTurn, Service, ServiceInput } from '@/types';
import { writeFailed } from './result';

/**
 * One turn of the selling-side interview. Pass the caller's company profile when there is one:
 * the questions get sharper and the ones the profile already answers are skipped.
 *
 * The buyer's interview and this one are separate prompts on purpose. They ask opposite things —
 * one digs for a pain the person is reluctant to state, the other tidies a product the person
 * knows by heart — and a single prompt that tried to do both would do neither well.
 */
export async function runServiceInterview(
  turns: InterviewTurn[],
  company?: CompanyProfile | null,
  /** The parts of a buyer's business the UI offers, so the interviewer picks one of them. */
  areas: string[] = [],
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
  return ask(ServiceInterviewSchema, serviceInterviewPrompt(turns, today, context, areas, known), {
    effort: 'low',
    maxTokens: 6000,
    label: 'service-interview',
  });
}

/**
 * Publish a service. RLS (`services_write`, migration 0007) already limits the insert to a
 * company the caller owns, so this needs no service role — and the ownership check below is
 * the readable error, not the guard.
 */
export async function saveService(input: ServiceInput): Promise<ActionResult<Service>> {
  const user = await currentUser();
  if (!user) return { ok: false, message: 'Sign in again to continue' };

  const db = await serverClient();
  const { data, error } = await db.from('services').insert(input).select().single();
  if (error) return writeFailed('saveService', error, 'service');
  return { ok: true, data: data as Service };
}

/** Pause a service so it stops being matched, or put it back. */
export async function setServiceActive(id: string, active: boolean): Promise<ActionResult<Service>> {
  const user = await currentUser();
  if (!user) return { ok: false, message: 'Sign in again to continue' };

  const db = await serverClient();
  const { data, error } = await db.from('services').update({ active }).eq('id', id).select().single();
  if (error) return writeFailed('setServiceActive', error, 'service');
  return { ok: true, data: data as Service };
}
