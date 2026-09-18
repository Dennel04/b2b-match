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
`ask` uses structured outputs, so the model physically cannot return a different shape —
do not add defensive parsing around it.

Effort guide: `low` for the interview (one short turn), `high` for matching and negotiation
(real judgment), default `medium` elsewhere.

## Privacy rules these prompts enforce

The product's only defensible claim is that a problem's text never reaches the other side.
That is enforced in prompt text, so treat these as code:

- `match.ts` — `reasoning_public` is read by the seller. Forbid verbatim quotes, amounts,
  names, internal details. Category level only: "this company needs help with X in Y".
- `negotiate.ts` — the buyer agent must never quote the problem, name a figure, or reveal a
  client. It discloses exactly enough for the next question. Neither agent names money:
  the platform already compared the numbers, only the payment format is negotiable.
- `interview.ts` — when asking for the budget ceiling, tell the user why: the number is
  never shown to any vendor, it only filters who they see.

## What the negotiation must return

`negotiatePrompt` produces both a transcript and a `DealEnvelope`. The envelope is the
product, the transcript is the demo. `open_questions` is the highest-value field — it is
what the briefing is built from, so ask for 1-3 concrete questions humans must settle.

Bias `verdict` toward `reject`: a wasted human meeting costs more than a missed match.

## Dates

Any prompt that produces a date takes today's date as an argument and must return absolute
ISO dates. Models are unreliable at relative dates.
