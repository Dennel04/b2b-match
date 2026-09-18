import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Клиент для браузера. Уважает RLS. */
export const browserClient = () => createBrowserClient(URL, ANON);

/** Клиент для Server Components и Server Actions. Уважает RLS, знает пользователя. */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // вызов из Server Component — куки выставит middleware
        }
      },
    },
  });
}

/**
 * Обходит RLS. ТОЛЬКО для матчинга на сервере.
 * Ничего, что прочитано этим клиентом из problems, не возвращать на клиент напрямую.
 */
export const adminClient = () =>
  createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
