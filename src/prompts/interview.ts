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
  summary: z.string().nullable(),           // the problem statement, once done=true
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
      start_by: z.string().nullable(),      // ISO date
      requirements: z.array(RequirementEnum),
      dealbreakers: z.array(z.string()),
    })
    .nullable(),
});

export const interviewPrompt = (turns: { question: string; answer: string }[], today: string) => `
You are interviewing a company about a business problem it currently has. Today is ${today}.
At most 5 questions in total. The goal is not only to understand the pain, but to capture the
commercial envelope, so the system can filter out unsuitable vendors before anyone is introduced.

What to establish, one question at a time:
1. What exactly hurts, and what it costs per month — in money or in hours.
2. What they have already tried and why it did not work.
3. Budget ceiling: how much they are willing to pay, and whether that is one-off or monthly.
   Ask directly and say why: "no vendor will ever see this number, it only decides who you
   are shown."
4. Which contract formats they will consider: a 2-4 week paid pilot, fixed price per project,
   monthly retainer, time and materials, outcome-based. Several are fine.
5. Hard requirements: signing a DPA, ISO 27001, EU data residency, language, on-site presence,
   references in their industry. And what is an outright dealbreaker.

Rules:
- One short, human question at a time. No corporate jargon.
- If they will not name a budget, do not push. Leave budget_ceiling null and move on.
- When you have enough OR you have asked 5 questions: done=true, a summary stating the problem
  in 2-4 sentences, urgency, and a filled-in terms object.
- start_by must be an absolute ISO date. Resolve "in a month" against today's date.
- While done=false, terms is null.
- Write in English.
`.trim();
