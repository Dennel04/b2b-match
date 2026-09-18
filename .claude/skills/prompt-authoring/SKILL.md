---
name: prompt-authoring
description: Conventions for writing or editing the Claude prompts in src/prompts/ — privacy rules the buyer agent must obey, schema shape, and how the two-stage matching pipeline feeds them. Use when adding or changing any file under src/prompts/, or when a model response comes back in the wrong shape.
---

# Prompt authoring

One file per task in `src/prompts/`. Each exports a zod schema and a prompt builder function.
Never inline a prompt in an action.

## Shape

```ts
export const ThingSchema = z.object({ ... });
export const thingPrompt = (args) => `...`.trim();
```

Call it through `ask(ThingSchema, thingPrompt(args), { effort })` from `src/lib/claude.ts`.
`ask` sends the schema to the model as JSON Schema, validates the reply with zod and retries
once with the validation error; a second failure throws. Callers get a typed value or an
exception — do not add defensive parsing around it. (The provider is a deployment setting:
`ANTHROPIC_BASE_URL` in `.env.local` points the same client at DeepSeek's Anthropic-compatible
endpoint, so prompts must not rely on Anthropic-only features such as structured outputs.)

Effort guide: `low` for the interview (one short turn), `high` for matching and for the
negotiation envelope (real judgment), `medium` for each negotiation turn (eight of them per
match, so latency adds up), default `medium` elsewhere.

## Privacy rules these prompts enforce

The product's only defensible claim is that a problem's text never reaches the other side.
That is enforced in prompt text, so treat these as code:

- `match.ts` — `reasoning_public` is read by the seller. Forbid verbatim quotes, amounts,
  names, internal details. Category level only: "this company needs help with X in Y".
- `negotiate.ts` — three prompts, and the separation between them is the privacy claim:
  - `buyerTurnPrompt` is the only one that takes `problemText`. The buyer agent must never
    quote it, name a figure, or reveal a client; it discloses exactly enough for the next
    question and sets `withheld: true` on a turn where it refused something.
  - `sellerTurnPrompt` takes the seller's own profile and the transcript. **It has no
    problem-text argument. Adding one, or passing a summary of the problem, is a privacy
    regression, not a prompt improvement** — the seller's agent knows only what the buyer's
    agent said out loud.
  - `envelopePrompt` reads the finished transcript and the compatibility result. It never sees
    the problem either.
  Neither agent names money: the platform already compared the numbers, only the payment
  format is negotiable.
- `interview.ts` — when asking for the budget ceiling, tell the user why: the number is
  never shown to any vendor, it only filters who they see.

## What the negotiation must return

`negotiate()` in `src/actions/match.ts` runs four rounds of buyer turn → seller turn, then
one envelope call. The envelope is the product, the transcript is the demo.

- Turn prompts return one line each (`BuyerTurnSchema` adds `withheld`). Keep them to 1-2
  sentences: the transcript is read aloud on stage.
- `envelopePrompt` returns only what the model must judge: `verdict`, `agreed_format`,
  `open_questions`, `confidence`. `budget_compatible` and `earliest_start` come from
  `checkCompatibility()` and the seller's terms — do not add them back to the schema.
- `open_questions` is the highest-value field — it is what the briefing is built from, so ask
  for 1-3 concrete questions humans must settle.
- Bias `verdict` toward `reject`: a wasted human meeting costs more than a missed match.

After the turns, `findLeaks()` (`src/lib/leak.ts`) rejects a transcript that repeats a
six-word phrase or a specific number from the problem. If a prompt change makes negotiations
start failing that guard, fix the prompt — never loosen the guard to make the demo pass.

## Dates

Any prompt that produces a date takes today's date as an argument and must return absolute
ISO dates. Models are unreliable at relative dates.
