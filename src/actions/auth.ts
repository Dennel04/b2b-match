'use server';

import { adminClient } from '@/lib/supabase';

/**
 * Sign-up without the confirmation email. Supabase has email confirmation on, and its default
 * mailer sends a couple of messages an hour — a live demo cannot wait for an inbox. The account
 * is created already confirmed; the client then signs in with the same password.
 */
export async function signUpConfirmed(email: string, password: string): Promise<string | null> {
  const { error } = await adminClient().auth.admin.createUser({ email, password, email_confirm: true });
  if (!error) return null;
  if (/already|registered|exists/i.test(error.message)) return 'This email already has an account. Log in instead.';
  return error.message;
}
