import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser client. Subject to RLS. */
export const browserClient = () => createBrowserClient(URL, ANON);

/**
 * Client for Server Components and Server Actions. Subject to RLS, knows the user.
 *
 * `cache()` makes it one client per request: a screen that renders several sections, or calls
 * an action per row, would otherwise read the cookie store and build a client each time.
 */
export const serverClient = cache(async function serverClient() {
  const store = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a Server Component — middleware will set the cookies
        }
      },
    },
  });
});

/**
 * The signed-in user, once per request.
 *
 * `auth.getUser()` is a round trip to the auth server every time it is called — it validates
 * the token rather than trusting the cookie. Anything that runs per row (getMatchView on a
 * list of matches) would pay that once per row; through here the whole request pays it once.
 */
export const currentUser = cache(async () => {
  const db = await serverClient();
  const { data } = await db.auth.getUser();
  return data.user;
});

/**
 * Bypasses RLS. Server-side matching ONLY.
 * Nothing this client reads from `problems` may be returned to a client directly.
 */
export const adminClient = () =>
  createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
