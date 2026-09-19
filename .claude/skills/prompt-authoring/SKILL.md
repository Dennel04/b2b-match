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
  never shown to any vendor, it only filters who they see. The prompt receives the previous
  turns and, when known, the company profile — keep both in it, or the model restarts the
  interview every call.
- `service.ts` — the selling mirror, and a **separate prompt on purpose**: `interview.ts` digs
  for a pain the person is reluctant to state, this one tidies a product they know by heart.
  Do not merge them behind a flag. Same rule about the floor as the ceiling: say why you are
  asking — no buyer ever sees the figure, it only keeps them out of conversations that were
  never going to pay. Two things the prompt exists to enforce, and both are benched: `area` is
  the part of the **buyer's** business the service fixes (a call centre is Customer support,
  never the seller's own Sales), and the summary keeps the facts while losing the sales
  language. Never let it add a capability, client or certification the person did not state —
  an invented detail becomes a wasted human meeting.
- `profile.ts` — drafts a profile from the company's website. Nothing without evidence in the
  page text, and **never a money figure**: `budget_floor` stays null and is asked later, on the
  first match that needs it.

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

Every buyer line is checked with `findLeaks()` (`src/lib/leak.ts`) as it is produced — an
eight-word phrase or a specific number from the problem gets the line regenerated once with
the offending fragment quoted back — and the finished transcript is checked again and
discarded if anything slipped through. If a prompt change makes negotiations start failing
that guard, fix the prompt — never loosen the guard to make the demo pass.

## Schema shape

Two rules, measured rather than assumed, and `ServiceInterviewSchema` is the worked example:

- **Known fields first, decision fields last.** Field order is causally upstream of quality: a
  `done` or `follow_up` placed before the fields it judges makes the model commit before it has
  written the evidence down. Record what was learned, then decide.
- **Flat beats nested.** Extraction accuracy falls off steeply with nesting depth.
  `ServiceInterviewSchema` keeps `floor_amount` / `floor_period` / `available_from` at the top
  level rather than under a `terms` object, and loses nothing by it.

`InterviewSchema` predates both and still nests under `terms`; leave it unless you are changing
it for another reason, and bench it if you do.

## A closed question is the model's job too

The interviews answer their closed questions with chips and no model call — cheap, and it cannot
come back malformed. The trap is that a chip list with no thinking behind it shows **everything**:
seventeen departments in a chat bubble, and a company hiring a few Minecraft builders for €500
being asked about ISO 27001 and EU data residency. That reads as a product that was not
listening, and it is the interview's worst moment.

So the model that just read the answer also says what to put in front of this person:

- `department` / `area` come with `*_alternatives` — up to two runners-up from the same list.
  The chat shows those three, with the full list one click behind `PillsNarrowed`.
- `suggested_formats` and `suggested_requirements` / `suggested_capabilities` name the options
  worth offering **this** deal, judged by its size and nature.

Three rules when writing these:
- An option you list is an option the person is nudged to tick. Wrong suggestions are worse than
  none, so say so in the prompt and allow an empty array as a real answer.
- Never drop the escape hatch. `PillsNarrowed` always keeps "show the rest" — narrowing is a
  shortcut, never a cage.
- Bench the judgement, not the shape: a case whose right answer is *few* options is the one that
  catches a prompt suggesting all of them.

## Benching a prompt

A prompt change is not done until it has been run on the input it actually gets — second
language, typos, sales language, vague about scope. One bench per interview:

```bash
npx tsx --env-file=.env.local scripts/bench.ts          # the buying side
npx tsx --env-file=.env.local scripts/bench-service.ts  # the selling side
```

They call the real model and cost money, so they stay out of `npm run check`. A bench prints
the fields that matter and flags the ones that came back outside their allowed list. Write the
cases messy on purpose: a bench on clean input tells you nothing.

## Latency comes from retries, not from the model

Every `ask()` prints one line: `[model] interview  1 call  8.8s  in 1.7k out 1.8k`. Watch
`calls`. Anything above 1 means the work was done more than once, and there are two causes:

- **The reply overflowed `maxTokens`.** `complete()` doubles the budget and regenerates the
  whole thing — a 1500-token cap on the interview turned 4.6-7.4s turns into 29-41s ones,
  because thinking shares the output budget on DeepSeek. Size the cap to the finished reply plus
  headroom; paying for headroom once beats paying for the same answer three times.
- **The reply failed the schema.** The line then ends `after <the zod error>`. That is a prompt
  problem: a field the model keeps getting wrong, usually one whose rule is implied rather than
  stated.

Both are invisible from the outside — one slow turn and two fast ones look the same. Read the
log before changing the prompt to "make it faster".

## Dates

Any prompt that produces a date takes today's date as an argument and must return absolute
ISO dates. Models are unreliable at relative dates.
