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
route types `tsc` needs.

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
- Match status changes only through `setMatchStatus()`, which enforces the double opt-in
  order (buyer `interested` → seller `accept`). Clients cannot write `matches` (migration
  0002). A match screen reads through `getMatchView()`, which decides per viewer what is
  shown — never query `matches` from a component and project the fields yourself.
- `adminClient()` and `SUPABASE_SERVICE_ROLE_KEY` are allowed only in `src/actions/` and
  `scripts/`. Never in a component.
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

## Priority

Ship the end-to-end demo path in `PLAN.md` §3 first. The agent negotiation is part of that
path, not a bonus: without it the product is indistinguishable from ordinary matching
(see `docs/RESEARCH.md` §6).
