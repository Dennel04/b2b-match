# Design brief for Claude Design

Paste sections 2–7 into Claude Design as the opening prompt. Connect this GitHub repo in the
same project — see §1 for what the repo does and does not give it.

---

## 1. How to use this (read before prompting)

**Connect the repo, but know its limits.** Claude Design builds a design system by reading a
codebase. This repo has **no UI yet** — `src/app/page.tsx` is still the Next.js starter. So
there is no visual language to extract. What the repo genuinely gives Claude Design:

- `src/types.ts` — the exact data shapes every screen renders. This is the valuable part.
- `PLAN.md` §3 — the demo path, in order.
- `docs/RESEARCH.md` §6 — why the product looks the way it does.

Everything about **how it looks** has to come from this brief. Left to itself, Claude Design
falls back on recognisable AI design patterns — its own team says so.

**Workflow the Claude Design team recommends:**
- Do the thinking before you prompt. Arrive with the decision made, not with a vague ask.
- Be explicit about type and colour from the first message.
- Ask for several directions on the hero screen, then remix the two that work. Do not refine
  one mediocre direction.
- Wireframe structure first, then fidelity.
- Queue follow-up messages instead of waiting turn by turn.
- Final nudges: edit directly rather than writing another long prompt.
- Do not ask it for a logo — it does not generate images.

---

## 2. What this product is

B2B Match is a dark pool for business problems.

A company writes down a problem it has right now — a real one, with numbers. That text is never
published and never shown to another company. On the other side, vendors describe what they
sell. The platform compares both sides' commercial terms server-side, then two AI agents — one
representing each company — negotiate on their owners' behalf. Neither human knows the other
exists until the agents agree. Only then are both asked to consent, and only then do they meet,
with a briefing already written.

The users are ordinary Estonian B2B companies: a logistics operator, an accounting firm, a
12-person software shop. Not traders, not enterprise procurement. They are cautious about
disclosure and they are not impressed by dashboards.

**The idea the interface has to carry: a confidential document, partly readable.**

---

## 3. The screen that matters

If only one screen is built, build this one.

**The two-sided view.** The same problem, rendered twice on one screen: what the buyer wrote,
and what the seller is allowed to see. The seller's side is the buyer's side with information
physically removed — not a different card, not a summary panel, but visibly the same document
with parts withheld.

Beneath it, the agent negotiation transcript plays out, alternating between the two agents.
**One line in that transcript must be visually marked: the moment the buyer's agent declines to
disclose a detail.** That single mark is the product's entire argument. It should be the most
deliberate visual moment on the page.

The transcript ends with the outcome: a verdict, the contract format both agents settled on, and
the questions they could not resolve.

Nothing else on this screen may compete with the withheld information and the refusal.

---

## 4. Screens, in demo order

Data shapes are in `src/types.ts` — use those field names.

**1. Problem intake — an AI interview**
One question at a time, conversational, up to five questions. Previous answers stay visible
above. Questions 3–5 collect commercial terms: budget ceiling, acceptable contract formats
(`pilot_first`, `fixed_price`, `monthly_retainer`, `time_and_materials`, `outcome_based`), start
date, hard requirements (`gdpr_dpa`, `iso27001`, `eu_data_residency`, language, `on_site`,
`industry_refs`).
When the budget question appears, the interface must state plainly that no vendor will ever see
the number. That reassurance is the reason the field gets filled in — treat it as part of the
design, not a caption.

**2. Matching in progress**
Two stages, shown honestly. The mechanical check runs first and eliminates candidates for
concrete reasons. Elimination is shown, not hidden: a vendor that fits the problem perfectly but
fails on budget or a missing certificate should be visible as a rejection with its reason.
Showing what was rejected is more persuasive than showing what passed.

**3. The two-sided view** — §3. The centrepiece.

**4. Consent**
The buyer sees an anonymous match: an industry, a company size, a compatibility statement, a
score, and the agents' explanation. Never a company name, never an amount. One decision:
interested, or not. The seller then sees the mirror of that and accepts or declines.
`Compatibility` carries `'ok' | 'gap' | 'unknown'`, never figures — the interface must never
invent a number to display.

**5. Briefing**
Markdown, rendered as something a person would actually bring to a meeting. Sections: who's who,
the ask, what the agents settled, what's left for the humans, three opening questions.
"What's left for the humans" is the useful part and should read that way.

---

## 5. Visual direction

The subject is a confidential document that two parties read differently. Design from that,
not from fintech.

**The signature device is withheld information.** Whatever form it takes — a struck block, a
missing column, text that stops — it should be unmistakable that something exists and is being
withheld deliberately, rather than merely absent. This is the one place to spend boldness.
Everything else stays quiet.

**Starting palette — treat as a proposal, replace it if you have something sharper for this
subject.** Four values: a paper ground that is cool rather than cream; a dark ink for text that
is a real colour rather than a tinted black; one signal colour used only for compatibility
states; one muted tone for withheld content. Compatible and incompatible must be
distinguishable without relying on hue alone.

**Type.** One or two families, clearly distinct if two. Choose deliberately — not Inter, not the
default system stack. The problem text is the most important content on the screen and should
be set as something a person wrote, not as UI chrome.

**Do not use these.** They appear in generated work regardless of subject, and a judge who
reviews many demos will read them as a tell:
- near-black background with one acid-green or vermilion accent
- cream background + high-contrast serif + terracotta accent
- identical rounded cards with the same soft grey shadow for every piece of content
- tracked-out all-caps eyebrow labels above headings
- monospace for small data labels
- meta strings joined by middle dots
- an arrow appended to button text
- one word in a headline coloured or italicised for emphasis
- numbered markers 01 / 02 / 03 on things that are not a sequence

**Motion.** One orchestrated moment only: the agent transcript arriving line by line, and the
refusal landing. No entrance animation on every section, no hover transition on every card.

**Accessibility floor, unannounced:** works at phone width, visible keyboard focus, reduced
motion respected, contrast that holds.

---

## 6. Copy rules

- Plain language, sentence case, active voice. A button says what happens: "Accept meeting",
  not "Submit".
- Never call the buyer's text "data" or "an entry". It is a problem someone wrote down.
- The word for what the seller cannot see is "withheld", not "hidden" and not "encrypted" —
  the platform can read it, and the copy must not imply otherwise.
- Empty states are invitations, not apologies. No match yet means "no vendor has cleared your
  terms" plus what would change that.
- Never display a figure taken from the other side. The correct phrasing is that budgets are
  compatible, not what they are.

---

## 7. Content for the mockups — use this, not lorem ipsum

**Buyer:** Nordkai Logistics, Tallinn, 40 employees, freight forwarding.
**Their problem, verbatim:** "We're still doing customs paperwork by hand across three
warehouses. It eats about 60 hours a month between two people, and we've had two fines this year
from filing errors. We tried a freelancer last spring and it didn't stick."
**Their terms:** ceiling €4,000/month, formats `pilot_first` and `monthly_retainer`, must start
by 15 November 2026, requires `gdpr_dpa` and `estonian_language`.

**Seller:** Rebase OÜ, Tartu, 12 employees, process automation for logistics.
**Terms:** floor €2,500/month, formats `monthly_retainer` and `time_and_materials`, available
from 25 September 2026, holds `gdpr_dpa` and `iso27001`.

**What the seller is allowed to see:** "A mid-sized logistics company needs help automating a
manual back-office process across several sites. They have tried an external contractor before
without success."

**The rejected vendor, for the matching screen:** Meridian Systems — strong fit on the problem,
eliminated because its minimum engagement is €9,000/month, above the buyer's ceiling.

**A transcript line worth marking:** the seller's agent asks how many filings per month; the
buyer's agent answers with a range and says the exact figures stay with its client until a
meeting is agreed.

---

## 8. First message — copy this in

Template: **UI mockups**. Model: **Opus 5**. Attach this repo via the code button.
Design system: **none**, unless you have built one for this product — a stock one will
override the direction below.

Paste everything between the lines as the first message.

---

Product: a confidential matching platform for small B2B companies in Estonia.

A company writes down an operational problem it has right now, with real numbers. That text is
never published and never shown to another company. Vendors separately describe what they sell.
The platform compares both sides' commercial terms server-side, then two AI agents — one acting
for each company — negotiate on their owners' behalf. Neither human knows the other exists
until the agents agree. Only then do both consent, and only then do they meet.

Users are ordinary companies: a 40-person freight forwarder, a 12-person software shop. Cautious
about disclosure, unimpressed by dashboards. Not traders, not enterprise procurement.

The idea the interface has to carry: **a confidential document, partly readable.**

I want four different directions for one screen only. Do not design the rest of the product yet.

THE SCREEN: the two-sided view.

The same problem rendered twice on one screen — what the buyer wrote, and what the seller is
allowed to see. The seller's side is the buyer's side with information physically removed: not a
separate card, not a summary panel, but visibly the same document with parts withheld.

Below it, the negotiation transcript between the two agents, alternating. One line must be
visually marked: the moment the buyer's agent declines to disclose a detail. That single mark is
the product's entire argument and should be the most deliberate moment on the page. The
transcript ends with the verdict, the contract format both agents settled on, and the questions
they could not resolve.

Nothing else on this screen may compete with the withheld information and the refusal.

REAL CONTENT — use this, no placeholder text.

Buyer: Nordkai Logistics, Tallinn, 40 employees, freight forwarding.
What they wrote, verbatim: "We're still doing customs paperwork by hand across three warehouses.
It eats about 60 hours a month between two people, and we've had two fines this year from filing
errors. We tried a freelancer last spring and it didn't stick."

Seller: Rebase OÜ, Tartu, 12 employees, process automation for logistics.

What the seller is allowed to see: "A mid-sized logistics company needs help automating a manual
back-office process across several sites. They have tried an external contractor before without
success."

Transcript, eight lines alternating, buyer's agent first. The marked line: the seller's agent
asks how many filings per month; the buyer's agent gives a range and says the exact figures stay
with its client until a meeting is agreed. Outcome: proceed, monthly retainer, two open
questions for the humans.

Budgets are compatible but neither figure is ever displayed. The interface states that terms
match; it never shows an amount from either side.

VISUAL DIRECTION.

The signature device is withheld information. Whatever form it takes, it must be unmistakable
that something exists and is being withheld deliberately, rather than simply absent. Spend the
boldness there; keep everything else quiet.

Four values in the palette: a paper ground that is cool rather than cream; a dark ink that is a
real colour rather than a tinted black; one signal colour used only for compatibility states;
one muted tone for withheld content. Compatible and incompatible must be distinguishable without
relying on hue alone.

One or two type families, clearly distinct if two. Choose deliberately — not Inter, not the
default system stack. The problem text is the most important content on the screen and should
read as something a person wrote, not as UI chrome.

Do not use any of these. They show up in generated work regardless of subject and read as a tell:
near-black background with one acid-green or vermilion accent; cream background with a
high-contrast serif and a terracotta accent; identical rounded cards with the same soft grey
shadow on everything; tracked-out all-caps eyebrow labels above headings; monospace for small
data labels; meta strings joined by middle dots; an arrow appended to button text; one word in a
headline coloured or italicised; numbered markers 01 / 02 / 03 on things that are not a sequence.

Copy rules: plain language, sentence case, active voice. Never call the buyer's text "data" —
it is a problem someone wrote down. The word for what the seller cannot see is "withheld", not
"hidden" and not "encrypted".

Make the four directions genuinely different in how withholding is expressed, not four colour
variations of one layout.

---

### Queue this as the second message

> Take direction 2 as the base and the way direction 4 handles the withheld text. Build that
> combination out at full fidelity, desktop first. Then show me the same screen at phone width.

Replace the numbers with whichever two actually work.

---

## 9. Same brief for Lovable

**Do not connect this repo.** Lovable cannot import an existing repository — it only exports to
a repo it creates itself. Its default stack is TanStack Start / React + Vite, not Next.js. Treat
Lovable as a mockup generator whose output we port by hand.

Why it is still worth using: it emits React + Tailwind, and this project already runs Tailwind
v4, so the JSX ports into `src/components/` almost verbatim. Claude Design emits HTML, which has
to be rewritten into components.

**Porting checklist**
- Copy the JSX into `src/components/`, keep the Tailwind classes.
- Add `'use client'` to any component with state or handlers.
- Strip react-router imports; this app routes with the App Router.
- Replace shadcn/ui imports with plain markup unless we decide to install shadcn.
- Data comes from `src/types.ts`. Do not keep Lovable's invented field names.

### First message for Lovable

Paste everything between the lines. It is the §8 brief plus the constraints Lovable needs, or it
will try to build a whole application.

---

Build a static mockup of ONE screen. No backend, no database, no authentication, no routing, no
Supabase. Hardcode all data. This is a visual prototype whose code we port into an existing
Next.js app by hand — keep it to React components with Tailwind classes, and avoid libraries
beyond what is needed to render.

Product: a confidential matching platform for small B2B companies in Estonia.

A company writes down an operational problem it has right now, with real numbers. That text is
never published and never shown to another company. Vendors separately describe what they sell.
The platform compares both sides' commercial terms server-side, then two AI agents — one acting
for each company — negotiate on their owners' behalf. Neither human knows the other exists until
the agents agree.

Users are ordinary companies: a 40-person freight forwarder, a 12-person software shop. Cautious
about disclosure, unimpressed by dashboards.

The idea the interface has to carry: **a confidential document, partly readable.**

THE SCREEN: the two-sided view.

The same problem rendered twice on one screen — what the buyer wrote, and what the seller is
allowed to see. The seller's side is the buyer's side with information physically removed: not a
separate card, not a summary panel, but visibly the same document with parts withheld.

Below it, the negotiation transcript between the two agents, alternating. One line must be
visually marked: the moment the buyer's agent declines to disclose a detail. That single mark is
the product's entire argument and should be the most deliberate moment on the page. The
transcript ends with the verdict, the contract format both agents settled on, and two questions
they could not resolve.

Nothing else on this screen may compete with the withheld information and the refusal.

REAL CONTENT — use this, no placeholder text.

Buyer: Nordkai Logistics, Tallinn, 40 employees, freight forwarding.
What they wrote, verbatim: "We're still doing customs paperwork by hand across three warehouses.
It eats about 60 hours a month between two people, and we've had two fines this year from filing
errors. We tried a freelancer last spring and it didn't stick."

Seller: Rebase OÜ, Tartu, 12 employees, process automation for logistics.

What the seller is allowed to see: "A mid-sized logistics company needs help automating a manual
back-office process across several sites. They have tried an external contractor before without
success."

Transcript: eight lines, alternating, buyer's agent first. The marked line — the seller's agent
asks how many filings per month; the buyer's agent gives a range and says the exact figures stay
with its client until a meeting is agreed. Outcome: proceed, monthly retainer, two open questions.

Budgets are compatible but neither figure is ever displayed. The interface states that terms
match; it never shows an amount from either side.

VISUAL DIRECTION.

The signature device is withheld information. Whatever form it takes, it must be unmistakable
that something exists and is being withheld deliberately, rather than simply absent. Spend the
boldness there; keep everything else quiet.

Four values in the palette: a paper ground that is cool rather than cream; a dark ink that is a
real colour rather than a tinted black; one signal colour used only for compatibility states;
one muted tone for withheld content. Compatible and incompatible must be distinguishable without
relying on hue alone.

One or two type families, clearly distinct if two. Choose deliberately — not Inter, not the
default system stack. The problem text is the most important content on the screen and should
read as something a person wrote, not as UI chrome.

Do not use any of these. They show up in generated work regardless of subject and read as a tell:
near-black background with one acid-green or vermilion accent; cream background with a
high-contrast serif and a terracotta accent; identical rounded cards with the same soft grey
shadow on everything; tracked-out all-caps eyebrow labels above headings; monospace for small
data labels; meta strings joined by middle dots; an arrow appended to button text; one word in a
headline coloured or italicised; numbered markers 01 / 02 / 03 on things that are not a sequence.

Copy rules: plain language, sentence case, active voice. Never call the buyer's text "data" — it
is a problem someone wrote down. The word for what the seller cannot see is "withheld", not
"hidden" and not "encrypted".

Desktop first, then make it work at phone width.

---

### Then

Lovable builds one direction at a time, so iterate in place rather than asking for four
alternatives the way you would in Claude Design:

> The withheld information doesn't read as deliberate — it looks like the text is simply
> missing. Try a different treatment that makes the removal itself visible.
