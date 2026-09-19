---
name: b2b-match-ui
description: The settled UI for Crossdesk — layout, tokens, group vocabulary, privacy rules and copy. Use whenever building or changing any screen, component or copy in src/app or src/components. The visual direction is decided; this skill is the direction, not a starting point for finding one.
---

# Crossdesk — UI

The direction is settled and already built. Compose screens from `@/components/ui` and wrap them
in `<AppShell>` from `@/components/layout` — `src/app/problems/ProblemScreen.tsx` is the worked
example. The original is `drafts/design/problem-page.html` (serve it over http, not `file://`).

Do not invent a second visual language, do not go looking for a direction, and do not write a
raw hex in a component: every value is a token in `src/styles/tokens.css`. Where code goes is
`ARCHITECTURE.md`. The whole system on one page — brand, colour, type, the two densities,
motion — is `docs/DESIGN_SYSTEM.md`; read it before adding motion or touching the logo.

Read `PLAN.md` (sections 1, 3) and `CLAUDE.md` first. This skill adds only what is specific to
the interface.

## The idea the interface carries

A confidential document that two parties read differently. The buyer writes a real problem; the
other company never reads it. Two agents negotiate; people meet only after both consent.

Tone: calm, precise, confidential. Closer to a notary than to a growth SaaS. No hype, no
playfulness, no celebration of matches.

## Two sides, one shape

The sidebar is the product in five words: **Company · Problems · Services · Matches ·
Directory**. Problems is the buying side, Services the selling side, and they are built as
mirrors — list, detail, and an interview that fills a form beside a chat:

| Buying | Selling |
|---|---|
| `/problems` — problems, cut by deadline or part of the business | `/services` — services, cut by availability or part of the business |
| `/problems/[id]` — who can solve this | `/services/[id]` — who arrived through this |
| `/problems/new` — "Describe your problem" | `/services/new` — "Describe what you ship" |

Two screens sit across both sides: `/matches`, every counterparty on one screen with the rows
waiting on this viewer first, and `/dashboard` — the funnel, opened from the brand in the
sidebar, counts only and never a list.

Before adding a screen to one side, ask what its mirror is. They share their parts —
`Group` / `PartyRow` / `RowButton` (`@/components/counterparties`) and the chat box
(`@/components/Composer`) — and a second vocabulary for the same idea is a bug, not a variation.
Where the sides genuinely differ, say why in a comment: a problem is private in full, a service
is a storefront with one private column (its price floor).

## Layout

Two columns. A 224px sidebar, `position: fixed` and scrolling on its own, everything else in a
flex column on the right.

- **Sidebar** — white, `border-right` 1px. A 64px header holding the product name, aligned to
  the top bar's height so the two bottom borders form one line; it is a link to `/dashboard`.
  Then nav items: icon, label, optional count chip. Active item gets a `surface-alt` fill and weight 600. Utility items sit at the
  bottom behind a `border-top`, pushed down with `margin-top:auto`.
- **Top bar** — optional. A screen whose title already carries its own controls has none: the
  breadcrumb (`Problems › case reference`) sits above the title, and the status chip plus the
  controls that act on it (Edit, Stop) sit on the title's own row, pushed right, as quiet
  borderless buttons that only fill on hover. The problem screen is the reference for this.
  When a screen does keep a top bar it is 64px, white, `border-bottom` — left: back chevron,
  case reference, status chip, the control acting on that status; right, pushed with
  `margin-left:auto`: page-level controls, then the privacy marker, then the avatar. On phones
  a bare screen still shows a slim row with the product name, avatar and log-out, because the
  sidebar is hidden there.
- **Theme** — light only. No dark theme, no theme switch.
- **Button arrow** — a button with a trailing arrow uses `PillButton` from
  `src/components/premium.tsx`. The arrow points right at rest; on hover it turns 45°
  counter-clockwise, smoothly (500 ms, the shared ease). The circle around it never scales or
  moves. Do not hand-roll another arrow button.
- **Content** — `max-w-[1200px]`, centred, `px-4 md:px-9` (16px on a phone, 36px from `md`).
  Top padding is `pt-6 md:pt-8` — the page starts high, and the rhythm comes from the gaps
  between sections, not from empty space at the top. The sidebar already gives the outer gutter;
  do not add another 48px.
- **Footer** — one row, `margin-top:auto`, 12px muted text. A working screen, not a landing page:
  no link columns, no paragraph.

## Tokens

Defined in `src/app/globals.css`. Never write raw hex in a component.

| Role | Light | Use |
|---|---|---|
| `--bg` | `#F4F6F8` | page ground, cool, never cream |
| `--surface` | `#FFFFFF` | cards, bars, sidebar |
| `--surface-alt` | `#ECF1F5` | active nav, quiet panels |
| `--ink` | `#172F45` | text; the logo's slate blue taken dark, never a tinted black |
| `--ink-soft` | `#5B6C7A` | secondary text |
| `--ink-faint` | `#8B97A1` | metadata, timestamps |
| `--brand` | `#2D5778` | the logo's colour; primary buttons only (`bg-brand`, hover `bg-brand-strong`) |
| `--border` | `#E4E9ED` | rules and card borders |
| `--accent` | `#2F6D52` | **state only**, never decoration — see below |
| `--gold` / `--gold-soft` | `#8F6A35` / `#F3ECDC` | **withheld or negotiable, nothing else** |

Type: Plus Jakarta Sans, one family for the whole product, applied at the root.

Two densities, by zone:
- **Signed-out and onboarding** — `@/components/premium`: soft bezels, pill buttons, more air.
- **Working screens** — `@/components/ui`: hairline cards at 10px, rectangular buttons at 8px,
  chips at 7px, tight rows.

Pick the one that matches the screen's zone and do not mix them inside a screen. Icons: one set,
no emoji.

## Accent is a state, not a decoration

Green appears only where it reports something true about the thing it sits on: a status chip,
a step that is complete, a row that is ready to meet, a focused input. Gold means the same for
withheld or unfinished.

It never appears on a count, an avatar, a button hover, or anything whose only job is to be
noticed. If a screen has no states, it has no green — the login screen is monochrome for
exactly that reason. When in doubt, use `--ink`: a thing that is merely important is dark,
not coloured.

## The three groups

Every list of counterparties uses these three names and nothing else — on a problem screen, on
a service screen, and on `/matches`. Header is the label, a count chip, and a short
right-aligned fact.

| Group | Fact | Row action |
|---|---|---|
| **Matched** | Every term cleared | `Open` |
| **Awaiting** | One term apart, and willing to move | `Ask` |
| **Declined** | Nothing was sent to them | `Review` (collapsed to one row, never a list) |

Declined never names a company. It is one line — "Could help if you moved a term" — and a button.
Showing rejections is deliberate: a product that only shows successes reads as a salesman. Its
right-aligned fact may count the *areas* they fell away on ("4 on price, 2 on the deadline"),
never who they were.

Awaiting rows carry a chip naming the *area* of the concession (`Start date`, `Contract format`,
`Price`) in the gold tone, never the vendor's figures.

## Privacy rules (hard, they mirror CLAUDE.md)

1. Anything from `problems` renders only for the owning company. Seller-facing text comes from
   server fields (`reasoning_public`, brief) verbatim — never concatenate or echo problem text.
   A `service` is the opposite: its title and description are the storefront and are meant to be
   read. Its `terms` are not — a price floor is the seller's ceiling-equivalent and is shown only
   to its owner, under the line "Your figures. A buyer is told that they fit, never what they are."
2. Never render a figure that came from the other side. The interface states that terms are
   compatible, never what they are. This includes tooltips, summaries and charts.
3. Counterparties are anonymous until both sides consent: industry, size, city, score — never
   name, logo, website or contact. Names appear only at `accepted`.
4. Reveal follows status exactly: `proposed` → anonymous; `buyer_interested` → seller sees the
   buyer's company profile, never the problem; `accepted` → identities and brief; `declined` →
   collapses to a neutral state with no details.
5. The word for what the other side cannot see is **withheld** — not "hidden", not "encrypted".
   The platform can read it; the copy must not imply otherwise.

## Status vocabulary

One name per state, in buttons, chips and toasts alike.

| Status | Shown | Buyer action | Seller action |
|---|---|---|---|
| `proposed` | New match | Interested / Not now | — |
| `buyer_interested` | Interest sent | — | Accept / Decline |
| `accepted` | Meeting confirmed | View brief | View brief |
| `declined` | Declined | — | — |

## Copy

Every line has to earn its place. Before writing one, ask what already says it — the label, the
chip, or the button. If something else says it, cut the line.

- A button names what happens: `Accept meeting`, not `Submit`. `Review`, not `View`, when the
  thing being reviewed is the user's own terms.
- Status reads from the user's side: `Ready to meet`, not `A meeting is recommended`.
- A row's title says what a company does; its subtitle says where. Never both in both.
- Never call the buyer's text "data" or "an entry". It is a problem someone wrote down. The same
  for a service: it is something a company sells, not a "listing" or a "record".
- One invitation per screen. If an empty state carries the button, the header does not.
- An empty state is one line under its heading, not a paragraph. "Nothing listed yet. Each
  service is matched on its own terms." — a sentence that says what to do, then stops.
- Empty states are invitations: say what would change the situation.
- Sentence case, active voice, English.
- Real content in mocks — real Estonian companies, believable problems. Never lorem ipsum.

## Long lists in the interview

A closed question inside a chat bubble shows what the interviewer suggested, not the whole
taxonomy — `PillsNarrowed` (`@/components/cloud`) takes the full `options` plus a `suggested`
subset, draws those, and hides the rest behind one quiet link that counts what is left.

Seventeen chips is half a screen of noise and it makes the chat unreadable by the third
question. Three is a question. The suggestions come from the model that has just read the
answer, so the extra click stays rare — and it is always there, because narrowing is a shortcut
and never a cage. Use the plain `Pills` only where the list is genuinely short (four timings,
five contract formats seen on the form itself).

## AI-loading states

The demo lives here. Never a bare spinner: named steps or skeletons in the final layout so
nothing jumps. Every AI call has an error state with a retry and a plain explanation. Cached
results must be servable on stage (PLAN.md §7).

## Working rules

- Types come from `src/types.ts` — import, never edit.
- Stay inside `src/app/**` and `src/components/**`.
- Tailwind only, tokens only, no new UI libraries.
- Quality floor, unannounced: works at phone width, visible keyboard focus, reduced motion
  respected, contrast holds, every field labelled.
- Priority is the demo path (PLAN.md §3). Nothing outside it gets design time until it works
  end to end.
