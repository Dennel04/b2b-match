import type {
  BuyerTerms,
  Compatibility,
  ContractFormat,
  MoneyRange,
  SellerTerms,
} from '@/types';

/**
 * Mechanical compatibility check, run before the model is called.
 * This is where the privacy claim lives: neither side sees the other's figures —
 * the platform compares them server-side and emits only "fits / does not fit".
 */
export function checkCompatibility(buyer: BuyerTerms, seller: SellerTerms): Compatibility {
  const budget = compareBudget(buyer.budget_ceiling, seller.budget_floor);
  const timeline = compareDates(seller.available_from, buyer.start_by);
  const formats = compareFormats(buyer.contract_formats, seller.contract_formats);
  const missing = buyer.requirements.filter((r) => !seller.capabilities.includes(r));

  return {
    budget,
    timeline,
    formats,
    contract_formats: buyer.contract_formats.filter((f) => seller.contract_formats.includes(f)),
    missing_requirements: missing,
    hard_fail: budget === 'gap' || timeline === 'gap' || formats === 'gap' || missing.length > 0,
  };
}

/**
 * Silence is not a refusal. A side that has named no contract format has not ruled anything
 * out — exactly as an unstated budget does not, and for the same reason: the filter exists to
 * remove pairs that cannot work, not pairs that have not finished filling in a form. Only two
 * stated sets that do not meet are a gap.
 */
function compareFormats(buyer: ContractFormat[], seller: ContractFormat[]): Compatibility['formats'] {
  if (!buyer.length || !seller.length) return 'unknown';
  return buyer.some((f) => seller.includes(f)) ? 'ok' : 'gap';
}

/** The seller passes if their minimum deal size is at or below the buyer's ceiling. */
function compareBudget(ceiling: MoneyRange | null, floor: MoneyRange | null): Compatibility['budget'] {
  if (!ceiling || !floor) return 'unknown';
  // Comparing across periods is unfair, so normalise monthly to a year.
  const norm = (m: MoneyRange) => (m.period === 'monthly' ? m.amount * 12 : m.amount);
  return norm(floor) <= norm(ceiling) ? 'ok' : 'gap';
}

/** The seller passes if they free up no later than the buyer needs to start. */
function compareDates(availableFrom: string | null, startBy: string | null): Compatibility['timeline'] {
  if (!availableFrom || !startBy) return 'unknown';
  return new Date(availableFrom) <= new Date(startBy) ? 'ok' : 'gap';
}

/** Human-readable summary handed to the negotiating agents. Contains no figures, by design. */
export function describeCompatibility(c: Compatibility): string {
  const fmt = (f: ContractFormat) => FORMAT_LABELS[f];
  return [
    `Budget: ${{ ok: 'compatible', gap: 'incompatible', unknown: 'not stated' }[c.budget]}`,
    `Timeline: ${{ ok: 'compatible', gap: 'incompatible', unknown: 'not stated' }[c.timeline]}`,
    c.formats === 'unknown'
      ? 'Contract format: neither side has named one, so agree one between you'
      : `Contract formats both sides accept: ${c.contract_formats.map(fmt).join(', ') || 'none'}`,
    c.missing_requirements.length
      ? `Unmet buyer requirements: ${c.missing_requirements.join(', ')}`
      : 'All buyer requirements are met',
  ].join('\n');
}

export const FORMAT_LABELS: Record<ContractFormat, string> = {
  pilot_first: 'paid pilot, 2-4 weeks',
  fixed_price: 'fixed price per project',
  monthly_retainer: 'monthly retainer',
  time_and_materials: 'time and materials',
  outcome_based: 'outcome-based',
};
