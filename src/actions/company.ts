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
  if (!user) throw new Error('Not authenticated');

  // Deliberately not an upsert: `owner_id` is not unique (the seed gives one owner 18 companies),
  // so ON CONFLICT has no constraint to match and every save would fail.
  const { data: existing } = await db
    .from('companies').select('id').eq('owner_id', user.id).limit(1).maybeSingle();

  const write = existing
    ? db.from('companies').update(input).eq('id', existing.id)
    : db.from('companies').insert({ ...input, owner_id: user.id });

  const { data, error } = await write.select().single();
  if (error) throw error;
  return data;
}
