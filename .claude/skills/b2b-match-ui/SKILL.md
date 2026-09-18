---
name: b2b-match-ui
description: The settled UI for B2B Match — layout, tokens, group vocabulary, privacy rules and copy. Use whenever building or changing any screen, component or copy in src/app or src/components. The visual direction is decided; this skill is the direction, not a starting point for finding one.
---

# B2B Match — UI

The direction is settled and already built. Compose screens from `@/components/ui` and wrap them
in `<AppShell>` from `@/components/layout` — `src/app/problems/ProblemScreen.tsx` is the worked
example. The original is `drafts/design/problem-page.html` (serve it over http, not `file://`).

Do not invent a second visual language, do not go looking for a direction, and do not write a
raw hex in a component: every value is a token in `src/styles/tokens.css`. Where code goes is
`ARCHITECTURE.md`.

Read `PLAN.md` (sections 1, 3) and `CLAUDE.md` first. This skill adds only what is specific to
the interface.

## The idea the interface carries

A confidential document that two parties read differently. The buyer writes a real problem; the
other company never reads it. Two agents negotiate; people meet only after both consent.

Tone: calm, precise, confidential. Closer to a notary than to a growth SaaS. No hype, no
playfulness, no celebration of matches.

## Layout

Two columns. A fixed 216px sidebar on the left, everything else in a flex column on the right.

- **Sidebar** — white, `border-right` 1px. A 60px header holding only the product name, aligned
  to the top bar's height so the two bottom borders form one line. Then nav items: icon, label,
  optional count chip. Active item gets a `#EDF1F3` fill and weight 600. Utility items sit at the
  bottom behind a `border-top`, pushed down with `margin-top:auto`.
- **Top bar** — 60px, white, `border-bottom`. Left: back chevron, case reference, status chip,
  and the control that acts on that status. Right, pushed with `margin-left:auto`: page-level
  controls, then the privacy marker, then the avatar.
- **Content** — `max-width:1240px`, `padding:0 32px`, centred. The sidebar already gives the
  outer gutter; do not add 48px again.
- **Footer** — one row, `margin-top:auto`, 12px muted text. A working screen, not a landing page:
  no link columns, no paragraph.

## Tokens

Defined in `src/app/globals.css`. Never write raw hex in a component.

| Role | Light | Use |
|---|---|---|
| `--bg` | `#F4F6F8` | page ground, cool, never cream |
| `--surface` | `#FFFFFF` | cards, bars, sidebar |
| `--surface-alt` | `#EDF1F3` | active nav, quiet panels |
| `--ink` | `#16323A` | text; a real slate-teal, never a tinted black |
| `--ink-soft` | `#5C6E75` | secondary text |
| `--ink-faint` | `#8E9897` | metadata, timestamps |
| `--border` | `#E4E9ED` | rules and card borders |
| `--accent` | `#2F6D52` | compatibility and positive state only |
| `--gold` / `--gold-soft` | `#8F6A35` / `#F3ECDC` | **withheld or negotiable, nothing else** |

Type: Instrument Sans, one family. Radii: 10px cards, 8px buttons, 7px chips. Icons: lucide, one
set, no emoji.

## The three groups

Every list of counterparties uses these three names and nothing else. Header is the label, a
count chip, and a short right-aligned fact.

| Group | Fact | Row action |
|---|---|---|
| **Matched** | Every term cleared | `Open` |
| **Awaiting** | One term apart, and willing to move | `Ask` |
| **Declined** | Nothing was sent to them | `Review` (collapsed to one row, never a list) |

Declined never names a company. It is one line — "Could help if you moved a term" — and a button.
Showing rejections is deliberate: a product that only shows successes reads as a salesman.

Awaiting rows carry a chip naming the *area* of the concession (`Deadline`, `Contract format`,
`Price`) in the gold tone, never the vendor's figures.

## Privacy rules (hard, they mirror CLAUDE.md)

1. Anything from `problems` renders only for the owning company. Seller-facing text comes from
   server fields (`reasoning_public`, brief) verbatim — never concatenate or echo problem text.
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
- Never call the buyer's text "data" or "an entry". It is a problem someone wrote down.
- Empty states are invitations: say what would change the situation.
- Sentence case, active voice, English.
- Real content in mocks — real Estonian companies, believable problems. Never lorem ipsum.

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
