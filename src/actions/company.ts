'use server';

import { ask } from '@/lib/claude';
import { domainFromEmail, failureReason, normaliseWebsite, readWebsiteTraced, type ScrapeTrace, type SitePage } from '@/lib/scrape';
import { serverClient } from '@/lib/supabase';
import { ProfileDraftSchema, profileDraftPrompt } from '@/prompts/profile';
import type { ActionResult, CompanyDraft, CompanyProfile, SellerTerms } from '@/types';

/**
 * Zero-typing onboarding. Pass a website, or nothing to use the signed-in user's email domain.
 * ~10-20 s. A site that cannot be read comes back as `{ ok: false, message }` — the screen
 * shows the message and falls back to the manual form. On success the draft is a starting
 * point: show it, let them edit, then saveCompany().
 */
export async function draftCompanyProfile(website?: string): Promise<ActionResult<CompanyDraft>> {
  let site = website?.trim();
  if (!site) {
    const db = await serverClient();
    const { data: { user } } = await db.auth.getUser();
    const domain = user?.email ? domainFromEmail(user.email) : null;
    if (!domain) {
      return { ok: false, message: 'No company website to read — enter it, or fill the profile by hand' };
    }
    site = domain;
  }
  site = normaliseWebsite(site);

  const trace = await readWebsiteTraced(site);
  logScrape(site, trace);
  if (!trace.pages.length) {
    // The screen already offers the two ways out, so the message only has to say what went wrong.
    return { ok: false, message: `${failureReason(site, trace.steps)}.` };
  }

  return { ok: true, data: await draftFrom(site, trace.pages, trace.logo) };
}

/** One line per step in the server log (terminal locally, Vercel → Logs in production). */
function logScrape(site: string, t: ScrapeTrace) {
  console.log(`[scrape] ${site}: ${t.pages.length} pages, ${t.pages.reduce((n, p) => n + p.text.length, 0)} chars, ${t.ms} ms`);
  for (const s of t.steps) console.log(`[scrape]   ${s.outcome} — ${s.url}${s.chars ? ` (${s.chars})` : ''}`);
}

/**
 * Development only: everything behind one autofill, for /dev/scrape. Signed-in users only, since
 * each call spends a model request.
 */
export async function debugScrape(website: string) {
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Sign in to use the scrape debugger');

  const site = normaliseWebsite(website);
  const trace = await readWebsiteTraced(site);
  logScrape(site, trace);
  if (!trace.pages.length) return { site, trace, prompt: null, draft: null, error: 'No page had usable text', modelMs: 0 };

  const prompt = profileDraftPrompt(site, trace.pages);
  const started = Date.now();
  try {
    const draft = await ask(ProfileDraftSchema, prompt, { effort: 'medium', label: 'profile-draft' });
    return { site, trace, prompt, draft, error: null, modelMs: Date.now() - started };
  } catch (e) {
    return { site, trace, prompt, draft: null, error: e instanceof Error ? e.message : String(e), modelMs: Date.now() - started };
  }
}

/**
 * The same draft from text the person pastes: an "about us", a pitch deck copied out of a PDF, a
 * LinkedIn page. For companies whose site cannot be read or says too little. ~10 s.
 */
export async function draftCompanyProfileFromText(text: string): Promise<ActionResult<CompanyDraft>> {
  const body = text.trim().slice(0, 14000);
  if (body.length < 80) {
    return { ok: false, message: 'Paste a few sentences about the company — a paragraph at least' };
  }
  return { ok: true, data: await draftFrom('', [{ url: 'pasted text', text: body }]) };
}

async function draftFrom(site: string, pages: SitePage[], logo: string | null = null): Promise<CompanyDraft> {
  const started = Date.now();
  const draft = await ask(ProfileDraftSchema, profileDraftPrompt(site || 'not given', pages), { effort: 'medium', label: 'profile-draft' });
  console.log(`[scrape] ${site || 'pasted text'}: model ${Date.now() - started} ms →`, JSON.stringify({ ...draft.profile, role: draft.role_guess, capabilities: draft.capabilities }));

  return {
    website: site,
    role: draft.role_guess,
    profile: { ...draft.profile, logo_url: logo },
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
