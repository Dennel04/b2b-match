import { z } from 'zod';
import type { SitePage } from '@/lib/scrape';

const RequirementEnum = z.enum([
  'gdpr_dpa',
  'iso27001',
  'eu_data_residency',
  'estonian_language',
  'english_language',
  'on_site',
  'industry_refs',
]);

export const ProfileDraftSchema = z.object({
  profile: z.object({
    name: z.string(),
    industry: z.string(),
    size_hint: z.string(),
    services: z.array(z.string()),
    keywords: z.array(z.string()),
    summary: z.string(),
    city: z.string().nullable(),
    country: z.string().nullable(),
    languages: z.array(z.string()),
    industries_served: z.array(z.string()),
    employees: z.number().int().nullable(),
    founded: z.number().int().nullable(),
    certifications: z.array(z.string()),
  }),
  role_guess: z.enum(['seller', 'buyer', 'both']),
  capabilities: z.array(RequirementEnum),
  /** One short quote or page path per capability, in the same order. Empty = nothing claimed. */
  evidence: z.array(z.string()),
});

/**
 * Drafts the profile a person would otherwise type. Everything here is shown back to them with
 * "we read this on your site — confirm", so the rule is: nothing without evidence in the text.
 * Money is never inferred; the platform asks for it later, only when a match needs it.
 */
export const profileDraftPrompt = (website: string, pages: SitePage[]) => `
Draft a company profile for a B2B matching platform from the company's own public website.
Website: ${website}
Pages read: ${pages.map((p) => p.url).join(', ')}

${pages.map((p) => `=== ${p.url} ===\n${p.text}`).join('\n\n')}

Return:
- profile.name — the trading name as the site uses it.
- profile.industry — one short phrase ("IT outsourcing", "road freight logistics").
- profile.size_hint — what the site suggests ("~40 people", "small agency", "multi-site retailer");
  "unknown" if nothing suggests it.
- profile.services — 3 to 8 short items, the company's own offering, not marketing slogans.
- profile.keywords — 5 to 12 lower-case terms a buyer with a matching problem might use.
- profile.summary — 2-3 plain sentences, safe to show to other companies.
- profile.city / profile.country — where the company is headquartered, as the site states it
  (address, "based in Tallinn", footer). Country in English ("Estonia"). null if not stated.
- profile.languages — languages the company works or serves clients in, in English
  ("Estonian", "English", "Finnish"). Count a language only if the site is published in it or
  says the team works in it. Empty if unclear.
- profile.industries_served — the client industries the site names or its case studies belong
  to ("Banking", "Logistics", "Public sector"). Not the company's own industry. Empty if none.
- profile.employees — headcount as a whole number, only when the site states one ("45 people",
  "team of 300+", "over 1,000 employees" → 45, 300, 1000). null otherwise; never guess.
- profile.founded — the founding year when the site states it. null otherwise.
- profile.certifications — certifications, audits and partner tiers named on the site, as
  written ("ISO 27001", "SOC 2 Type II", "AWS Advanced Partner", "Microsoft Gold Partner").
  Empty if none.
- role_guess — 'seller' if the site sells services to businesses, 'buyer' if it is an end company
  with no B2B offering, 'both' if it plausibly does both.
- capabilities — ONLY those the text supports: gdpr_dpa (GDPR, DPA, data processing agreement
  mentioned), iso27001 (ISO 27001 named), eu_data_residency (EU hosting or data location stated),
  estonian_language / english_language (site has that language, or says so), on_site (on-site,
  field or in-person work offered), industry_refs (named clients or case studies).
- evidence — for each capability, in the same order, the phrase or page path that supports it.

Do not invent. If the site does not say, use null or an empty list — a blank field is fine, a
wrong one is not. Never state a money figure. Write in English.
`.trim();
