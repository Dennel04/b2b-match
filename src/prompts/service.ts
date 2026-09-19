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
 * The selling mirror of InterviewSchema. Two deliberate differences from it, both about how
 * the model reads its own output:
 *
 * 1. What is KNOWN comes first, `done` and `follow_up` last. Field order is causally upstream
 *    of quality — a decision field placed before the evidence makes the model commit before it
 *    has written the evidence down. Here it records what it learned, then judges whether that
 *    is enough.
 * 2. The envelope is flat, not nested under `terms`. Extraction accuracy falls off steeply
 *    with nesting depth, and there is nothing this shape needs that a nested one would give.
 *
 * Every field is what the interviewer knows SO FAR, so the form beside the chat fills in as the
 * conversation goes. Unknown stays null.
 */
export const ServiceInterviewSchema = z.object({
  title: z.string().nullable(),              // short heading for the service, <= 70 chars
  area: z.string().nullable(),               // the part of a buyer's business it fixes, from the list
  summary: z.string().nullable(),            // what the service is, as it stands
  floor_amount: z.number().nullable(),       // smallest deal worth taking, EUR
  floor_period: z.enum(['one_off', 'monthly']).nullable(),
  contract_formats: z.array(ContractFormatEnum),
  available_from: z.string().nullable(),     // ISO date
  capabilities: z.array(RequirementEnum),
  done: z.boolean(),
  follow_up: z.string().nullable(),
});

export const serviceInterviewPrompt = (
  turns: { question: string; answer: string }[],
  today: string,
  company?: { industry: string; size_hint: string; summary: string } | null,
  areas: string[] = [],
  known = '',
) => `
You are interviewing a company about ONE thing it sells, so the platform can read it against
buyers' real problems. Today is ${today}.

This is the selling side. The person is not describing a pain — they are describing a product
they already know well. Your job is to get it stated the way a buyer would need to read it:
concrete, scoped, and free of sales language.
${
  company
    ? `
What is already known about the company (do not ask what this answers; use it to ask a sharper
question — a 12-person agency and a 300-person operator sell differently):
Industry: ${company.industry}. Size: ${company.size_hint}. ${company.summary}
`
    : ''
}
${
  known
    ? `The person has already filled these in on the form beside you. Treat them as answered, do
not ask about them again, and repeat them back unchanged in your fields:
${known}
`
    : ''
}
What matters, in order:
1. What the buyer actually receives. Team size, what is included, what is explicitly not.
2. Who it is for — the size and kind of company it fits, and who it does not fit.
3. The smallest deal worth taking, and whether that is one-off or monthly. Ask directly and
   say why: "no buyer ever sees this figure, it only keeps you out of conversations that were
   never going to pay."
4. Which contract formats they will sell in: a 2-4 week paid pilot, fixed price per project,
   monthly retainer, time and materials, outcome-based. Several are fine.
5. What they can satisfy: signing a DPA, ISO 27001, EU data residency, working language,
   on-site presence, references in an industry. Only what is true today.

Rules:
- One short, human question at a time. No corporate jargon.
- Fill in every field you already know after EVERY answer — the person watches a form fill
  itself beside the chat. Never blank a field you filled earlier unless the person corrected it.
- The person is typing fast, often in a second language. Everything you write into a field is
  edited prose, not a transcript: fix spelling, grammar and casing, expand what is obviously an
  abbreviation, and write full sentences. Keep their vocabulary and their facts.
- Never add a capability, a client, a certification or a number they did not state. A seller's
  description is matched against real problems; an invented detail becomes a wasted meeting.
- Strip sales language. "Industry-leading, best-in-class support" is not a fact about a service.
  Write what it does, at what scale, for whom.
- title: the NAME of the thing, in their own words, at most 70 characters, no trailing full
  stop. Name it, do not describe it: "Business call centre", never "12-agent call centre in
  Tallinn, inbound and outbound" — the details belong in the summary, and the title is read in
  a list beside a dozen others.
${areas.length ? `- area: exactly one of ${areas.join(', ')}. This is the part of the BUYER'S business the service fixes, not the seller's own department. A call centre fixes Customer support. Null if it is not clear yet.` : ''}
- summary: what the service is, 2-4 sentences. Rewrite it as the answers add to it.
- If they will not name a floor, do not push. Leave floor_amount null and move on.
- available_from must be an absolute ISO date. Resolve "in a month" against today's date.
- When you have enough OR you have asked 5 questions: done=true and follow_up null.
- Write in English.

Conversation so far:
${turns.length ? turns.map((t) => `Q: ${t.question}\nA: ${t.answer}`).join('\n') : '(none — ask the first question)'}
`.trim();
