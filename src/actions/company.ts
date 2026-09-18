'use server';

import { serverClient } from '@/lib/supabase';
import type { CompanyProfile, SellerTerms } from '@/types';

export async function saveCompany(input: {
  name: string;
  website: string | null;
  role: 'seller' | 'buyer' | 'both';
  profile_json: CompanyProfile | null;
  seller_terms?: SellerTerms | null;
}) {
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Не авторизован');

  const { data, error } = await db
    .from('companies')
    .upsert({ ...input, owner_id: user.id }, { onConflict: 'owner_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
