'use server';

import { ask } from '@/lib/claude';
import { scrapeSite } from '@/lib/scrape';
import { serverClient } from '@/lib/supabase';
import { ProfileSchema, profilePrompt } from '@/prompts/profile';
import type { CompanyProfile } from '@/types';

export async function scrapeAndProfile(website: string): Promise<CompanyProfile> {
  const text = await scrapeSite(website);
  return ask(ProfileSchema, profilePrompt(text));
}

export async function saveCompany(input: {
  name: string;
  website: string | null;
  role: 'seller' | 'buyer' | 'both';
  profile_json: CompanyProfile | null;
  raw_scraped_text?: string | null;
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
