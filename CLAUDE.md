# CLAUDE.md

24-hour hackathon MVP. B2B matching platform: companies describe their services publicly and
their problems privately. AI matches problem to solution, two AI agents negotiate behind a
wall, and only after both sides consent do humans meet with a generated briefing.

Full scope: `PLAN.md`. Market research and pitch answers: `docs/RESEARCH.md`. Who owns which
files: `TEAM.md`.

## Verify your work

```bash
npm run check   # tsc --noEmit + overlap self-checks
```

Run it after any change to `src/lib/overlap.ts`, `src/types.ts`, or `src/actions/`.

## Invariants

IMPORTANT: the `problems` table is private. Its text must never reach another company's
client, and never appear verbatim in `reasoning_public`, in an agent's dialogue line, or in
any prompt sent on behalf of the other side.

- Budget figures are compared only inside `checkCompatibility()`. One side's number must
  never enter the other side's prompt or response. Expose compatibility, not amounts.
- `adminClient()` and `SUPABASE_SERVICE_ROLE_KEY` are allowed only in `src/actions/` and
  `scripts/`. Never in a component.
- Parse model output only through `ask()` in `src/lib/claude.ts` — it enforces a zod schema.
  No hand-rolled `JSON.parse` on a model response.
- Do not change `src/types.ts` or `supabase/migrations/` without saying so in the team chat
  first. Every teammate builds against them.
- Never commit secrets. They live in `.env.local`.

## Working style

- Speed over polish: no abstractions, no new dependencies unless something is impossible
  without them.
- Stay inside your own files as listed in `TEAM.md`, so parallel sessions don't collide.
- All user-facing copy, prompts and model output are in **English** — the judges are
  English-speaking.

## Design references (not product code)

- `src/app/lab/` — seven versions of the dashboard, one per design skill, on fake data.
  `/lab/f` is the chosen direction so far. Never import from it; read `src/app/lab/README.md`.
- `drafts/design/` — Claude Design output: page layouts to rebuild in `src/`.
- `.claude/skills/` — design skills for this repo; `b2b-match-ui` holds the product UI rules.

## Priority

Ship the end-to-end demo path in `PLAN.md` §3 first. The agent negotiation is part of that
path, not a bonus: without it the product is indistinguishable from ordinary matching
(see `docs/RESEARCH.md` §6).
