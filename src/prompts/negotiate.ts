import { z } from 'zod';

export const NegotiationSchema = z.object({
  lines: z.array(
    z.object({
      speaker: z.enum(['buyer_agent', 'seller_agent']),
      text: z.string(),
    }),
  ),
  envelope: z.object({
    verdict: z.enum(['proceed', 'reject']),
    agreed_format: z
      .enum(['pilot_first', 'fixed_price', 'monthly_retainer', 'time_and_materials', 'outcome_based'])
      .nullable(),
    budget_compatible: z.boolean(),
    earliest_start: z.string().nullable(),
    open_questions: z.array(z.string()),
    confidence: z.number().min(0).max(100),
  }),
});

/**
 * The core of the product: the negotiation happens between machines, with no human in the loop.
 * The buyer agent protecting the raw problem text is a product requirement, not a style note.
 */
export const negotiatePrompt = (opts: {
  problemText: string;
  dealbreakers: string[];
  sellerSummary: string;
  sellerServices: string[];
  compatibilitySummary: string;
}) => `
Play out a negotiation between two AI agents representing their companies. The humans on both
sides do not yet know the other exists and will only ever see the outcome.

THE BUYER'S AGENT knows its company's problem (STRICTLY CONFIDENTIAL):
"""${opts.problemText}"""
Buyer dealbreakers: ${opts.dealbreakers.join('; ') || 'none stated'}

THE SELLER'S AGENT knows its own company:
"""${opts.sellerSummary}"""
Services: ${opts.sellerServices.join(', ')}

The platform has already compared the commercial terms mechanically and tells both agents only
the result:
${opts.compatibilitySummary}

HARD RULES:
- The buyer's agent NEVER quotes the problem text and never names amounts, clients, or internal
  figures. It speaks at task level: "we need help with X, roughly this scale." It reveals
  exactly as much as the next question requires, and no more.
- Neither agent names a specific sum. Budget has already been checked by the platform; only the
  payment format is open for discussion.
- The seller's agent answers substantively: have they done this before, in what timeframe, what
  the risks are. It must not overpromise — if they have not done it, it says so.
- 8 lines total, buyer_agent starts, alternating, 1-2 sentences each, natural language.
- The agents must converge on one contract format from the shared set, or state honestly that
  they cannot.

Besides the transcript, return the envelope:
- verdict: 'proceed' only if the seller can genuinely solve this AND a shared contract format
  exists. When in doubt, 'reject' — a wasted human meeting costs more than a missed match.
- agreed_format: the format they settled on, or null.
- open_questions: 1-3 questions the agents could not settle that the humans must discuss. This
  is the most valuable field — it becomes the briefing.
- confidence: how sure you are the meeting would be worth both sides' time.

Write in English.
`.trim();
