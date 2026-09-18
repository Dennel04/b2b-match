# The reference screen

`problem-page.html` is the settled visual direction for the whole product. Every screen is built
from it. The rules it encodes are written down in `.claude/skills/b2b-match-ui`.

Open it over http, not `file://` — the page unpacks itself with JavaScript and browsers block
that from the filesystem:

```bash
cd drafts/design && python3 -m http.server 8080
# http://localhost:8080/problem-page.html
```

| File | What it is |
|---|---|
| `problem-page.html` | The buyer's problem screen. Sidebar, top bar with case controls, the three groups, footer. |

The markup is assembled at runtime by a bundled runtime, so it cannot be copied into components.
Read the decisions, rebuild them in `src/`.

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
