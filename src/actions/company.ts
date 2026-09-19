'use server';

import { ask } from '@/lib/claude';
import { domainFromEmail, normaliseWebsite, readWebsite, type SitePage } from '@/lib/scrape';
import { serverClient } from '@/lib/supabase';
import { ProfileDraftSchema, profileDraftPrompt } from '@/prompts/profile';
import type { CompanyDraft, CompanyProfile, SellerTerms } from '@/types';

/**
 * Zero-typing onboarding. Pass a website, or nothing to use the signed-in user's email domain.
 * ~10-20 s. Throws with a plain message when the site cannot be read — the screen then falls
 * back to the manual form. The result is a draft: show it, let them edit, then saveCompany().
 */
export async function draftCompanyProfile(website?: string): Promise<CompanyDraft> {
  let site = website?.trim();
  if (!site) {
    const db = await serverClient();
    const { data: { user } } = await db.auth.getUser();
    const domain = user?.email ? domainFromEmail(user.email) : null;
    if (!domain) throw new Error('No company website to read — enter it, or fill the profile by hand');
    site = domain;
  }
  site = normaliseWebsite(site);

  const pages = await readWebsite(site);
  if (!pages.length) throw new Error(`Could not read ${site} — fill the profile by hand`);

  return draftFrom(site, pages);
}

/**
 * The same draft from text the person pastes: an "about us", a pitch deck copied out of a PDF, a
 * LinkedIn page. For companies whose site cannot be read or says too little. ~10 s.
 */
export async function draftCompanyProfileFromText(text: string): Promise<CompanyDraft> {
  const body = text.trim().slice(0, 14000);
  if (body.length < 80) throw new Error('Paste a few sentences about the company — a paragraph at least');
  return draftFrom('', [{ url: 'pasted text', text: body }]);
}

async function draftFrom(site: string, pages: SitePage[]): Promise<CompanyDraft> {
  const draft = await ask(ProfileDraftSchema, profileDraftPrompt(site || 'not given', pages), { effort: 'medium' });

  return {
    website: site,
    role: draft.role_guess,
    profile: draft.profile,
    seller_terms: {
      budget_floor: null,
      contract_formats: [],
      available_from: null,
      capabilities: draft.capabilities,
    },
    evidence: draft.evidence,
    pages_read: pages.map((p) => p.url),
  };
}

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
