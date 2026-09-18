# Who does what

One rule: **do not touch another person's Files column.** That keeps merges clean and stops
three Claude sessions from overwriting each other.

| Area | Owner | Files (yours only) |
|---|---|---|
| **Backend / AI** | _name_ | `src/lib/`, `src/prompts/`, `src/actions/`, `supabase/migrations/` |
| **Frontend** | _name_ | `src/app/`, `src/components/` |
| **Product / demo** | _name_ | `scripts/seed.ts`, `docs/`, `PLAN.md`, slides |

## Shared files — only by agreement

- `src/types.ts` — the contract between frontend and backend. Changed it? Say so in the chat, then push immediately.
- `supabase/migrations/` — backend only, and only forward, as a new `000N_*.sql`. Never edit an applied migration.
- `CLAUDE.md` — rules for every Claude session.

## Staying in sync

- You don't need to pull. The hook `.claude/hooks/team-sync.sh` fetches before **every prompt
  you send to Claude** (at most once a minute) and tells the model to re-read any shared file
  that changed. Nothing to configure — the hook is in the repo.
- **Push often: every 5–10 minutes.** The hook only sees what is already in `origin/main`.
  Uncommitted work does not exist as far as your teammates are concerned.
- If the hook reports a failed rebase, resolve it by hand: `git status`, then `git rebase --continue`.
- Broke `main`? Fix it immediately — everyone else is blocked.

## Before every push

```bash
npm run check
```

## Frontend does not wait for backend

The contract in `src/types.ts` and the signatures in `src/actions/` already exist. Build
against fake objects of that shape; when the backend fills in real data, nothing needs
rewriting.
