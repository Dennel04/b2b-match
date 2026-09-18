import { z } from 'zod';

export const ProfileSchema = z.object({
  name: z.string(),
  industry: z.string(),
  size_hint: z.string(),
  services: z.array(z.string()),
  keywords: z.array(z.string()),
  summary: z.string(),
});

export const profilePrompt = (siteText: string) => `
Ты аналитик B2B-рынка. Ниже — текст с сайта компании.
Собери структурированный профиль: чем компания занимается и что продаёт другим бизнесам.

Правила:
- services: конкретные услуги/продукты, 3-7 штук, формулировки как у продавца.
- keywords: 5-10 слов, по которым эту компанию стоит находить.
- summary: 2-3 предложения, нейтрально, без маркетингового шума. Это увидит потенциальный клиент.
- size_hint: оценка размера ("1-10", "10-50", "50+", "неизвестно").
- Если данных мало — пиши "неизвестно", не выдумывай.

Текст сайта:
"""
${siteText}
"""
`.trim();
