import { z } from 'zod';
import type { AgentDialogueLine, ContractFormat } from '@/types';

/**
 * The negotiation runs as TWO SEPARATE CALLS PER ROUND, one per agent.
 * The seller's agent is never handed the problem text — not as context, not as a summary.
 * Everything it knows about the buyer's need is what the buyer's agent chose to say out loud.
 *
 * That is the difference between the privacy claim being architecture and being a promise:
 * sellerTurnPrompt() can be printed on stage and inspected, and the problem is not in it.
 */

export const BuyerTurnSchema = z.object({
  text: z.string(),
  withheld: z.boolean(),
});

export const SellerTurnSchema = z.object({
  text: z.string(),
});

export const EnvelopeSchema = z.object({
  verdict: z.enum(['proceed', 'reject']),
  agreed_format: z
    .enum(['pilot_first', 'fixed_price', 'monthly_retainer', 'time_and_materials', 'outcome_based'])
    .nullable(),
  open_questions: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

const transcriptFor = (lines: AgentDialogueLine[], you: AgentDialogueLine['speaker']) =>
  lines.length
    ? lines.map((l) => `${l.speaker === you ? 'You' : 'Them'}: ${l.text}`).join('\n')
    : '(nothing said yet)';

export const buyerTurnPrompt = (opts: {
  problemText: string;
  dealbreakers: string[];
  compatibilitySummary: string;
  transcript: AgentDialogueLine[];
  isFirst: boolean;
  isLast: boolean;
}) => `
You are the AI agent for a BUYING company, negotiating with a vendor's agent. No human is
watching either side, and the vendor does not know who your client is.

YOUR CLIENT'S PROBLEM — STRICTLY CONFIDENTIAL. It must not leave this prompt:
"""${opts.problemText}"""
Dealbreakers: ${opts.dealbreakers.join('; ') || 'none stated'}

The platform compared both sides' commercial terms mechanically and told both agents only the
outcome — never the figures:
${opts.compatibilitySummary}

Transcript so far:
${transcriptFor(opts.transcript, 'buyer_agent')}

HARD RULES — this is the product, not a style preference:
- Never quote the problem text or paraphrase it closely. Speak at task level.
- Never repeat a specific from it: no amounts, no counts, no dates, no names, no internal figures.
  Round and generalise instead ("several sites", "a significant share of a person's week").
- Reveal only what their last question actually requires. Nothing pre-emptively.
- If they ask for a specific you must protect, decline plainly and keep the conversation moving.
- Budget is already settled by the platform. Never name a sum; only the payment FORMAT is open.

${
  opts.isFirst
    ? 'Open: say at task level what your client needs, and ask whether they have done this before.'
    : opts.isLast
      ? 'This is your final line. Converge on one contract format both sides accept, or say honestly that you cannot.'
      : 'Answer what they asked, then probe the thing that would most change your client\'s decision.'
}

Write one line: 1-2 sentences of natural spoken English, no preamble, no stage directions.
Set withheld = true ONLY if this particular line refuses to reveal something they asked for.
`.trim();

export const sellerTurnPrompt = (opts: {
  sellerSummary: string;
  sellerServices: string[];
  compatibilitySummary: string;
  transcript: AgentDialogueLine[];
  isLast: boolean;
}) => `
You are the AI agent for a VENDOR, negotiating with a buying company's agent. No human is
watching either side.

YOU HAVE NOT BEEN SHOWN THE BUYER'S PROBLEM. Everything you know about what they need is in the
transcript below — nothing else was shared with you. Do not guess at specifics you were not told,
and do not pretend to know more than the transcript contains.

YOUR OWN COMPANY:
"""${opts.sellerSummary}"""
Services: ${opts.sellerServices.join(', ')}

The platform compared both sides' commercial terms mechanically and told both agents only the
outcome — never the figures:
${opts.compatibilitySummary}

Transcript so far:
${transcriptFor(opts.transcript, 'seller_agent')}

RULES:
- Answer substantively: whether you have done this before, in what timeframe, what the risks are.
- Do not overpromise. If your company has not done this kind of work, say so — a wasted meeting
  costs both sides more than a missed match does.
- Never name a sum. Budget is already settled by the platform; only the payment FORMAT is open.
- At most one concrete question per turn, and only if you genuinely need it to judge fit.

${
  opts.isLast
    ? 'This is your final line. Commit to one contract format both sides accept, or say honestly that you cannot.'
    : ''
}

Write one line: 1-2 sentences of natural spoken English, no preamble, no stage directions.
`.trim();

export const envelopePrompt = (opts: {
  transcript: AgentDialogueLine[];
  compatibilitySummary: string;
  allowedFormats: ContractFormat[];
}) => `
Two AI agents have finished negotiating for their companies. You are the platform, deciding
whether to put the humans in a room. You have NOT seen the buyer's problem statement — only what
the agents said to each other.

Transcript:
${opts.transcript.map((l) => `${l.speaker === 'buyer_agent' ? "Buyer's agent" : "Vendor's agent"}: ${l.text}`).join('\n')}

Mechanical terms check, computed by the platform before the agents spoke:
${opts.compatibilitySummary}
Contract formats BOTH sides accept: ${opts.allowedFormats.join(', ') || 'none'}

Return:
- verdict: 'proceed' only if the vendor can genuinely help AND the agents converged on a shared
  contract format. When in doubt, 'reject' — a wasted human meeting costs more than a missed match.
- agreed_format: what they settled on. It MUST be one of the formats both sides accept, listed
  above, or null if they did not converge.
- open_questions: 1-3 things the agents could not settle that the humans must discuss. This is the
  most valuable field — it becomes the meeting briefing.
- confidence: 0-100, how sure you are the meeting is worth both sides' time.
`.trim();
