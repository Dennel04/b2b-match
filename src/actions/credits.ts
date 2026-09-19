'use server';

import Stripe from 'stripe';
import { UNLOCK_COST, packFor } from '@/lib/credits';
import { adminClient, currentUser, serverClient } from '@/lib/supabase';
import type { ActionResult } from '@/types';
import { getMatchView } from './match';

/**
 * Spending and topping up the credit balance.
 *
 * Every write here runs through the service role: a client cannot move its own balance, the
 * same rule that keeps `matches` server-only (migration 0002). Reads stay on the user's client,
 * where RLS already limits the rows to the company it owns.
 */

/** The viewer's company, or null when signed out. */
async function ownCompany() {
  const user = await currentUser();
  if (!user) return null;
  const db = await serverClient();
  const { data } = await db.from('companies').select('id, credits').eq('owner_id', user.id).limit(1).maybeSingle();
  return data as { id: string; credits: number } | null;
}

/** The balance in the top bar. Null means nobody is signed in, and the coin is not drawn. */
export async function myCredits(): Promise<number | null> {
  return (await ownCompany())?.credits ?? null;
}

/** Matches this company has already paid to open. The list blurs everything else. */
export async function unlockedMatchIds(): Promise<string[]> {
  const db = await serverClient();
  const { data } = await db.from('match_unlocks').select('match_id');
  return (data ?? []).map((r) => r.match_id as string);
}

/**
 * Open one counterparty. Returns the balance left, so the coin in the bar can move without a
 * round trip of its own.
 */
export async function unlockMatch(matchId: string): Promise<ActionResult<number>> {
  const company = await ownCompany();
  if (!company) return { ok: false, message: 'Sign in again to continue' };

  // Throws unless the viewer is a party to this match — the authorisation, not a projection.
  try {
    await getMatchView(matchId);
  } catch {
    return { ok: false, message: 'That match is not yours to open' };
  }

  const admin = adminClient();
  const { data: already } = await admin
    .from('match_unlocks').select('match_id').eq('match_id', matchId).eq('company_id', company.id).maybeSingle();
  if (already) return { ok: true, data: company.credits };

  if (company.credits < UNLOCK_COST) return { ok: false, message: 'Not enough credits' };

  // Charge first, on the balance we read: `eq('credits', …)` makes a second tab that spent in
  // between lose the race instead of overdrawing.
  // ponytail: optimistic check, not a lock. A real ledger is a table of movements, not a column.
  const { data: charged } = await admin
    .from('companies')
    .update({ credits: company.credits - UNLOCK_COST })
    .eq('id', company.id)
    .eq('credits', company.credits)
    .select('credits')
    .maybeSingle();
  if (!charged) return { ok: false, message: 'Your balance changed. Try again.' };

  const { error } = await admin
    .from('match_unlocks').insert({ match_id: matchId, company_id: company.id, spent: UNLOCK_COST });
  if (error) {
    await admin.from('companies').update({ credits: company.credits }).eq('id', company.id);
    console.error('[credits] unlock failed', error.message);
    return { ok: false, message: 'Could not open that match. Nothing was charged.' };
  }

  return { ok: true, data: charged.credits as number };
}

/**
 * Grant the credits a Stripe session was paid for.
 *
 * There is no webhook (STRIPE_INTEGRATION_TODO.md): the browser comes back to /credits with the
 * session id and this verifies it against Stripe directly. The session id is the primary key of
 * `credit_purchases`, so a reloaded success page — or a bookmarked one — grants nothing twice.
 */
export async function claimCheckout(sessionId: string): Promise<ActionResult<number>> {
  const company = await ownCompany();
  if (!company) return { ok: false, message: 'Sign in again to continue' };
  if (!process.env.STRIPE_SECRET_KEY) return { ok: false, message: 'Payments are not configured on this deployment' };

  const admin = adminClient();
  const { data: seen } = await admin.from('credit_purchases').select('session_id').eq('session_id', sessionId).maybeSingle();
  if (seen) return { ok: true, data: company.credits };

  let session: Stripe.Checkout.Session;
  try {
    session = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(sessionId);
  } catch (e) {
    console.error('[credits] session lookup failed', e);
    return { ok: false, message: 'Could not check that payment with Stripe' };
  }

  if (session.payment_status !== 'paid') return { ok: false, message: 'That payment has not gone through' };
  const credits = packFor(Number(session.metadata?.credits))?.credits;
  if (!credits || session.metadata?.company_id !== company.id)
    return { ok: false, message: 'That payment was for another account' };

  // The receipt goes in first: if the balance write fails, a reload retries the grant rather
  // than handing the coins out twice.
  const { error } = await admin
    .from('credit_purchases')
    .insert({ session_id: sessionId, company_id: company.id, credits, cents: session.amount_total ?? 0 });
  if (error) return { ok: true, data: company.credits };

  const { data: topped } = await admin
    .from('companies')
    .update({ credits: company.credits + credits })
    .eq('id', company.id)
    .select('credits')
    .maybeSingle();

  return { ok: true, data: (topped?.credits as number) ?? company.credits + credits };
}
