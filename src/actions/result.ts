import type { PostgrestError } from '@supabase/supabase-js';

/**
 * What to tell the person when a write fails, and what to leave in the server log.
 *
 * Next.js strips a thrown message in production, so a Server Action that throws reaches the
 * browser as "Minified React error" and the screen can only offer "Try again" — which is how a
 * missing migration spent a day looking like a broken form. The real Postgres error goes to the
 * log (terminal locally, Vercel → Logs in production) and the person gets a line that says
 * whether trying again is worth anything.
 *
 * The return type is the failure half of `ActionResult<T>`, so it assigns to any of them.
 */
export function writeFailed(where: string, error: PostgrestError, thing: string): { ok: false; message: string } {
  console.error(`[${where}] ${error.code ?? '—'} ${error.message}${error.details ? ` — ${error.details}` : ''}`);

  // The row exists but this user may not write it: signing in again is a real fix.
  if (error.code === '42501') return { ok: false, message: 'Sign in again to continue' };

  // The column or table the screen writes to is not in the database. A deploy is behind, and no
  // amount of retrying will help — saying "try again" would just waste the person's afternoon.
  if (SCHEMA_CODES.has(error.code)) {
    return { ok: false, message: `Saving is unavailable: the database is missing a change this screen needs. Nobody can save a ${thing} until it is applied.` };
  }

  return { ok: false, message: `Could not save the ${thing}. Try again.` };
}

/** 42703 undefined column, 42P01 undefined table, PGRST204/205: the same gap, seen by PostgREST. */
const SCHEMA_CODES = new Set(['42703', '42P01', 'PGRST204', 'PGRST205']);
