/**
 * The demo account: admin@super.com / password123, with one company, three services, three
 * problems and hand-written matches. Run: npm run seed:demo
 *
 * Deterministic and repeatable — no model call, and every run deletes the account's companies
 * first, so the data is the same on the tenth run as on the first. Counterparties are read from
 * whatever `npm run seed` already put in the database: a demo match has to point at a real
 * seller, and inventing a second set of vendors here would only fork the catalogue.
 */
import { checkCompatibility } from '../src/lib/overlap';
import { adminClient } from '../src/lib/supabase';
import type { AgentDialogueLine, BuyerTerms, DealEnvelope, SellerTerms } from '../src/types';

const EMAIL = 'admin@super.com';
const PASSWORD = 'password123';

/**
 * The buyers that come to the demo account must be owned by someone else, or getMatchView()
 * reads the pair as one owner holding both sides and shows it from the buying side — which is
 * the free side, and never the blurred one.
 */
const INCOMING_OWNER = 'incoming@demo.crossdesk.ee';

/** What the demo account starts with, so an unlock can be shown twice and still have change. */
const START_CREDITS = 30;

/** Dates are relative to the run, so a regenerated demo never shows a start date in the past. */
const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const COMPANY = {
  name: 'Nordwell Logistics',
  website: 'https://nordwell.ee',
  role: 'both' as const,
  profile: {
    name: 'Nordwell Logistics',
    industry: 'Logistics and warehousing',
    size_hint: '120 people, three warehouses',
    services: ['Contract warehousing', 'Customs clearance', 'Last-mile delivery in the Baltics'],
    keywords: ['warehousing', 'customs', 'freight', 'last mile', 'Baltics'],
    summary:
      'A Baltic logistics operator running three warehouses and a delivery fleet out of Tallinn, ' +
      'Tartu and Riga. It handles contract warehousing, customs paperwork and last-mile delivery ' +
      'for retailers and manufacturers.',
    city: 'Tallinn',
    country: 'Estonia',
    languages: ['Estonian', 'English', 'Russian'],
    industries_served: ['Retail', 'Manufacturing', 'E-commerce'],
    employees: 120,
    founded: 2011,
    client_sizes: ['sme', 'mid_market'] as const,
    regions: ['Estonia', 'Baltics'],
    delivery: 'hybrid' as const,
    contact_name: 'Demo Admin',
    contact_role: 'Head of Operations',
  },
  seller_terms: {
    budget_floor: { amount: 1_500, currency: 'EUR', period: 'monthly' },
    contract_formats: ['monthly_retainer', 'fixed_price'],
    available_from: inDays(14),
    capabilities: ['gdpr_dpa', 'eu_data_residency', 'estonian_language', 'english_language'],
  } satisfies SellerTerms,
};

const SERVICES = [
  {
    title: 'Contract warehousing in Tallinn and Riga',
    area: 'Operations',
    description:
      'Pallet space, goods receipt and pick-and-pack out of two bonded warehouses, billed per ' +
      'pallet per month. Stock levels are visible to the client in our own portal, and a monthly ' +
      'stock count is included.',
    terms: {
      budget_floor: { amount: 2_000, currency: 'EUR', period: 'monthly' },
      contract_formats: ['monthly_retainer'],
      available_from: inDays(14),
      capabilities: ['gdpr_dpa', 'eu_data_residency', 'estonian_language', 'english_language'],
    } satisfies SellerTerms,
  },
  {
    title: 'Customs clearance for EU and third-country imports',
    area: 'Operations',
    description:
      'Import and export declarations filed by our own licensed brokers, including tariff ' +
      'classification and duty calculation. We take over an existing paper process and run it ' +
      'from our side, typically within three weeks.',
    terms: {
      budget_floor: { amount: 900, currency: 'EUR', period: 'monthly' },
      contract_formats: ['monthly_retainer', 'fixed_price'],
      available_from: inDays(7),
      capabilities: ['gdpr_dpa', 'estonian_language', 'english_language'],
    } satisfies SellerTerms,
  },
  {
    title: 'Last-mile delivery across the Baltics',
    area: 'Operations',
    description:
      'Next-day delivery to end customers in Estonia, Latvia and Lithuania from our own fleet, ' +
      'with returns handled at the same warehouse. Priced per parcel, with a monthly minimum.',
    terms: {
      budget_floor: { amount: 3_000, currency: 'EUR', period: 'monthly' },
      contract_formats: ['monthly_retainer', 'outcome_based'],
      available_from: inDays(30),
      capabilities: ['gdpr_dpa', 'eu_data_residency', 'english_language'],
    } satisfies SellerTerms,
  },
];

/** Three problems, one per state the problem screen can be in: matching, potential, searching. */
const PROBLEMS = [
  {
    key: 'matching',
    department: 'Finance',
    text:
      'Invoices are still entered by hand\n' +
      'Two people spend about 70 hours a month typing supplier invoices into our accounting ' +
      'system, and we paid two late-payment fines this year because an invoice sat in someone ' +
      'inbox. A freelancer built a script last spring and it broke the first time a supplier ' +
      'changed its template.',
    urgency: 'high' as const,
    terms: {
      budget_ceiling: { amount: 4_000, currency: 'EUR', period: 'monthly' },
      contract_formats: ['pilot_first', 'monthly_retainer'],
      start_by: inDays(45),
      requirements: ['gdpr_dpa', 'eu_data_residency'],
      dealbreakers: ['No data leaving the EU'],
    } satisfies BuyerTerms,
  },
  {
    key: 'potential',
    department: 'IT',
    text:
      'Warehouse scanners drop off the network\n' +
      'The handheld scanners in the Tartu warehouse lose their connection several times a shift, ' +
      'and every drop means a pallet is booked in twice or not at all. Our own IT person has ' +
      'replaced two access points and it did not help.',
    urgency: 'medium' as const,
    terms: {
      budget_ceiling: { amount: 12_000, currency: 'EUR', period: 'one_off' },
      contract_formats: ['fixed_price'],
      start_by: inDays(60),
      requirements: ['on_site', 'estonian_language'],
      dealbreakers: [],
    } satisfies BuyerTerms,
  },
  {
    key: 'searching',
    department: 'HR',
    text:
      'Drivers leave within the first three months\n' +
      'We hire roughly ten drivers a quarter and about half are gone before month three, so we ' +
      'are paying for the same induction twice. Nobody has ever sat down and asked them why.',
    urgency: 'low' as const,
    terms: {
      budget_ceiling: { amount: 6_000, currency: 'EUR', period: 'one_off' },
      contract_formats: ['fixed_price', 'outcome_based'],
      start_by: inDays(90),
      requirements: ['estonian_language'],
      dealbreakers: [],
    } satisfies BuyerTerms,
  },
];

/**
 * Buyers who came to Nordwell through its own services: this is the selling side, the one that
 * costs credits to open. Each is a company in full — industry, size, city, languages, what it
 * serves — because the credit buys exactly that, and a profile with three fields in it is not
 * worth ten of anything.
 *
 * They are invented, like every buyer in this project (scripts/seed.ts says why), and they carry
 * no logo for the same reason: there is no real site to read one off.
 */
const INCOMING = [
  {
    service: 'Last-mile delivery across the Baltics',
    score: 88,
    company: {
      name: 'Baltic Basket',
      website: 'https://balticbasket.ee',
      profile: {
        name: 'Baltic Basket',
        industry: 'Online grocery',
        size_hint: '~120 people',
        services: ['Online grocery', 'Same-day delivery', 'Subscription boxes'],
        keywords: ['e-commerce', 'grocery', 'chilled delivery', 'Baltics'],
        summary:
          'An online grocer delivering chilled weekly orders to households in Tallinn, Tartu and ' +
          'Riga, with its own picking centre and a subscription box for regular customers.',
        city: 'Tallinn',
        country: 'Estonia',
        languages: ['Estonian', 'English', 'Russian'],
        industries_served: ['Households', 'Small offices'],
        employees: 120,
        founded: 2017,
      },
    },
    problem: {
      department: 'Logistics & supply chain',
      text:
        'Our own vans cannot cover the Latvian routes\n' +
        'Riga orders are served by two vans that are already full, and a late round means chilled ' +
        'goods go back to the depot. Hiring a third crew for one city costs more than the route ' +
        'earns today.',
      urgency: 'high' as const,
      terms: {
        budget_ceiling: { amount: 7_000, currency: 'EUR', period: 'monthly' },
        contract_formats: ['monthly_retainer', 'outcome_based'],
        start_by: inDays(45),
        requirements: ['gdpr_dpa', 'english_language'],
        dealbreakers: [],
      } satisfies BuyerTerms,
    },
    reasoning_public:
      'Delivers chilled grocery orders daily in three Baltic cities and is short of capacity on ' +
      'the Riga routes. Your fleet already runs those roads, with returns handled at the warehouse.',
  },
  {
    service: 'Contract warehousing in Tallinn and Riga',
    score: 84,
    company: {
      name: 'Tamme Furniture',
      website: 'https://tammefurniture.ee',
      profile: {
        name: 'Tamme Furniture',
        industry: 'Furniture manufacturing',
        size_hint: '~140 people',
        services: ['Oak and birch furniture', 'Private-label production', 'Export to the Nordics'],
        keywords: ['furniture', 'manufacturing', 'private label', 'export'],
        summary:
          'A family-owned Estonian furniture maker producing oak and birch pieces for Nordic retail ' +
          'chains under their own labels, from a single plant outside Viljandi.',
        city: 'Viljandi',
        country: 'Estonia',
        languages: ['Estonian', 'English', 'Finnish'],
        industries_served: ['Retail', 'Hospitality'],
        employees: 140,
        founded: 1998,
      },
    },
    problem: {
      department: 'Operations',
      text:
        'Export stock is spread across three rented halls\n' +
        'Finished pieces waiting for the Finland run sit in three rented halls on three different ' +
        'contracts, and nobody can say in one place what is where. Twice this year we shipped a ' +
        'batch that was already promised to another chain.',
      urgency: 'medium' as const,
      terms: {
        budget_ceiling: { amount: 5_000, currency: 'EUR', period: 'monthly' },
        contract_formats: ['monthly_retainer'],
        start_by: inDays(60),
        requirements: ['gdpr_dpa', 'estonian_language'],
        dealbreakers: [],
      } satisfies BuyerTerms,
    },
    reasoning_public:
      'Makes private-label furniture for Nordic retail and wants one bonded warehouse instead of ' +
      'three rented halls. Your Tallinn and Riga space and the stock portal answer what they asked.',
  },
];

/** A transcript that says nothing about the problem itself — the guard in leak.ts is the rule. */
const dialogue = (format: string): AgentDialogueLine[] => [
  { speaker: 'buyer_agent', text: 'My client needs this handled continuously, not as a one-off build. Can you work that way?' },
  { speaker: 'seller_agent', text: `Yes. We run this as an ongoing service and can start within three weeks. ${format} is how we normally price it.` },
  { speaker: 'buyer_agent', text: 'How many of these have you taken over from a manual process?', withheld: true },
  { speaker: 'seller_agent', text: 'Eleven in the last two years, all in the Baltics. We can name two references in the same industry.' },
  { speaker: 'buyer_agent', text: 'Good. Volumes and the exact scope are for the humans to settle.' },
  { speaker: 'seller_agent', text: 'Agreed. We would suggest a paid pilot on one site before the full rollout.' },
];

const envelope = (format: DealEnvelope['agreed_format'], start: string): DealEnvelope => ({
  verdict: 'proceed',
  agreed_format: format,
  budget_compatible: true,
  earliest_start: start,
  open_questions: ['Volumes per month', 'Which site the pilot runs on'],
  confidence: 82,
});

async function main() {
  const db = adminClient();

  // 1. The account. Created once, then reused — the id has to stay stable across runs.
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  let userId = list.users.find((u) => u.email === EMAIL)?.id;
  if (!userId) {
    const { data, error } = await db.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`  + user ${EMAIL}`);
  } else {
    // Regeneration resets the password too, so the demo credentials always work.
    await db.auth.admin.updateUserById(userId, { password: PASSWORD, email_confirm: true });
    console.log(`  = user ${EMAIL}`);
  }

  // 2. Wipe what the previous run made. Services, problems and matches hang off the company by
  //    `on delete cascade`, so one delete is the whole reset.
  const { error: delErr } = await db.from('companies').delete().eq('owner_id', userId);
  if (delErr) throw delErr;

  // 3. The company the demo account is signed in as.
  const { data: company, error: cErr } = await db
    .from('companies')
    .insert({
      owner_id: userId,
      name: COMPANY.name,
      website: COMPANY.website,
      role: COMPANY.role,
      profile_json: COMPANY.profile,
      seller_terms: COMPANY.seller_terms,
    })
    .select('id')
    .single();
  if (cErr) throw cErr;

  const { error: sErr } = await db.from('services').insert(
    SERVICES.map((s) => ({
      company_id: company.id,
      title: s.title,
      description: s.description,
      area: s.area,
      terms: s.terms,
      active: true,
    })),
  );
  if (sErr) throw sErr;

  const { data: problems, error: pErr } = await db
    .from('problems')
    .insert(
      PROBLEMS.map((p) => ({
        company_id: company.id,
        text: p.text,
        department: p.department,
        urgency: p.urgency,
        buyer_terms: p.terms,
      })),
    )
    .select('id, text');
  if (pErr) throw pErr;

  // 4. Counterparties: real sellers from the seeded catalogue, each with a live service to be
  //    matched through. Without them there is nothing to match against — say so plainly.
  const { data: sellers } = await db
    .from('services')
    .select('id, title, terms, companies!inner(id, name, profile_json)')
    .eq('active', true)
    .neq('company_id', company.id)
    .limit(60);

  // One service per company: a match is unique on (problem, seller company), so two services
  // of the same vendor would collide on the second insert.
  const all = (sellers ?? []).filter((s) => s.terms) as unknown as {
    id: string;
    title: string;
    terms: SellerTerms;
    companies: { id: string; name: string };
  }[];
  const pool = [...new Map(all.map((s) => [s.companies.id, s])).values()];
  if (pool.length < 4) throw new Error('Not enough seeded sellers with terms — run `npm run seed` first.');

  const byProblem = (key: string) => problems[PROBLEMS.findIndex((p) => p.key === key)];
  const pick = (n: number) => pool[n % pool.length];
  const terms = (key: string) => PROBLEMS.find((p) => p.key === key)!.terms;

  const rows = [
    // "Matching": one deal both agents cleared and the buyer accepted, one still being read.
    {
      problem: byProblem('matching'),
      seller: pick(0),
      buyerTerms: terms('matching'),
      score: 92,
      status: 'accepted' as const,
      reasoning_public:
        'Runs invoice intake as a managed service for Baltic mid-market clients, with a DPA and ' +
        'EU-only hosting. Their smallest engagement sits inside what this buyer can spend.',
      dialogue: dialogue('A monthly retainer'),
      envelope: envelope('monthly_retainer', inDays(21)),
      brief: true,
    },
    {
      problem: byProblem('matching'),
      seller: pick(1),
      buyerTerms: terms('matching'),
      score: 78,
      status: 'proposed' as const,
      reasoning_public:
        'Automates document-heavy back-office work and has taken over a manual process before. ' +
        'Timing and format cleared; the scope is what the humans would settle.',
      dialogue: dialogue('A pilot first'),
      envelope: envelope('pilot_first', inDays(30)),
      brief: false,
    },
    // "Potential": found, but a term apart — no envelope, so the screen shows them as awaiting.
    {
      problem: byProblem('potential'),
      seller: pick(2),
      buyerTerms: terms('potential'),
      score: 74,
      status: 'proposed' as const,
      reasoning_public: 'Does on-site network work in Estonian and has warehouse references.',
      dialogue: null,
      envelope: null,
      brief: false,
    },
    {
      problem: byProblem('potential'),
      seller: pick(3),
      buyerTerms: terms('potential'),
      score: 71,
      status: 'proposed' as const,
      reasoning_public: 'Industrial wifi surveys and hardware replacement, with a fixed-price option.',
      dialogue: null,
      envelope: null,
      brief: false,
    },
    // And one that said no, so the Declined group is not empty either.
    {
      problem: byProblem('potential'),
      seller: pick(4),
      buyerTerms: terms('potential'),
      score: 68,
      status: 'declined' as const,
      reasoning_public: 'Network integrator, but booked out past the date this needs to start.',
      dialogue: null,
      envelope: null,
      brief: false,
    },
    // The third problem gets nothing on purpose: that is the "Searching" state.
  ];

  for (const r of rows) {
    // Compatibility is computed, never written by hand — the demo shows the real check.
    const compatibility = checkCompatibility(r.buyerTerms, r.seller.terms);
    const { error } = await db.from('matches').insert({
      buyer_company_id: company.id,
      seller_company_id: r.seller.companies.id,
      problem_id: r.problem.id,
      service_id: r.seller.id,
      score: r.score,
      status: r.status,
      reasoning_public: r.reasoning_public,
      compatibility_json: compatibility,
      agent_dialogue_json: r.dialogue,
      deal_envelope_json: r.envelope,
      negotiation_started_at: r.dialogue ? new Date().toISOString() : null,
      brief_md: r.brief ? BRIEF : null,
    });
    if (error) throw error;
    console.log(`  + match ${r.score} ${r.seller.companies.name} (${r.status})`);
  }

  // 5. The selling side: buyers who came to Nordwell's own services, none of them opened yet.
  //    Their owner is a second account, so the demo account reads these as a seller and every
  //    row is blurred behind its credit. Deleting the companies takes their matches, and with
  //    them any unlock already paid for — a regenerated demo is always locked again.
  const { data: others } = await db.auth.admin.listUsers({ perPage: 1000 });
  let incomingOwner = others.users.find((u) => u.email === INCOMING_OWNER)?.id;
  if (!incomingOwner) {
    const { data, error } = await db.auth.admin.createUser({ email: INCOMING_OWNER, email_confirm: true });
    if (error) throw error;
    incomingOwner = data.user.id;
  }
  await db.from('companies').delete().eq('owner_id', incomingOwner);

  const { data: own } = await db.from('services').select('id, title, terms').eq('company_id', company.id);

  for (const inc of INCOMING) {
    const service = (own ?? []).find((s) => s.title === inc.service);
    if (!service) throw new Error(`Demo service missing: ${inc.service}`);

    const { data: buyer, error: bErr } = await db
      .from('companies')
      .insert({
        owner_id: incomingOwner,
        name: inc.company.name,
        website: inc.company.website,
        role: 'buyer',
        profile_json: inc.company.profile,
        seller_terms: null,
      })
      .select('id')
      .single();
    if (bErr) throw bErr;

    const { data: problem, error: bpErr } = await db
      .from('problems')
      .insert({
        company_id: buyer.id,
        text: inc.problem.text,
        department: inc.problem.department,
        urgency: inc.problem.urgency,
        buyer_terms: inc.problem.terms,
      })
      .select('id')
      .single();
    if (bpErr) throw bpErr;

    const { error: mErr } = await db.from('matches').insert({
      buyer_company_id: buyer.id,
      seller_company_id: company.id,
      problem_id: problem.id,
      service_id: service.id,
      score: inc.score,
      // The buyer has already said they want to meet: the next move, and the credit, are the
      // seller's.
      status: 'buyer_interested',
      reasoning_public: inc.reasoning_public,
      compatibility_json: checkCompatibility(inc.problem.terms, service.terms as SellerTerms),
      agent_dialogue_json: dialogue('A monthly retainer'),
      deal_envelope_json: envelope('monthly_retainer', inDays(21)),
      negotiation_started_at: new Date().toISOString(),
    });
    if (mErr) throw mErr;
    console.log(`  + incoming ${inc.score} ${inc.company.name} (locked)`);
  }

  const { error: crErr } = await db.from('companies').update({ credits: START_CREDITS }).eq('id', company.id);
  if (crErr) throw crErr;

  console.log(
    `Done: ${EMAIL} / ${PASSWORD} — ${SERVICES.length} services, ${problems.length} problems, ` +
      `${rows.length} matches out, ${INCOMING.length} locked in, ${START_CREDITS} credits.`,
  );
}

const BRIEF = `## Why you are meeting

Both agents cleared the same three terms: budget, start date and contract format. What is left
is scope, and neither side can settle that without you.

## What is agreed

- Monthly retainer, starting in about three weeks
- A paid pilot on one site before a full rollout

## Open questions

- Volumes per month
- Which site the pilot runs on`;

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
