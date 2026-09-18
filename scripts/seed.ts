/**
 * Seed data: 18 plausible Estonian companies with profiles, terms and problems.
 * Run: npm run seed
 * Running it twice creates duplicates — truncate the tables first.
 */
import { z } from 'zod';
import { ask } from '../src/lib/claude';
import { adminClient } from '../src/lib/supabase';

const ContractFormatEnum = z.enum([
  'pilot_first', 'fixed_price', 'monthly_retainer', 'time_and_materials', 'outcome_based',
]);
const RequirementEnum = z.enum([
  'gdpr_dpa', 'iso27001', 'eu_data_residency', 'estonian_language', 'english_language',
  'on_site', 'industry_refs',
]);
const Money = z.object({
  amount: z.number(),
  currency: z.literal('EUR'),
  period: z.enum(['one_off', 'monthly']),
});

const SeedSchema = z.object({
  companies: z.array(
    z.object({
      name: z.string(),
      website: z.string(),
      role: z.enum(['seller', 'buyer', 'both']),
      industry: z.string(),
      size_hint: z.string(),
      services: z.array(z.string()),
      keywords: z.array(z.string()),
      summary: z.string(),
      seller_terms: z
        .object({
          budget_floor: Money.nullable(),
          contract_formats: z.array(ContractFormatEnum),
          available_from: z.string().nullable(),
          capabilities: z.array(RequirementEnum),
        })
        .nullable(),
      problem: z.string().nullable(),
      urgency: z.enum(['low', 'medium', 'high']),
      buyer_terms: z
        .object({
          budget_ceiling: Money.nullable(),
          contract_formats: z.array(ContractFormatEnum),
          start_by: z.string().nullable(),
          requirements: z.array(RequirementEnum),
          dealbreakers: z.array(z.string()),
        })
        .nullable(),
    }),
  ),
});

const prompt = (today: string) => `
Invent 18 plausible Estonian B2B companies for a demo of a blind matching platform.
Today is ${today}.

Mix: 8 service vendors (IT outsourcing, logistics, accounting, marketing, HR, cybersecurity,
design, legal), 6 buyers with problems, 4 that do both.

Requirements:
- Vendors and both: fill seller_terms — minimum deal size, contract formats, the date they are
  free from, which requirements they meet. problem = null for pure vendors.
- Buyers and both: problem is a concrete pain with numbers, 2-3 sentences, written the way a
  real person writes. Plus buyer_terms with a budget ceiling, formats, start date, requirements.
- Every problem must have an obvious solver among the vendors in the list — matches have to land.
- One pair must be perfect on all three axes: meaning, budget and contract format (score 90+).
- REQUIRED: include 2 pairs that fit perfectly on meaning but are filtered out mechanically —
  one because the vendor's minimum deal size exceeds the buyer's ceiling, the other because the
  vendor lacks ISO 27001 or will not sign a DPA. This makes the pre-model filter visible in the
  demo.
- Dates are absolute ISO dates within the next 3 months from today.
- Names and .ee domains should be plausible but fictional.
- Write everything in English.
`.trim();

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log('Generating companies...');
  const { companies } = await ask(SeedSchema, prompt(today), { effort: 'high', maxTokens: 32000 });

  const db = adminClient();
  const ownerId = process.env.SEED_OWNER_ID;
  if (!ownerId) throw new Error('Set SEED_OWNER_ID in .env.local (the id of any test user)');

  for (const c of companies) {
    const { data, error } = await db
      .from('companies')
      .insert({
        owner_id: ownerId,
        name: c.name,
        website: c.website,
        role: c.role,
        profile_json: {
          name: c.name,
          industry: c.industry,
          size_hint: c.size_hint,
          services: c.services,
          keywords: c.keywords,
          summary: c.summary,
        },
        seller_terms: c.seller_terms,
      })
      .select('id')
      .single();
    if (error) throw error;

    if (c.problem) {
      const { error: pErr } = await db.from('problems').insert({
        company_id: data.id,
        text: c.problem,
        urgency: c.urgency,
        buyer_terms: c.buyer_terms,
      });
      if (pErr) throw pErr;
    }
    console.log(`  + ${c.name}${c.problem ? ' (with problem)' : ''}`);
  }
  console.log(`Done: ${companies.length} companies.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
