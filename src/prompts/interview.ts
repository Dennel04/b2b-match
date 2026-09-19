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
  /** Up to two runners-up from the same list. The chat offers these instead of all seventeen. */
  department_alternatives: z.array(z.string()),
  /**
   * Which closed options are worth offering THIS buyer. The chat asks about contract formats and
   * requirements with buttons and no model call, so without these it offers every one of them —
   * and a company hiring a few builders for €500 gets asked about ISO 27001.
   */
  suggested_formats: z.array(ContractFormatEnum),
  suggested_requirements: z.array(RequirementEnum),
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
YOUR questions — these two, and only these:
1. What exactly hurts, and what it costs per month — in money or in hours.
2. What they have already tried and why it did not work.

Ask number 2 only if it is still open. "We have not tried anything yet", "we are starting from
scratch", "we do not know where to look" all answer it — move on rather than asking a person to
repeat themselves.

NOT your questions. The form asks these immediately after you, with buttons, and asking them
yourself is the most visible way this interview wastes someone's time — they answer in words and
are then shown the same question as a control:
  - the part of the business
  - the deadline
  - the budget ceiling, and whether it is one-off or monthly
  - contract formats
  - hard requirements and dealbreakers
Never ask about any of them, not even to confirm. Fill the fields from anything they happen to
mention, and leave the rest null for the form to collect.

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
${departments.length ? `- department: exactly one of ${departments.join(', ')}. Null if it is not clear yet.
  File it by the function that OWNS the problem, not by the industry the work happens in. A
  company that cannot find people to build something has a People & hiring problem, whatever is
  being built; a company whose own production line is failing has a Production one. Ask yourself
  whose desk this lands on.
- department_alternatives: up to TWO more from that same list — the ones you would pick if your
  first answer is wrong. The person is shown these as buttons instead of the whole list, so they
  decide whether one tap finishes the question or seventeen options have to be read. Order them
  best first, never repeat \`department\`, and return an empty array when nothing else is
  plausible. Guessing wildly here is worse than returning none: a wrong suggestion is read as
  the product not understanding the problem.` : ''}
- summary: the problem as it stands, 2-4 sentences. Rewrite it as the answers add to it.
- suggested_formats and suggested_requirements: the options the form should put in front of THIS
  buyer, not the ones that exist. The person is asked both with buttons and no further thinking
  on your side, so an option you list is an option they are nudged to tick.
  Judge by the size and nature of the deal you have actually heard about. A small one-off job
  from a company with no regulated data plausibly wants fixed price or outcome-based, and needs
  a working language and nothing else; ISO 27001, EU data residency and on-site presence belong
  to large engagements that touch personal data or premises, and offering them to a €500 job
  reads as a form that was not listening. Two to four formats, zero to three requirements, and
  an empty array is a real answer — it means "ask this one plainly".
- If they will not name a budget, do not push. Leave budget_ceiling null and move on.
- done=true and follow_up null as soon as your two questions are answered — or sooner, if the
  answers already cover them. Stopping early is a feature: the form takes it from there.
- start_by must be an absolute ISO date. Resolve "in a month" against today's date.
- terms: the fields you know, the rest null or empty. Never invent a budget or a date.
- Write in English.

Conversation so far:
${turns.length ? turns.map((t) => `Q: ${t.question}\nA: ${t.answer}`).join('\n') : '(none — ask the first question)'}
`.trim();
