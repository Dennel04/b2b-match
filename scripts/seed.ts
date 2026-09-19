/**
 * Fills the platform with something to demo: real Estonian vendors on the selling side,
 * invented companies on the buying side.
 *
 *   npm run seed               # vendors and buyers
 *   npm run seed -- --buyers   # buyers only, when the vendors are already in
 *   npm run seed -- --vendors  # vendors only, to top the directory up
 *
 * WHY THE TWO SIDES ARE SOURCED DIFFERENTLY. A vendor's profile is public: its industry and
 * what it sells were read off its own website into `directory` by `npm run directory`, and
 * putting Nortal or Cybernetica on screen with its real catalogue is simply true. A problem is
 * the opposite — private, specific, and about money. Inventing one and filing it under a real
 * company's name would put a fabricated internal difficulty, with a budget attached, next to a
 * real logo, in front of judges who know these people. So buyers are invented outright.
 *
 * Commercial terms on the vendor side are invented too, and marked as such below: no company
 * publishes its floor price. They are plausible, not researched.
 *
 * Re-runnable: it skips companies already seeded, so a second run tops up rather than doubles.
 */
import { z } from 'zod';
import { ask } from '../src/lib/claude';
import { adminClient } from '../src/lib/supabase';
import type { CompanyProfile, SellerTerms } from '../src/types';

const BUYERS_ONLY = process.argv.includes('--buyers');
const VENDORS_ONLY = process.argv.includes('--vendors');
const BATCH = 4;

/**
 * A slice of the directory, not all of it: twelve vendors spread across what a company actually
 * buys — consulting, development, QA, security, hosting, messaging, compliance, hardware, agri,
 * staff wellbeing. A demo needs range more than volume, and every one of these has to be read
 * and understood on screen.
 */
const VENDORS = [
  'nortal.com', 'mooncascade.com', 'codeborne.com', 'testlio.com',
  'cybernetica.eu', 'cybexer.com', 'zone.ee', 'messente.com',
  'salv.com', 'cleveron.com', 'eagronom.com', 'stebby.eu',
  // Further from software, so a problem can land outside it: robots, batteries, payments,
  // an investment platform, goal-setting software.
  'starship.xyz', 'skeletontech.com', 'fortumo.com', 'lightyear.com', 'weekdone.com',
];

const DEPARTMENTS = [
  'Operations', 'Sales', 'Marketing & brand', 'Customer support', 'Finance & accounting',
  'Legal & compliance', 'People & hiring', 'IT & software', 'Data & analytics', 'Cybersecurity',
  'Product & R&D', 'Production & manufacturing', 'Logistics & supply chain', 'Procurement',
];

const FormatEnum = z.enum(['pilot_first', 'fixed_price', 'monthly_retainer', 'time_and_materials', 'outcome_based']);
const RequirementEnum = z.enum([
  'gdpr_dpa', 'iso27001', 'eu_data_residency', 'estonian_language', 'english_language', 'on_site', 'industry_refs',
]);
const Money = z.object({
  amount: z.number(),
  currency: z.literal('EUR'),
  period: z.enum(['one_off', 'monthly']),
});
const TermsSchema = z.object({
  budget_floor: Money.nullable(),
  contract_formats: z.array(FormatEnum),
  available_from: z.string().nullable(),
  capabilities: z.array(RequirementEnum),
});

const VendorSchema = z.object({
  companies: z.array(
    z.object({
      domain: z.string(),
      services: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          area: z.string(),
          terms: TermsSchema,
        }),
      ),
    }),
  ),
});

const BuyerSchema = z.object({
  companies: z.array(
    z.object({
      name: z.string(),
      website: z.string(),
      industry: z.string(),
      size_hint: z.string(),
      summary: z.string(),
      problem: z.string(),
      department: z.string(),
      urgency: z.enum(['low', 'medium', 'high']),
      buyer_terms: z.object({
        budget_ceiling: Money.nullable(),
        contract_formats: z.array(FormatEnum),
        start_by: z.string().nullable(),
        requirements: z.array(RequirementEnum),
        dealbreakers: z.array(z.string()),
      }),
    }),
  ),
});

interface DirectoryRow {
  domain: string;
  website: string;
  name: string;
  industry: string | null;
  summary: string | null;
  city: string | null;
  country: string | null;
  employees: number | null;
  languages: string[];
  services: string[];
  certifications: string[];
  profile_json: CompanyProfile | null;
}

const vendorPrompt = (rows: DirectoryRow[], today: string) => `
Turn each real company below into 2-3 sellable services for a B2B matching platform. Today is ${today}.

${rows
  .map(
    (r) => `[${r.domain}] ${r.name} — ${r.industry ?? 'unknown industry'}${r.employees ? `, ~${r.employees} people` : ''}
Summary: ${r.summary ?? 'none'}
Sells: ${r.services.join('; ') || 'not listed'}
Certifications: ${r.certifications.join(', ') || 'none listed'}
Languages: ${r.languages.join(', ') || 'unknown'}`,
  )
  .join('\n\n')}

For each company return its domain exactly as given, and 2-3 services:
- title — what a buyer would call it, 2-5 words, from what the company actually sells.
- description — one or two sentences a buyer reads. No marketing language.
- area — the part of a BUYER'S business this fixes, chosen from exactly this list:
  ${DEPARTMENTS.join(' | ')}
- terms — the commercial envelope. No company publishes these, so invent a plausible one and
  keep it consistent with the company's size and the kind of work:
  - budget_floor: the smallest deal worth taking. A 4000-person platform does not take a
    2000-euro project; a 40-person studio does. Use 'monthly' for ongoing work, 'one_off' for
    projects. Null only if genuinely open-ended.
  - contract_formats: 1-3 that suit the work.
  - available_from: an ISO date within the next 3 months of today.
  - capabilities: only what the certifications, languages and summary support. Do not award
    iso27001 to a company that never mentions it. english_language is safe for all of these.

Write in English.
`.trim();

/**
 * The buyers are written as scenarios, not invented freely, because the demo has to be able to
 * show every way a match can end: cleared, filtered on each of the four mechanical axes, scored
 * away, and declined by the agents themselves. Left to itself a model writes ten happy paths.
 */
const SCENARIOS = [
  '1. Perfect fit on every axis against one vendor: terms comfortably compatible, and the work is\n   squarely what that vendor does. This is the headline match.',
  '2. Same, but three or four vendors could all plausibly do it, so the buyer has a choice.',
  '3. Semantically perfect for one vendor, killed by BUDGET: ceiling far below that vendor’s floor.',
  '4. Semantically perfect for one vendor, killed by a REQUIREMENT it lacks — a certification or a\n   language that vendor’s terms do not list.',
  '5. Semantically perfect for one vendor, killed by TIMING: must start well before that vendor is free.',
  '6. Semantically perfect for one vendor, killed by CONTRACT FORMAT: the buyer will only accept a\n   format that vendor does not offer, and both sides have named theirs.',
  '7. States NO commercial terms at all — budget_ceiling null, contract_formats empty, start_by\n   null, no requirements. Nothing may filter it; the agents work the terms out themselves.',
  '8. A problem no vendor on the list can solve: real, specific, and simply outside all of them\n   (something physical or licensed — a fleet of refrigerated trucks, a commercial kitchen fit-out).\n   It should pass the mechanical check and then score too low to match.',
  '9. A problem that looks close to one vendor’s field but is not actually what that vendor does,\n   so it survives scoring and the agents are the ones who conclude it will not work.',
  '10. An urgent, high-stakes problem with a hard deadline that one vendor can genuinely meet.',
];
const buyerPrompt = (vendors: string[], today: string, scenarios: string[]) => `
Invent ${scenarios.length} Estonian companies that have a business problem right now, for a demo
of a blind matching platform. Today is ${today}. They are fictional and must not resemble any
real company: invented names, invented .ee domains.

They will be matched against these real vendors, each with what it sells and the terms it works
on — read the terms carefully, the scenarios below depend on them:
${vendors.join('\n')}

HOW MATCHING WORKS, so you can aim each scenario:
1. A mechanical check runs first and filters on four axes. A pair is dropped when the vendor's
   minimum deal size is above the buyer's ceiling, OR the vendor is free only after the buyer
   must start, OR both sides named contract formats and none is shared, OR the buyer requires a
   capability (a certification, a language, on-site work) the vendor lacks. A side that named
   nothing on an axis does not fail on it.
2. Whatever survives is scored 0-100 on meaning alone. Below 70 it never becomes a match.
3. The survivors' agents then negotiate, and may still conclude the vendor cannot do the job.

WRITE EXACTLY THESE, one company per scenario, naming the vendor each is aimed at in your head:
${scenarios.join('\n')}

For each company return:
- name, website, industry, size_hint ("~25 people", "family firm, 3 sites"), summary (2 sentences).
- problem — 2-4 sentences in the voice of the person who has it, with concrete numbers: what
  hurts, what it costs per month in money or hours, what they already tried. This is the private
  text, never shown to a vendor.
- department — from exactly this list: ${DEPARTMENTS.join(' | ')}
- urgency, and buyer_terms matching the scenario: budget ceiling, contract formats, an ISO
  start_by within 3 months of today, requirements, dealbreakers in free text.

Vary the industries: logistics, manufacturing, retail, healthcare, hospitality, construction, a
school, an NGO, a farm. Not ten software companies.

Write in English.
`.trim();

async function seedVendors(db: ReturnType<typeof adminClient>, ownerId: string) {
  const { data: directory, error } = await db
    .from('directory')
    .select('domain, website, name, industry, summary, city, country, employees, languages, services, certifications, profile_json')
    .in('domain', VENDORS);
  if (error) throw error;

  const rows = (directory ?? []) as DirectoryRow[];
  const { data: existing } = await db.from('companies').select('website');
  const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '').toLowerCase();
  const taken = new Set((existing ?? []).map((c) => host(c.website ?? '')));
  // Match on the site's own host as well as the directory key: cybernetica.eu serves from
  // cyber.ee, so comparing keys alone seeded it twice.
  const todo = rows.filter((r) => !taken.has(r.domain) && !taken.has(host(r.website)));

  console.log(`${rows.length} in the directory, ${todo.length} not yet on the platform`);
  if (!todo.length) return;

  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    process.stdout.write(`  drafting services for ${batch.map((b) => b.name).join(', ')}… `);
    const { companies } = await ask(VendorSchema, vendorPrompt(batch, today), { effort: 'medium', maxTokens: 16000 });
    const byDomain = new Map(companies.map((c) => [c.domain, c.services]));
    console.log(`${companies.length} back`);

    for (const row of batch) {
      const services = byDomain.get(row.domain) ?? [];
      if (!services.length) {
        console.log(`    ! ${row.name}: no services returned, skipped`);
        continue;
      }

      const profile: CompanyProfile = {
        ...(row.profile_json ?? { keywords: [] as string[] }),
        name: row.name,
        industry: row.industry ?? '',
        size_hint: row.employees ? `~${row.employees} people` : '',
        services: services.map((s) => s.title),
        keywords: row.profile_json?.keywords ?? [],
        summary: row.summary ?? '',
      };

      // findMatches() still reads the company envelope, not each service's own (see the
      // `ponytail:` note in src/app/services/load.tsx). Until it does, the company carries the
      // broadest envelope across its services, so the filter never rejects a company for terms
      // that only one of its services has.
      const broadest: SellerTerms = {
        budget_floor: services
          .map((s) => s.terms.budget_floor)
          .filter((m): m is NonNullable<typeof m> => !!m)
          .sort((a, b) => (a.period === 'monthly' ? a.amount * 12 : a.amount) - (b.period === 'monthly' ? b.amount * 12 : b.amount))[0] ?? null,
        contract_formats: [...new Set(services.flatMap((s) => s.terms.contract_formats))],
        available_from: services.map((s) => s.terms.available_from).filter(Boolean).sort()[0] ?? null,
        capabilities: [...new Set(services.flatMap((s) => s.terms.capabilities))],
      };

      const { data: company, error: cErr } = await db
        .from('companies')
        .insert({ owner_id: ownerId, name: row.name, website: row.website, role: 'seller', profile_json: profile, seller_terms: broadest })
        .select('id')
        .single();
      if (cErr) throw cErr;

      const { error: sErr } = await db.from('services').insert(
        services.map((s) => ({
          company_id: company.id,
          title: s.title,
          description: s.description,
          area: DEPARTMENTS.includes(s.area) ? s.area : null,
          terms: s.terms,
          active: true,
        })),
      );
      if (sErr) throw sErr;
      console.log(`    + ${row.name}: ${services.map((s) => s.title).join(' · ')}`);
    }
  }
}

async function seedBuyers(db: ReturnType<typeof adminClient>, ownerId: string) {
  const { data: vendors } = await db
    .from('companies')
    .select('name, profile_json, seller_terms')
    .eq('role', 'seller');

  // The terms go in too: scenarios 3-6 are written against a specific vendor's floor, dates,
  // formats and capabilities, and cannot be aimed without them.
  const lines = (vendors ?? [])
    .map((v) => {
      const t = v.seller_terms as SellerTerms | null;
      const money = t?.budget_floor ? `${t.budget_floor.amount} EUR ${t.budget_floor.period}` : 'no floor stated';
      return (
        `- ${v.name}: ${((v.profile_json as CompanyProfile | null)?.services ?? []).join('; ')}\n` +
        `    floor ${money} | formats ${t?.contract_formats.join(', ') || 'none stated'} | ` +
        `free from ${t?.available_from ?? 'unstated'} | can do ${t?.capabilities.join(', ') || 'nothing listed'}`
      );
    })
    .filter((l) => l.length > 4);
  if (!lines.length) throw new Error('No vendors on the platform yet — run without --buyers first');

  const today = new Date().toISOString().slice(0, 10);
  console.log(`\nInventing buyers against ${lines.length} vendors…`);

  // Two calls of five, not one of ten: a single long generation is one dropped connection away
  // from losing the lot, and half a set is still worth keeping.
  const companies = [];
  for (const half of [SCENARIOS.slice(0, 5), SCENARIOS.slice(5)]) {
    const batch = await ask(BuyerSchema, buyerPrompt(lines, today, half), { effort: 'high', maxTokens: 16000 });
    console.log(`  ${batch.companies.length} back`);
    companies.push(...batch.companies);
  }

  for (const c of companies) {
    const { data: company, error: cErr } = await db
      .from('companies')
      .insert({
        owner_id: ownerId,
        name: c.name,
        website: c.website,
        role: 'buyer',
        profile_json: {
          name: c.name, industry: c.industry, size_hint: c.size_hint,
          services: [], keywords: [], summary: c.summary,
        },
        seller_terms: null,
      })
      .select('id')
      .single();
    if (cErr) throw cErr;

    const { error: pErr } = await db.from('problems').insert({
      company_id: company.id,
      text: c.problem,
      department: DEPARTMENTS.includes(c.department) ? c.department : null,
      urgency: c.urgency,
      buyer_terms: c.buyer_terms,
    });
    if (pErr) throw pErr;
    console.log(`  + ${c.name} (${c.department}) — ${c.problem.slice(0, 70)}…`);
  }
}

async function main() {
  const ownerId = process.env.SEED_OWNER_ID;
  if (!ownerId) throw new Error('Set SEED_OWNER_ID in .env.local (the id of any registered user)');
  const db = adminClient();

  if (!BUYERS_ONLY) await seedVendors(db, ownerId);
  if (!VENDORS_ONLY) await seedBuyers(db, ownerId);

  const count = async (table: string) => (await db.from(table).select('id', { count: 'exact', head: true })).count ?? 0;
  console.log(`\nOn the platform: ${await count('companies')} companies, ${await count('services')} services, ${await count('problems')} problems.`);
  console.log('Next: npm run warm');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
