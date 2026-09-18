# Design drafts

Output from Claude Design, dropped in as-is. Open over http, not `file://` — the page unpacks
itself with JavaScript and browsers block that from the filesystem:

```bash
cd drafts/design && python3 -m http.server 8080
# http://localhost:8080/problem-page.html
```

| File | What it is |
|---|---|
| `problem-page.html` | The buyer's own problem screen. First direction, from the idea-only prompt in `docs/LOVABLE_PROMPT.md`. |

These are references, not code to import: the markup is assembled at runtime by a bundled
runtime, so it cannot be copied into components. Read the decisions, rebuild in `src/`.

## What this direction decided

**Palette, chosen with no direction given:** ground `#F4F6F8` (cool, not cream), ink `#16323A`
(a real slate-teal, not a tinted black), signal green `#2F6D52`, secondary text `#5C6E75`,
rules `#E4E9ED`. One family, Instrument Sans. It avoided every generated-design tell on its own.

**Good calls it made unprompted:**
- `PRB-4f21` in the header — a case reference, so the screen reads as a confidential file.
- The filtered vendor's line: "Minimum engagement above your ceiling, never saw your problem" —
  the reason and the reassurance in one sentence.
- "7 more did not clear your terms" — eliminations surfaced rather than buried.
- Filtered and unaccepted vendors are anonymous; only their category and size show.

**What it got wrong:**
- It rewrote the buyer's own words into a clipped summary. The verbatim voice is the thing the
  product protects; flattening it into a ticket title loses the point.
- `Rebase OÜ` is named before either side consented. Identities are revealed only after both
  say yes.
- Privacy is expressed entirely in copy — a lock icon and three sentences. There is no visual
  device for withholding, so the one thing that distinguishes this product is invisible.
- The result is a competent SaaS list view. Correct, but not memorable.

## Follow-up prompts

Send these one at a time, in this order.

> The buyer's own words have been rewritten into a summary. Restore them verbatim, as a
> paragraph in their voice: "We're still doing customs paperwork by hand across three
> warehouses. It eats about 60 hours a month between two people, and we've had two fines this
> year from filing errors. We tried a freelancer last spring and it didn't stick." This text is
> the thing the whole product protects — it should be the largest and most human element on the
> screen, not a heading generated from it.

> Privacy is currently expressed only in words — a lock icon and a few sentences. Give it a
> visual form. Somewhere on this screen it has to be visible, not stated, that specific details
> are being deliberately held back from everyone else. Do not settle for the first idea.

> Rebase OÜ is named, but the other vendors are not. Nobody's identity is revealed until both
> sides have agreed to meet. Either show all of them anonymously, or make it unmistakable that
> this one is named because both sides already consented.

> The lower half of the screen is empty. Do not fill it with statistics, metric tiles or a
> chart. Two things belong there.
>
> First, a comparison: on one side the buyer's problem in their own words with the specific
> details that never left marked in place, on the other side — visibly smaller — the two
> sentences the vendors actually received. The difference in volume between the two is the
> product's entire argument, and it is not on the screen yet.
>
> Second, a record of what the system did on the buyer's behalf while they waited: terms
> checked against nine companies, seven eliminated with a reason each, two agents entered
> negotiation, the negotiation with one of them finished and is waiting on the buyer. Treat it
> as the case log of PRB-4f21, in the same register as that reference number — not as an
> activity feed with avatars and timestamps. A buyer who fills in a form and waits has no
> reason to come back; this is what gives them one.
