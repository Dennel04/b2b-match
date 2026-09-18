---
name: b2b-match-ui
description: Project-specific UI rules for the B2B Match hackathon MVP (private buyer problems, blind matching, double opt-in, meeting brief). Use whenever building or changing any screen, component or copy in src/app or src/components - onboarding, company profile, AI interview, matches, agent dialogue, brief. Use together with frontend-design for visual direction.
---

# B2B Match - UI rules

Read `PLAN.md` (sections 1, 3) and `CLAUDE.md` first. This skill only adds what is specific to this product's interface. For visual direction use `frontend-design`; for a final audit use `web-design-guidelines`; for palette/font lookup use `ui-ux-pro-max`.

## Design brief (starting point for the frontend-design plan step)

- **Subject:** a discreet B2B introduction service. Buyers state real problems privately; sellers only ever see an anonymised match. No cold outreach.
- **Audience:** operations/sales leads at small and mid-size companies. They are busy, sceptical of "another sales tool", and care about who sees their data.
- **Primary job of the UI:** make the buyer feel *in control and safe*, and make the seller understand *why* they were matched. Trust beats flash.
- **Tone:** calm, precise, confidential. Closer to a private bank or a notary than to a growth-hacking SaaS. Not playful, no hype words.
- **Signature element (spend boldness here, keep the rest quiet):** the *reveal*. A match starts as a redacted card (blocked-out company name and problem) and visibly opens up as each side opts in. Privacy is the product, so it must be visible in the design, not only in a footnote.
- Run the frontend-design plan/critique pass and avoid its listed generic defaults. Decide palette and type for this brief; do not copy another project's.

## Privacy rules in the UI (hard rules, they mirror CLAUDE.md)

1. Anything from the `problems` table is shown **only** to the owning company. Never render it in a seller view, a match card, the agent dialogue or the brief beyond what the server returned as `reasoning_public` / brief text.
2. Never build UI that concatenates or "helpfully" echoes problem text into seller-facing copy. Seller-facing text comes from the server fields only.
3. Every place where the buyer types or sees their own problem carries a persistent lock marker and the line "Only the matching system sees this. Sellers never do." Use the same marker and wording everywhere.
4. Before the buyer opts in, seller identity is hidden from the buyer as well (blind match): show industry, size, service category, score and reasoning, not name, website or contacts.
5. Reveal only follows status: `proposed` -> anonymous card; `buyer_interested` -> seller is notified, buyer's company profile (not the problem) becomes visible to the seller; `accepted` -> both identities and the brief; `declined` -> card collapses to a neutral "Declined" state, no details.

## Screens and what each must show

| Screen | Must have |
|---|---|
| Sign-in / role | Role choice (seller / buyer / both), one-line promise of privacy |
| Profile (seller) | URL input, visible progress while scraping ("Reading your site...", "Structuring your services..."), then an **editable** AI draft - the user always confirms before saving |
| AI interview (buyer) | One question at a time, the follow-up appears after each answer, progress indicator (3-4 steps), lock marker always visible, final summary the user can edit |
| Matches | Card per match: score (0-100), 2-sentence public reasoning, status chip, primary action per status. Sorted by score. Empty state that says what to do next |
| Agent dialogue | Read-only transcript of two AI agents, clearly labelled as agents (not people), each side visually distinct, collapsible so the demo can skip it |
| Brief | Rendered markdown: who is who, allowed problem summary, 3 opening questions, meeting slot link. Copy/print friendly |

## Status vocabulary (one name per state, use it everywhere, buttons and toasts included)

| Status | Label shown | Buyer action | Seller action |
|---|---|---|---|
| `proposed` | New match | "I'm interested" / "Not now" | - (not visible yet) |
| `buyer_interested` | Interest sent | - | "Accept" / "Decline" |
| `accepted` | Meeting confirmed | View brief | View brief |
| `declined` | Declined | - | - |

## AI-loading states (the demo lives or dies here)

- Every AI call takes seconds. Never show a bare spinner: show named steps or skeleton cards in the final layout so nothing jumps.
- Matching: "Comparing your problem with N companies..." then cards appear. A "Show cached result" fallback path must exist (PLAN.md section 7: cache AI answers).
- Every AI call has an error state with a retry button and a plain explanation. Server Actions may fail on stage; the UI must not white-screen.
- Optimistic status changes are fine, but roll back visibly on failure.

## Copy

- English UI copy by default (jury at TalTech is likely international). If the team decides on another language, change this line and translate all strings in one pass.
- Sentence case, active voice, buttons say what happens: "Send interest", not "Submit". Same word in button, toast and status.
- Errors say what happened and how to fix it. No apologies, no "Oops".
- Use real-looking content in mocks (seed-like Estonian/Nordic company names, believable problems), never lorem ipsum or "Company A".

## Working rules for the frontend

- Types come from `src/types.ts` (import, never edit). Build screens against typed fake data in `src/lib/mock-data.ts` first, then swap in the Server Actions from `src/actions/` (contract: PLAN.md section 4) without changing markup.
- Stay inside `src/app/**` and `src/components/**`. Do not touch `src/actions`, `src/prompts`, migrations or `src/types.ts` (other people's zones).
- Tailwind only. Design tokens (colors, radii, spacing, fonts) live in one place (`tailwind.config` / CSS variables), never raw hex in components. No new UI libraries unless the whole team agrees; if shadcn/ui is adopted, agree on it once and use it everywhere.
- Quality floor (do not announce, just do): mobile-first, visible keyboard focus, `prefers-reduced-motion` respected, contrast 4.5:1, all form fields labelled, icons from one set (no emoji as icons).
- Priority is the demo path (PLAN.md section 3). Polish those six steps before anything else; nothing outside the demo path gets design time until the path works end to end.
- When a screen is done, run `web-design-guidelines` on its files and fix findings before merging.
