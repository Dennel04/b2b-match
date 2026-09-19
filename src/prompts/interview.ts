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

/**
 * Every field is what the interviewer knows SO FAR, so the form next to the chat can fill in as
 * the conversation goes. Unknown stays null; `done` only says no more questions are needed.
 */
export const InterviewSchema = z.object({
  done: z.boolean(),
  follow_up: z.string().nullable(),
  title: z.string().nullable(),             // short heading for the problem, <= 70 chars
  department: z.string().nullable(),        // the part of the business, from the given list
  summary: z.string().nullable(),           // the problem statement as it stands
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

export const interviewPrompt = (
  turns: { question: string; answer: string }[],
  today: string,
  company?: { industry: string; size_hint: string; summary: string } | null,
  departments: string[] = [],
  known = '',
) => `
You are interviewing a company about a business problem it currently has. Today is ${today}.
At most 5 questions in total. The goal is not only to understand the pain, but to capture the
commercial envelope, so the system can filter out unsuitable vendors before anyone is introduced.
${
  company
    ? `
What is already known about the company (do not ask what this answers; use it to ask sharper
questions — a 12-person agency and a 300-person plant have different problems):
Industry: ${company.industry}. Size: ${company.size_hint}. ${company.summary}
`
    : ''
}

${known ? `The person has already filled these in on the form beside you. Treat them as answered, do
not ask about them again, and repeat them back unchanged in your fields:
${known}
` : ''}
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
- Fill in every field you already know after EVERY answer — the person watches a form fill itself
  beside the chat. Never blank a field you filled earlier unless the person corrected it.
- The person is typing fast, often in a second language. Everything you write into a field is
  edited prose, not a transcript: fix spelling, grammar and casing, expand what is obviously an
  abbreviation, and write full sentences. Keep their vocabulary and their facts — never add a
  detail they did not give you, never soften or inflate the problem, never add adjectives.
  "the pr unit works bad and viewers in social media is small" becomes "The PR team is not
  performing and our social media reach is low."
- title: a short heading in their own words, at most 70 characters, no trailing full stop.
${departments.length ? `- department: exactly one of ${departments.join(', ')}. Null if it is not clear yet.` : ''}
- summary: the problem as it stands, 2-4 sentences. Rewrite it as the answers add to it.
- If they will not name a budget, do not push. Leave budget_ceiling null and move on.
- When you have enough OR you have asked 5 questions: done=true and follow_up null.
- start_by must be an absolute ISO date. Resolve "in a month" against today's date.
- terms: the fields you know, the rest null or empty. Never invent a budget or a date.
- Write in English.

Conversation so far:
${turns.length ? turns.map((t) => `Q: ${t.question}\nA: ${t.answer}`).join('\n') : '(none — ask the first question)'}
`.trim();
