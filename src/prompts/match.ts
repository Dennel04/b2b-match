import { z } from 'zod';

export const MatchScoresSchema = z.object({
  results: z.array(
    z.object({
      seller_company_id: z.string(),
      score: z.number().min(0).max(100),
      reasoning_public: z.string(),
    }),
  ),
});

/**
 * ВАЖНО: reasoning_public увидит продавец. Прямые цитаты из проблемы запрещены —
 * это ядро приватности продукта, а не косметика.
 */
export const matchPrompt = (
  problemText: string,
  sellers: { id: string; summary: string; services: string[] }[],
) => `
Компания-покупатель описала свою проблему (КОНФИДЕНЦИАЛЬНО, её текст никому не показывают):
"""
${problemText}
"""

Ниже список компаний-продавцов. Оцени каждого от 0 до 100: насколько он реально может решить
эту проблему.

${sellers.map((s) => `[${s.id}]\n${s.summary}\nУслуги: ${s.services.join(', ')}`).join('\n\n')}

Для каждого верни reasoning_public — 2 предложения о том, почему совпадение есть.
Жёсткое правило: reasoning_public увидит продавец, поэтому НЕ цитируй текст проблемы,
не называй сумм, имён, внутренних деталей. Пиши на уровне категории:
"компании нужна помощь с X в области Y".

Оценивай строго. 80+ только если услуга прямо закрывает проблему.
`.trim();
