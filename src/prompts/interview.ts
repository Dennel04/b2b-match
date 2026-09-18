import { z } from 'zod';

const ContractFormatEnum = z.enum([
  'pilot_first',
  'fixed_price',
  'monthly_retainer',
  'time_and_materials',
  'outcome_based',
]);

const RequirementEnum = z.enum([
  'gdpr_dpa',
  'iso27001',
  'eu_data_residency',
  'estonian_language',
  'english_language',
  'on_site',
  'industry_refs',
]);

export const InterviewSchema = z.object({
  done: z.boolean(),
  follow_up: z.string().nullable(),
  summary: z.string().nullable(),           // формулировка проблемы, когда done=true
  urgency: z.enum(['low', 'medium', 'high']).nullable(),
  terms: z
    .object({
      budget_ceiling: z
        .object({
          amount: z.number(),
          currency: z.literal('EUR'),
          period: z.enum(['one_off', 'monthly']),
        })
        .nullable(),
      contract_formats: z.array(ContractFormatEnum),
      start_by: z.string().nullable(),      // ISO-дата
      requirements: z.array(RequirementEnum),
      dealbreakers: z.array(z.string()),
    })
    .nullable(),
});

export const interviewPrompt = (turns: { question: string; answer: string }[], today: string) => `
Ты ведёшь короткое интервью с компанией о её бизнес-проблеме. Сегодня ${today}.
Максимум 5 вопросов всего. Цель — не только понять боль, но и снять коммерческую рамку,
чтобы система смогла отсеять неподходящих подрядчиков ещё до знакомства.

Что надо выяснить, по одному вопросу за раз:
1. Что конкретно болит и сколько это стоит в месяц — деньгами или временем.
2. Что уже пробовали и почему не сработало.
3. Потолок бюджета: сколько готовы платить и как — разово или помесячно.
   Спрашивай прямо и объясни зачем: «эту цифру не увидит ни один подрядчик,
   она нужна только чтобы не показывать вам тех, кто дороже».
4. Формат контракта, который готовы рассматривать: пилот на 2-4 недели, фикс за проект,
   помесячный ретейнер, почасовая оплата, оплата за результат. Можно несколько.
5. Жёсткие требования: подписание DPA, ISO 27001, хранение данных в ЕС, язык,
   присутствие на месте, референсы в отрасли. И что для вас стоп-фактор.

Текущая история интервью:
${turns.map((t, i) => `${i + 1}. В: ${t.question}\n   О: ${t.answer}`).join('\n') || '(пусто — задай первый вопрос)'}

Правила:
- Один вопрос за раз, короткий и человеческий, без канцелярита.
- Если человек не хочет называть бюджет — не дави, оставь budget_ceiling = null и иди дальше.
- Когда информации хватает ИЛИ задано 5 вопросов: done=true, summary с формулировкой
  проблемы в 2-4 предложениях, urgency и заполненный terms.
- start_by — абсолютная ISO-дата. «Через месяц» считай от сегодняшней даты.
- Пока done=false, terms = null.
`.trim();
