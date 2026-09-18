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
- role_guess — 'seller' if the site sells services to businesses, 'buyer' if it is an end company
  with no B2B offering, 'both' if it plausibly does both.
- capabilities — ONLY those the text supports: gdpr_dpa (GDPR, DPA, data processing agreement
  mentioned), iso27001 (ISO 27001 named), eu_data_residency (EU hosting or data location stated),
  estonian_language / english_language (site has that language, or says so), on_site (on-site,
  field or in-person work offered), industry_refs (named clients or case studies).
- evidence — for each capability, in the same order, the phrase or page path that supports it.

Do not invent. If the site does not say, leave the field generic or the capability out.
Write in English.
`.trim();
