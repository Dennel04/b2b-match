# CLAUDE.md

24-hour hackathon MVP. B2B matching platform: companies describe their services publicly and
their problems privately. AI matches problem to solution, two AI agents negotiate behind a
wall, and only after both sides consent do humans meet with a generated briefing.

Where code goes and why: `ARCHITECTURE.md` — read it before adding a file.
Full scope: `PLAN.md`. Market research and pitch answers: `docs/RESEARCH.md`. Who owns which
files: `TEAM.md`.

## Verify your work

```bash
npm run check   # next typegen + tsc --noEmit + overlap and leak self-checks
```

Run it after any change to `src/lib/overlap.ts`, `src/lib/leak.ts`, `src/prompts/negotiate.ts`,
`src/types.ts`, or `src/actions/`. It works on a fresh clone — `next typegen` generates the
route types `tsc` needs. A new `*.check.ts` is wired into the `check` script in the same commit,
or it never runs.

The two interview prompts have a bench each, run by hand against the real model — they cost
money, so they are not in `check`:

```bash
npx tsx --env-file=.env.local scripts/bench.ts          # the buying side
npx tsx --env-file=.env.local scripts/bench-service.ts  # the selling side
npx tsx --env-file=.env.local scripts/interviews.ts     # what real interviews actually asked
```

`interviews.ts` reads `problems.interview_json` back — every question in the order it was asked,
scripted ones included. A bench says what the prompt does on input you wrote; this says what it
did to someone. Output is private problems: never paste it anywhere public.

## Invariants

IMPORTANT: the `problems` table is private. Its text must never reach another company's
client, and never appear verbatim in `reasoning_public`, in an agent's dialogue line, or in
any prompt sent on behalf of the other side.

- The seller's agent is a separate model call that never receives the problem text.
  `sellerTurnPrompt()` and `envelopePrompt()` in `src/prompts/negotiate.ts` have no
  problem-text argument; do not add one, and do not pass a summary of it either.
- Every transcript goes through `findLeaks()` in `src/lib/leak.ts` before it is stored. A
  transcript that fails is discarded. If negotiations start failing the guard, fix the prompt;
  never loosen the guard.
- Budget figures are compared only inside `checkCompatibility()`. One side's number must
  never enter the other side's prompt or response. Expose compatibility, not amounts.
- A seller's terms live on the **service**, not on the company (migration 0007). A company
  selling a call centre at €2,400/month and a fibre install at €18,000/project has two
  envelopes, and a match records which service a buyer arrived through (`matches.service_id`).
  `companies.seller_terms` remains only as the fallback for a company that has listed nothing.
- `services` is the storefront: any signed-in user may read a row, because that is what a
  buyer's problem is scored against. Its `terms` column rides along and is the seller's floor —
  a component must never project another company's `terms`. `getMatchView()` is the only path
  that reports on the other side's terms, and it reports compatibility, never figures.
- Match status changes only through `setMatchStatus()`, which enforces the double opt-in
  order (buyer `interested` → seller `accept`). Clients cannot write `matches` (migration
  0002). A match screen reads through `getMatchView()`, which decides per viewer what is
  shown — never query `matches` from a component and project the fields yourself.
- `adminClient()` and `SUPABASE_SERVICE_ROLE_KEY` are allowed only in `src/actions/` and
  `scripts/`. Never in a component.
- Every model call is labelled — `ask(schema, prompt, { label: 'interview' })` — and prints one
  line to the server log: how many calls it really took, how long, and the tokens. `calls` above
  1 is the number to chase: a reply that overflows `maxTokens` is not trimmed, it is regenerated
  from scratch at double the budget, so a tight limit costs whole multiples of the latency. Read
  the log before believing anything about why something is slow.
- Parse model output only through `ask()` in `src/lib/claude.ts` — it validates against the
  zod schema and retries once. No hand-rolled `JSON.parse` on a model response anywhere else.
- A Server Action **returns** `ActionResult<T>` for anything the user is meant to read, and
  throws only on a bug. Next.js strips thrown messages in production, so a thrown explanation
  reaches the browser as "Minified React error #441" and the screen shows that instead.
- The model provider is configured in `.env.local`, not in code: `ANTHROPIC_BASE_URL` routes the
  Anthropic SDK to DeepSeek's Anthropic-compatible endpoint (see `.env.example`). Use only
  features both providers support — no structured outputs, no prefill, no beta headers.
- Do not change `src/types.ts` or `supabase/migrations/` without saying so in the team chat
  first. Every teammate builds against them. Migrations are forward-only: a new `000N_*.sql`,
  never an edit to one that has been applied.
- Never commit secrets. They live in `.env.local`.

## Working style

- Speed over polish: no abstractions, no new dependencies unless something is impossible
  without them.
- Stay inside your own files as listed in `TEAM.md`, so parallel sessions don't collide.
- All user-facing copy, prompts and model output are in **English** — the judges are
  English-speaking.

## Design references (not product code)

- `drafts/design/problem-page.html` — **the reference screen.** The visual direction is settled;
  build every screen from it. Open it over http, not `file://`.
- `.claude/skills/b2b-match-ui` — that direction written down: layout, tokens, group vocabulary,
  privacy and copy rules. Read it before touching any screen.

## The two sides mirror each other

`problems/` is the buying side, `services/` the selling side, and they are built as reflections:
list, detail, and an interview that fills a form beside a chat. They share `Group`/`PartyRow`
(`src/components/counterparties.tsx`) and the chat box (`src/components/Composer.tsx`).

Where they differ, they differ on purpose, and the reason is written down:

- The interviews are separate prompts (`interview.ts`, `service.ts`), not one prompt with a
  flag. One digs for a pain the person is reluctant to state; the other tidies a product the
  person knows by heart.
- A problem is private in full. A service is a storefront with one private column.

Adding a screen to one side without asking what its mirror is, is how the two vocabularies
drift apart.

## Priority

Ship the end-to-end demo path in `PLAN.md` §3 first. The agent negotiation is part of that
path, not a bonus: without it the product is indistinguishable from ordinary matching
(see `docs/RESEARCH.md` §6).
