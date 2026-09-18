/** Самопроверка сравнения условий. Запуск: npm run check */
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

// Пол продавца выше потолка покупателя — отсекаем без вызова модели.
const tooPricey = checkCompatibility(buyer, {
  ...seller,
  budget_floor: { amount: 9000, currency: 'EUR', period: 'monthly' },
});
assert.equal(tooPricey.budget, 'gap');
assert.equal(tooPricey.hard_fail, true);

// Разовый платёж против помесячного: 2000/мес = 24000/год > 10000 разово.
assert.equal(
  checkCompatibility(
    { ...buyer, budget_ceiling: { amount: 10000, currency: 'EUR', period: 'one_off' } },
    { ...seller, budget_floor: { amount: 2000, currency: 'EUR', period: 'monthly' } },
  ).budget,
  'gap',
);

// Нет общих форматов контракта — говорить не о чем.
assert.equal(
  checkCompatibility(buyer, { ...seller, contract_formats: ['outcome_based'] }).hard_fail,
  true,
);

// Не закрыто требование покупателя.
assert.deepEqual(
  checkCompatibility(buyer, { ...seller, capabilities: [] }).missing_requirements,
  ['gdpr_dpa'],
);

// Стороны ничего не заявили — не отсекаем, пусть разбираются агенты.
const vague = checkCompatibility(
  { ...buyer, budget_ceiling: null, start_by: null, requirements: [] },
  { ...seller, budget_floor: null, available_from: null },
);
assert.equal(vague.budget, 'unknown');
assert.equal(vague.hard_fail, false);

console.log('overlap: все проверки прошли');
