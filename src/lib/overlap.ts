import type {
  BuyerTerms,
  Compatibility,
  ContractFormat,
  MoneyRange,
  SellerTerms,
} from '@/types';

/**
 * Машинная проверка совместимости ДО вызова модели.
 * Смысл в приватности: ни одна сторона не видит чисел другой — платформа
 * сравнивает их внутри и наружу отдаёт только «сходится / не сходится».
 */
export function checkCompatibility(buyer: BuyerTerms, seller: SellerTerms): Compatibility {
  const budget = compareBudget(buyer.budget_ceiling, seller.budget_floor);
  const timeline = compareDates(seller.available_from, buyer.start_by);
  const formats = buyer.contract_formats.filter((f) => seller.contract_formats.includes(f));
  const missing = buyer.requirements.filter((r) => !seller.capabilities.includes(r));

  return {
    budget,
    timeline,
    contract_formats: formats,
    missing_requirements: missing,
    hard_fail: budget === 'gap' || timeline === 'gap' || !formats.length || missing.length > 0,
  };
}

/** Продавец проходит, если его минимальный чек не выше потолка покупателя. */
function compareBudget(ceiling: MoneyRange | null, floor: MoneyRange | null): Compatibility['budget'] {
  if (!ceiling || !floor) return 'unknown';
  // Разные периоды сравнивать нечестно: месяц приводим к году, разовый платёж — как есть.
  const norm = (m: MoneyRange) => (m.period === 'monthly' ? m.amount * 12 : m.amount);
  return norm(floor) <= norm(ceiling) ? 'ok' : 'gap';
}

/** Продавец проходит, если освобождается не позже, чем покупателю надо начать. */
function compareDates(availableFrom: string | null, startBy: string | null): Compatibility['timeline'] {
  if (!availableFrom || !startBy) return 'unknown';
  return new Date(availableFrom) <= new Date(startBy) ? 'ok' : 'gap';
}

/** Человекочитаемая сводка для агента-переговорщика. Цифр здесь нет и быть не должно. */
export function describeCompatibility(c: Compatibility): string {
  const fmt = (f: ContractFormat) => FORMAT_LABELS[f];
  return [
    `Бюджет: ${{ ok: 'сходится', gap: 'не сходится', unknown: 'не заявлен' }[c.budget]}`,
    `Сроки: ${{ ok: 'сходятся', gap: 'не сходятся', unknown: 'не заявлены' }[c.timeline]}`,
    `Общие форматы контракта: ${c.contract_formats.map(fmt).join(', ') || 'нет'}`,
    c.missing_requirements.length
      ? `Не закрыты требования: ${c.missing_requirements.join(', ')}`
      : 'Все требования покупателя закрыты',
  ].join('\n');
}

export const FORMAT_LABELS: Record<ContractFormat, string> = {
  pilot_first: 'пилот 2-4 недели',
  fixed_price: 'фикс за проект',
  monthly_retainer: 'помесячный ретейнер',
  time_and_materials: 'почасовая оплата',
  outcome_based: 'оплата за результат',
};
