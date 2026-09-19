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
  /** Up to two runners-up from the same list. The chat offers these instead of all seventeen. */
  area_alternatives: z.array(z.string()),
  /**
   * Which closed options are worth offering THIS seller. The chat asks about contract formats
   * and capabilities with buttons and no model call, so without these it offers every one.
   */
  suggested_formats: z.array(ContractFormatEnum),
  suggested_capabilities: z.array(RequirementEnum),
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
YOUR question — one, and it covers both halves:
1. What the buyer actually receives (team size, what is included, what is explicitly not) and
   who it is for — the size and kind of company it fits, and who it does not.

Skip it if the description they already wrote answers it. Stopping early is a feature.

NOT your questions. The form asks these immediately after you, with buttons, and asking them
yourself means the person answers the same thing twice — in words to you, then as a control:
  - the part of the buyer's business this fixes
  - when they could start
  - the smallest deal worth taking, and whether it is one-off or monthly
  - contract formats
  - what they can satisfy (DPA, ISO 27001, EU data residency, language, on-site, references)
Never ask about any of them, not even to confirm. Fill the fields from anything they happen to
mention, and leave the rest null for the form to collect.

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
${areas.length ? `- area: exactly one of ${areas.join(', ')}. This is the part of the BUYER'S business the service fixes, not the seller's own department. A call centre fixes Customer support. Null if it is not clear yet.
- area_alternatives: up to TWO more from that same list — the ones you would pick if your first
  answer is wrong. A service often fixes more than one part of a business, and the person is
  shown these as buttons instead of the whole list, so they decide whether one tap finishes the
  question or seventeen options have to be read. Order them best first, never repeat \`area\`,
  and return an empty array when nothing else is plausible. Guessing wildly here is worse than
  returning none.` : ''}
- summary: what the service is, 2-4 sentences. Rewrite it as the answers add to it.
- suggested_formats and suggested_capabilities: the options the form should put in front of THIS
  seller, not the ones that exist. They are asked with buttons and no further thinking on your
  side, so an option you list is an option they are nudged to tick.
  Judge by what you have actually heard. A service billed by the hour plausibly sells as time
  and materials; one with an install and a support tail sells as fixed price. A capability is
  worth offering only if this kind of work usually involves it — a call centre handling customer
  records plausibly signs a DPA, a small creative job does not need ISO 27001. Two to four
  formats, zero to three capabilities, and an empty array is a real answer.
- If they will not name a floor, do not push. Leave floor_amount null and move on.
- available_from must be an absolute ISO date. Resolve "in a month" against today's date.
- done=true and follow_up null as soon as your one question is answered — or immediately, if
  what they wrote already answers it. The form takes it from there.
- Write in English.

Conversation so far:
${turns.length ? turns.map((t) => `Q: ${t.question}\nA: ${t.answer}`).join('\n') : '(none — ask the first question)'}
`.trim();
