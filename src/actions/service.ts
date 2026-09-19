'use server';

import { ask } from '@/lib/claude';
import { currentUser, serverClient } from '@/lib/supabase';
import { ServiceInterviewSchema, serviceInterviewPrompt } from '@/prompts/service';
import type { ActionResult, CompanyProfile, InterviewTurn, Service, ServiceInput } from '@/types';

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
  return ask(ServiceInterviewSchema, serviceInterviewPrompt(turns, today, context, areas, known), {
    effort: 'low',
    maxTokens: 1500,
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
  if (error) {
    return { ok: false, message: 'Could not publish the service. Try again.' };
  }
  return { ok: true, data: data as Service };
}

/** Pause a service so it stops being matched, or put it back. */
export async function setServiceActive(id: string, active: boolean): Promise<ActionResult<Service>> {
  const user = await currentUser();
  if (!user) return { ok: false, message: 'Sign in again to continue' };

  const db = await serverClient();
  const { data, error } = await db.from('services').update({ active }).eq('id', id).select().single();
  if (error) return { ok: false, message: 'Could not change the service. Try again.' };
  return { ok: true, data: data as Service };
}
