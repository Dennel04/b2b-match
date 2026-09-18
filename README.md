# B2B Match

A dark pool for business problems. Companies describe their services publicly and their
problems privately. Two AI agents negotiate behind a wall — no human on either side sees the
other's data — and people are introduced only once the machines agree, with a briefing already
written.

Hackathon, 18–19 September 2026.

| Document | What's in it |
|---|---|
| `PLAN.md` | Scope, demo path, architecture, timeline |
| `docs/RESEARCH.md` | Market research, competitors, answers for the judges |
| `TEAM.md` | Who owns which files, how we stay in sync |
| `CLAUDE.md` | Rules every Claude Code session must follow |

## Getting started

```bash
git clone https://github.com/Dennel04/b2b-match.git
cd b2b-match
npm install
cp .env.example .env.local   # fill in the keys, ask the backend owner
npm run dev
```

## Supabase

1. Create a project at supabase.com.
2. SQL Editor → run `supabase/migrations/0001_init.sql`.
3. Copy the keys from Settings → API into `.env.local`.

## Commands

```bash
npm run dev     # development server
npm run check   # typecheck + overlap self-checks — run before every push
npm run seed    # 18 seeded companies with profiles, terms and problems
```

`npm run seed` needs `SEED_OWNER_ID` in `.env.local` — the id of any registered user.

## Working in parallel

Everyone runs their own Claude Code session; the shared context lives in git, not in one
session. A hook pulls teammates' changes before every prompt and tells the model to re-read
any shared file that changed. See `TEAM.md`.
