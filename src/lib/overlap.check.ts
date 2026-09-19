/** Self-check for the terms comparison. Run: npm run check */
import assert from 'node:assert/strict';
import { checkCompatibility } from './overlap';
import type { BuyerTerms, SellerTerms } from '@/types';

const buyer: BuyerTerms = {
  budget_ceiling: { amount: 4000, currency: 'EUR', period: 'monthly' },
  contract_formats: ['pilot_first', 'monthly_retainer'],
  start_by: '2026-10-01',
  requirements: ['gdpr_dpa'],
  dealbreakers: [],
};
const seller: SellerTerms = {
  budget_floor: { amount: 2500, currency: 'EUR', period: 'monthly' },
  contract_formats: ['monthly_retainer', 'time_and_materials'],
  available_from: '2026-09-25',
  capabilities: ['gdpr_dpa', 'iso27001'],
};

const ok = checkCompatibility(buyer, seller);
assert.equal(ok.budget, 'ok');
assert.equal(ok.timeline, 'ok');
assert.deepEqual(ok.contract_formats, ['monthly_retainer']);
assert.equal(ok.hard_fail, false);

// Seller floor above buyer ceiling — filtered out before the model is called.
const tooPricey = checkCompatibility(buyer, {
  ...seller,
  budget_floor: { amount: 9000, currency: 'EUR', period: 'monthly' },
});
assert.equal(tooPricey.budget, 'gap');
assert.equal(tooPricey.hard_fail, true);

// One-off against monthly: 2000/mo = 24000/yr > 10000 one-off.
assert.equal(
  checkCompatibility(
    { ...buyer, budget_ceiling: { amount: 10000, currency: 'EUR', period: 'one_off' } },
    { ...seller, budget_floor: { amount: 2000, currency: 'EUR', period: 'monthly' } },
  ).budget,
  'gap',
);

// Two stated sets that do not meet — nothing to discuss.
const clash = checkCompatibility(buyer, { ...seller, contract_formats: ['outcome_based'] });
assert.equal(clash.formats, 'gap');
assert.equal(clash.hard_fail, true);

// Silence is not a refusal. A company that has named no contract format has ruled nothing out,
// and must still be matched — every real account starts here, with the form half filled.
for (const pair of [
  [buyer, { ...seller, contract_formats: [] }],
  [{ ...buyer, contract_formats: [] }, seller],
  [{ ...buyer, contract_formats: [] }, { ...seller, contract_formats: [] }],
] as [BuyerTerms, SellerTerms][]) {
  const quiet = checkCompatibility(pair[0], pair[1]);
  assert.equal(quiet.formats, 'unknown');
  assert.equal(quiet.hard_fail, false);
  assert.deepEqual(quiet.contract_formats, [], 'an unknown format agrees on nothing yet');
}

// A buyer requirement is unmet.
assert.deepEqual(
  checkCompatibility(buyer, { ...seller, capabilities: [] }).missing_requirements,
  ['gdpr_dpa'],
);

// Neither side stated terms — do not filter, let the agents work it out.
const vague = checkCompatibility(
  { ...buyer, budget_ceiling: null, start_by: null, requirements: [] },
  { ...seller, budget_floor: null, available_from: null },
);
assert.equal(vague.budget, 'unknown');
assert.equal(vague.hard_fail, false);

console.log('overlap: all checks passed');
