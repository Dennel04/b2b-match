/**
 * Gives a few seeded companies their own login, so both sides of a match can be opened at once.
 *
 *   npm run demo:logins
 *
 * The seed puts every company under one owner, which is fine for generating data and wrong for
 * showing it: `getMatchView()` then reports `viewer: 'both'` and one account sees both halves of
 * every match. The demo rests on the opposite — two windows, the buyer's and the vendor's, with
 * different things visible in each. That needs two accounts.
 *
 * Safe to re-run: an existing user is reused, and ownership is simply set again.
 */
import { adminClient } from '../src/lib/supabase';

const PASSWORD = 'Crossdesk2026!';

/** The matches worth showing: three the agents cleared, one they refused. */
const PAIRS = [
  { match: '745d4996-773e-4575-b573-4e01029e51f9', note: 'score 95, two withheld lines' },
  { match: '80166e4a-7390-42a3-aa23-0ce4f8bc766d', note: 'score 90, two withheld lines' },
  { match: '9c5a2e09-c13c-4784-b2d4-fd810e665c69', note: 'score 95' },
  { match: '46c1be3d-59b5-4ffa-a341-07510f6b05c3', note: 'the agents said no' },
];

/** "Pakiaed OÜ" → "pakiaed@demo.crossdesk.ee" */
const emailFor = (name: string) =>
  `${name.toLowerCase().replace(/\s*(oü|as|sa|ou)\b/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 24)}@demo.crossdesk.ee`;

async function userFor(email: string): Promise<string> {
  const db = adminClient();
  const { data: created, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (!error && created.user) return created.user.id;

  // Already there from a previous run: find it and reset the password to the shared one.
  const { data: list } = await db.auth.admin.listUsers({ perPage: 200 });
  const found = list.users.find((u) => u.email === email);
  if (!found) throw error ?? new Error(`could not create or find ${email}`);
  await db.auth.admin.updateUserById(found.id, { password: PASSWORD, email_confirm: true });
  return found.id;
}

async function main() {
  const db = adminClient();
  const rows: { role: string; company: string; email: string; match: string; note: string }[] = [];

  for (const pair of PAIRS) {
    const { data: m, error } = await db
      .from('matches')
      .select(
        `id,
         buyer:companies!matches_buyer_company_id_fkey(id, name),
         seller:companies!matches_seller_company_id_fkey(id, name)`,
      )
      .eq('id', pair.match)
      .single();
    if (error || !m) throw error ?? new Error(`match ${pair.match} not found`);

    const sides = m as unknown as { buyer: { id: string; name: string }; seller: { id: string; name: string } };
    for (const [role, side] of [['buyer', sides.buyer], ['vendor', sides.seller]] as const) {
      const email = emailFor(side.name);
      const userId = await userFor(email);
      const { error: uErr } = await db.from('companies').update({ owner_id: userId }).eq('id', side.id);
      if (uErr) throw uErr;
      rows.push({ role, company: side.name, email, match: pair.match, note: pair.note });
      console.log(`  ${role.padEnd(6)} ${side.name.padEnd(26)} ${email}`);
    }
  }

  console.log(`\nPassword for all of them: ${PASSWORD}\n`);
  console.log('Open the same match in two windows, one signed in as each side:');
  for (const pair of PAIRS) {
    const both = rows.filter((r) => r.match === pair.match);
    console.log(`  /matches/${pair.match}  (${pair.note})`);
    both.forEach((r) => console.log(`      ${r.role.padEnd(6)} ${r.email}`));
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
