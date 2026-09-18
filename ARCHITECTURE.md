# Architecture

One policy for the whole team. If a change does not fit it, change this file first and tell
everyone — do not quietly invent a second way of doing things.

Stack, September 2026: Next.js 16 App Router, React 19.3, TypeScript 5.9, Tailwind 4.3,
Supabase (Postgres + auth + RLS), Claude API. Deployed on Vercel.

## Where code goes

```
src/
  app/                    routes only — a folder is a URL segment
    layout.tsx            root shell: fonts, theme, <body>
    globals.css           Tailwind import, token bridge, quality floor
    fonts.ts              the one typeface
    login/ signup/        signed-out screens — no app chrome
    dashboard/ problems/   signed-in screens — wrapped in <AppShell>
    onboarding/           company setup
    auth/                 route handlers (OAuth callback, sign-out)
  components/
    ui/                   design system primitives — Card, Button, Chip, Field, Icon
    layout/               AppShell: sidebar, top bar, footer
    <Feature>.tsx         shared across routes but not a primitive
  actions/                Server Actions — the only place the database is written
  lib/                    clients and pure logic: claude, supabase, overlap, leak
  prompts/                one file per model task, schema + builder
  styles/tokens.css       every colour, radius and shape value in the product
  types.ts                the contract between frontend and backend
supabase/migrations/      forward-only SQL
drafts/design/            the reference screen, not code to import
```

**Chrome.** Signed-in screens wrap their content in `<AppShell>`; signed-out screens do not.
When that becomes repetitive, move the signed-in routes into a `(app)` route group — a folder in
parentheses does not appear in the URL and exists only so a set of routes can share a layout.
Do it as one commit when nobody else is editing those files, not gradually.

**Colocation.** Anything used by exactly one route lives next to that route
(`app/(app)/onboarding/Wizard.tsx`), not in `components/`. A component moves into `components/`
the day a second route imports it — not before, in anticipation.

**`app/` holds routes, not logic.** A `page.tsx` composes components and calls actions. If it
grows a data transform, a fetch helper or a constant table, that belongs in `lib/` or a
colocated file.

## Server and client

Every component is a Server Component unless it says `"use client"`. Add that directive only
for state, effects or event handlers, and add it as far down the tree as possible — a client
boundary high up drags everything below it into the browser bundle.

Mutations go through Server Actions in `src/actions/`. Never write to Supabase from a component.
`adminClient()` and the service-role key exist only in `src/actions/` and `scripts/`.

## The design system

Three layers, and they do not mix:

1. **Tokens — `src/styles/tokens.css`.** Every colour, radius and shape value. Light and dark.
   Adding a value to the product means adding it here first.
2. **Bridge — `globals.css`.** `@theme inline` exposes the tokens to Tailwind as `bg-surface`,
   `text-ink-soft`, `border-line`. Also the quality floor: focus rings, reduced motion.
3. **Components — `src/components/ui/`.** Import from `@/components/ui`, never from a file
   inside it.

**No raw hex in a component, ever.** If the value you need is not a token, the fix is a new
token, not a one-off colour. The reference for every value is
`drafts/design/problem-page.html`; the rules it encodes are in `.claude/skills/b2b-match-ui`.

One typeface: **Plus Jakarta Sans**, declared in `app/fonts.ts` and applied once on `<html>`.
Adding a second is a decision for the whole team, not a detail of one screen.

**Shape may differ by zone, and that is intentional.** Signed-out and onboarding screens are
richer — soft bezels, pill buttons, more air. Working screens are denser and flatter — hairline
cards, rectangular buttons, tighter rows. One palette, one typeface, two densities, chosen on
purpose. What is not allowed is a third density, or a screen that picks its own colours.

## Types

`src/types.ts` is the single source of truth and the contract between frontend and backend.
Import from it; never redefine a shape locally, never edit it without telling the team first.
The frontend builds against typed fake data of those shapes and swaps in the actions later
without touching markup.

## Verification

```bash
npm run check    # next typegen + tsc --noEmit + overlap and leak self-checks
npm run build    # the real gate before a push that touches routes
```

`npm run check` runs on a fresh clone. Run it before every push. Non-trivial logic leaves one
runnable check behind — see `src/lib/overlap.check.ts` for the shape.

## Dependencies

Adding one is a team decision. Before you add, check the standard library, then a native
platform feature, then something already installed. A few lines beat a new package.

Current pins and why they are where they are:

| Package | Pinned | Why not newer |
|---|---|---|
| `typescript` | 5.9 | 7.x is the native rewrite — a major, not worth the risk mid-build |
| `eslint` | 9.x | 10.x is a major; `eslint-config-next` is not verified against it yet |

Everything else tracks latest. `cheerio` was removed when scraping was cut — when a feature
dies, its dependency dies with it in the same commit.

## Git

`main` always builds and is always deployed. Small merges, often. Migrations are forward-only:
a new `000N_*.sql`, never an edit to one that has been applied. File ownership is in `TEAM.md`;
the sync hook pulls teammates' work before every prompt.
