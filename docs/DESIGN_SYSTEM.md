# Crossdesk design system

One page for anyone building or changing a screen. The rules behind it (privacy, copy, the three
groups, status names) are in `.claude/skills/b2b-match-ui/SKILL.md`; the reference screen is
`drafts/design/problem-page.html`. When this page and the code disagree, the code wins — fix
this page.

## The idea

A confidential document that two parties read differently. Calm, precise, discreet — closer to
a notary than to a growth SaaS. No hype, no celebration, no decoration that does not report
something true.

## Brand

- **Mark:** `public/crossdesk-icon.svg` (also the favicon, `src/app/icon.svg`). Shown at 40 px
  in the site header, 32 px in the app sidebar.
- **Wordmark:** "**Cross**desk" — "Cross" in 800, "desk" in 400, one word, no space, Plus
  Jakarta Sans. Component: `src/components/Logo.tsx`.
- The mark's colour (`#2D5778`) is the `--brand` token: primary buttons use it, and the ink
  family is the same slate blue taken dark, so the product reads as one colour with the logo.

## Colour

Every colour is a token in `src/styles/tokens.css`, exposed to Tailwind in `src/app/globals.css`
(`bg-surface`, `text-ink-soft`, `border-line`…). Never write a raw hex in a component.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F4F6F8` | page ground — cool paper, never cream |
| `--surface` | `#FFFFFF` | cards, bars, sidebar |
| `--surface-alt` | `#ECF1F5` | active nav, quiet panels, inputs on signed-out screens |
| `--ink` | `#172F45` | text, avatars, count chips — the logo's slate blue taken dark, never a tinted black |
| `--ink-soft` | `#5B6C7A` | secondary text |
| `--ink-faint` | `#8B97A1` | metadata, placeholders |
| `--ink-selected` | `#4F7391` | a **picked** chip, pill, date, role card or toggle (Tailwind `bg-selected`) — lighter than the brand, so a choice never looks like a button |
| `--brand` / `--brand-strong` | `#2D5778` / `#234862` | **primary actions only**: the one solid button on a screen, and its hover |
| `--border` / `--border-strong` | `#E4E9ED` / `#DDE3E7` | hairlines, input borders |
| `--accent` (+ `-strong`, `-soft`) | `#2F6D52` | **state only**: ready, compatible, done, focus |
| `--seal` (+ `-soft`) | `#8F6A35` / `#F3ECDC` | **withheld or negotiable only** |
| `--danger` | `#9C4230` | errors — text in `danger` on `danger/10`, never gold |

Accent and seal are signals, not decoration. A screen with no states has no green; the login
screen is monochrome on purpose. When in doubt, use ink.

Light theme only. There is no dark theme and no theme switch.

## Type

- **Plus Jakarta Sans** for everything (`src/app/fonts.ts`), weights 400–800.
- Headlines: 800, tight tracking (`-0.04em` to `-0.045em`). Working-screen titles: 600,
  28–34 px. Body: 14–17 px. Metadata: 12–13 px.
- **One exception:** Instrument Serif Italic, only for the rewritten "what's broken." on the
  login screen. It is not a product typeface; do not use it anywhere else.

## Two densities, by zone

Pick the one that matches the screen and never mix them inside a screen.

| Zone | Screens | Components | Feel |
|---|---|---|---|
| Signed-out and first run | login, sign-up, onboarding | `@/components/premium` — `Bezel`, `PillButton`, `Field`, `Chips`, `Segmented`, `Select`, `TagInput` | soft double-bezel cards, pill buttons, more air |
| Working screens | dashboard, problems, company, matches | `@/components/ui` — `Card`, `Row`, `Button`, `Chip`, `Field`, `Chips`, `TagInput`, `Icon` inside `AppShell` | hairline cards at 10 px, 8 px buttons, 7 px chips, tight rows |

Shape: cards 10 px, buttons 8 px, chips 7 px on working screens; pills and 2 rem bezels on the
signed-out zone.

## Buttons

- A button with a trailing arrow is a `PillButton`. The arrow points right at rest and turns 45°
  counter-clockwise on hover (500 ms, `--ease-drawer`); the circle around it never moves.
- A button names what happens: "Accept meeting", not "Submit".
- Three kinds, one look each, on every screen:

| Kind | Classes | Where |
|---|---|---|
| Primary | `bg-brand text-surface hover:bg-brand-strong` | `Button` (solid), `PillButton` (dark), `RowButton primary`, header calls to action |
| Secondary | `border border-line-strong bg-surface text-ink hover:bg-surface-alt` | `Button` ghost, row buttons, "Company details" |
| Quiet | `text-ink-soft hover:bg-surface-alt hover:text-ink`, no border | title-row controls (Edit, Stop) |

- Chips that report a state (status, score, negotiable area) are 7 px; tags a person picked or
  typed are pills.

## Motion

Curves live in `globals.css` and replace Tailwind's built-ins:

| Token | Curve | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | anything entering or leaving (also Tailwind `ease-out`) |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | something moving across the screen |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | pill buttons, the tab indicator, the `soft-in` entrance |

Rules:

- **Should it move at all?** Things seen tens of times a day barely move; keyboard actions never
  do. The delight budget is for rare moments: first visit, a match, a meeting confirmed.
- UI transitions stay under 300 ms. Enter from `opacity: 0` and a few pixels of offset, never
  from `scale(0)`. Animate `transform`, `opacity` and `clip-path` only.
- Appearing in place: Tailwind `starting:` (CSS `@starting-style`), 200 ms, `ease-out`.
- Page sections on signed-out screens enter with `.soft-in`, staggered by `--i`.
- No looping motion, with two deliberate exceptions on the login screen: the headline and the
  agent diagram.
- Every animation has a reduced-motion path: the end state, still.

What exists:

- **Login headline** — "what's broken." types itself in, a black "private" bar sweeps over it,
  an eraser rubs it out from the right, and it types itself again in italics. 14 s loop, CSS
  only (`.rw-*` in `globals.css`, markup in `src/app/login/AuthScreen.tsx`).
- **Login diagram** — two agents walk towards a lock three times, the terms meet and hold, and
  the lock comes back. 8 s loop; under reduced motion only the outcome shows
  (`src/app/login/MatchDiagram.tsx`).
- **Auth form** — the heading and any message settle in when they change.

Tools for motion work, in `.claude/skills/`: `find-animation-opportunities` (where motion
belongs, and where it does not), `animate` (build one), `review-animations` (check it),
`design-motion-principles` (three designers' lenses — Emil Kowalski's restraint for working
screens, Jakub Krehel's polish and Jhey Tompkins' play for rare moments).

## Loading states

Never a bare spinner. An AI call shows named steps in the final layout ("Opening the site →
Reading about and services pages → Drafting your profile"), and every AI call has an error
state with a plain explanation and a way forward.

## Quality floor

Works at phone width, visible keyboard focus (2 px accent outline), every field labelled,
contrast holds, reduced motion respected. Nobody announces these; every screen meets them.
