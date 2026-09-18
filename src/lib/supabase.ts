import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser client. Subject to RLS. */
export const browserClient = () => createBrowserClient(URL, ANON);

/** Client for Server Components and Server Actions. Subject to RLS, knows the user. */
export async function serverClient() {
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
}

/**
 * Bypasses RLS. Server-side matching ONLY.
 * Nothing this client reads from `problems` may be returned to a client directly.
 */
export const adminClient = () =>
  createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
