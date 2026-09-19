/**
 * The currency, in one place: what an introduction costs and what a top-up buys.
 *
 * A seller sees that a buyer arrived for free — the row, the reason, the score. The name behind
 * it costs coins. That is the introduction fee of docs/RESEARCH.md §4.4 prepaid, so the moment a
 * vendor decides whether to meet someone is one click and not a card form.
 */

/** What one counterparty costs to open. */
export const UNLOCK_COST = 10;

/** Top-ups, cheapest per coin the more you take. Stripe test mode; euros, in cents. */
export const PACKS = [
  { credits: 10, cents: 1900 },
  { credits: 50, cents: 7900 },
  { credits: 100, cents: 13900 },
] as const;

export const packFor = (credits: number) => PACKS.find((p) => p.credits === credits);

/** €19.00, €79.00 — never "19.0". */
export const euros = (cents: number) => `€${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
