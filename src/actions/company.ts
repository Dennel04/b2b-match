'use server';

import { ask } from '@/lib/claude';
import { domainFromEmail, normaliseWebsite, readWebsiteTraced, type ScrapeTrace, type SitePage } from '@/lib/scrape';
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

  const trace = await readWebsiteTraced(site);
  logScrape(site, trace);
  if (!trace.pages.length) throw new Error(`Could not read ${site} — fill the profile by hand`);

  return draftFrom(site, trace.pages, trace.logo);
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
    const draft = await ask(ProfileDraftSchema, prompt, { effort: 'medium' });
    return { site, trace, prompt, draft, error: null, modelMs: Date.now() - started };
  } catch (e) {
    return { site, trace, prompt, draft: null, error: e instanceof Error ? e.message : String(e), modelMs: Date.now() - started };
  }
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

async function draftFrom(site: string, pages: SitePage[], logo: string | null = null): Promise<CompanyDraft> {
  const started = Date.now();
  const draft = await ask(ProfileDraftSchema, profileDraftPrompt(site || 'not given', pages), { effort: 'medium' });
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

export interface CompanyStats {
  /** Every match this company is part of, by the side it is on. */
  asSeller: { matched: number; last30: number; negotiated: number; proceed: number; interested: number; meetings: number; declined: number; avgScore: number | null };
  asBuyer: { problems: number; matched: number; meetings: number };
  /** Matches created per week, oldest first, the last 8 weeks. `start` is the Monday, ISO date. */
  weekly: { start: string; count: number }[];
}

/**
 * Counts for the account dashboard. Reads through RLS (a party sees its own matches) and only
 * status-level columns — no transcript, no problem text, no other company's fields.
 */
export async function getCompanyStats(): Promise<CompanyStats> {
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: companies } = await db.from('companies').select('id').eq('owner_id', user.id);
  const mine = new Set((companies ?? []).map((c) => c.id));

  const { data: rows } = await db
    .from('matches')
    .select('status, score, created_at, buyer_company_id, seller_company_id, negotiation_started_at, verdict:deal_envelope_json->>verdict');
  const { count: problems } = await db.from('problems').select('id', { count: 'exact', head: true });

  const all = rows ?? [];
  const sold = all.filter((m) => mine.has(m.seller_company_id));
  const bought = all.filter((m) => mine.has(m.buyer_company_id));
  const since = Date.now() - 30 * 86_400_000;

  const monday = (d: Date) => {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
    return x;
  };
  const thisWeek = monday(new Date());
  const weekly = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(thisWeek);
    start.setUTCDate(start.getUTCDate() - (7 - i) * 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    const count = all.filter((m) => {
      const t = new Date(m.created_at).getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length;
    return { start: start.toISOString().slice(0, 10), count };
  });

  return {
    asSeller: {
      matched: sold.length,
      last30: sold.filter((m) => new Date(m.created_at).getTime() >= since).length,
      negotiated: sold.filter((m) => m.negotiation_started_at || m.verdict).length,
      proceed: sold.filter((m) => m.verdict === 'proceed').length,
      interested: sold.filter((m) => m.status === 'buyer_interested' || m.status === 'accepted').length,
      meetings: sold.filter((m) => m.status === 'accepted').length,
      declined: sold.filter((m) => m.status === 'declined' || m.verdict === 'reject').length,
      avgScore: sold.length ? Math.round(sold.reduce((n, m) => n + m.score, 0) / sold.length) : null,
    },
    asBuyer: {
      problems: problems ?? 0,
      matched: bought.length,
      meetings: bought.filter((m) => m.status === 'accepted').length,
    },
    weekly,
  };
}
