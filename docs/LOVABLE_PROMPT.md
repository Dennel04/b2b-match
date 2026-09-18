# Lovable prompt — the whole product

Open this file, copy everything between the two rules, paste as the first message in Lovable.

Do not connect this repo — Lovable cannot import an existing repository, and its stack is not
Next.js. This is a clickable visual prototype. We port what we like by hand.

---

Build a clickable visual prototype of a product called **B2B Match**. Six screens, hardcoded
data, navigation between them. No backend, no database, no authentication, no Supabase, no API
calls. Everything on screen is fixed content I give you below. Desktop first, then make every
screen work at phone width.

## What the product is, and why it exists

Business-to-business selling today runs on cold outreach. Sellers buy lists and email thousands
of companies; reply rates have fallen to around 3%. Buyers drown in pitches for things they
don't need, and the one vendor who could actually help them is lost in that noise.

The inversion: instead of sellers hunting buyers, **the buyer writes down the problem they
actually have** — the real one, with numbers — and the system finds who can solve it.

The obvious objection is why any company would write down its problems. A company does not want
competitors knowing what is broken, and does not want to be buried in offers the moment it
admits a weakness. So the product is built around one rule:

**Nobody at the other company ever reads the problem. Not before the match, not after it.**

Instead, two AI agents — one representing each company — talk to each other inside the platform.
The buyer's agent knows the problem and protects it, revealing only enough to test whether the
vendor is real. The seller's agent answers, and asks its own questions. Only if the agents
conclude the two companies should meet are the humans told anything at all, and then each is
asked to consent. Only after both consent do they meet, with a briefing already written.

The financial analogy that explains it in one sentence: **a dark pool for business problems.**
On a stock exchange, a large institution does not publish its order, because the intention
itself is worth money and the market would move against it. The order goes into a dark pool,
gets matched internally, and becomes public only after execution. A company with a burning
operational problem is in exactly that position: saying it out loud costs you your negotiating
position and buys you a hundred sales calls.

Commercial terms work the same way. The buyer states the most they will pay. The seller states
the least they will accept. **Neither figure is ever shown to the other side, or anywhere in the
interface.** The platform compares them internally and reports one thing: the terms match, or
they don't. This is the single most important behaviour in the product, and the interface must
never break it — not in a tooltip, not in a summary, not in a chart.

## Who uses it

Ordinary small and mid-sized European companies, based in Estonia. A forty-person freight
forwarder. A twelve-person software shop. An accounting firm. These are not traders, not
enterprise procurement departments, not startups. They are careful about what they disclose,
they are not impressed by dashboards full of metrics, and they will abandon anything that feels
like a sales tool pointed at them.

The interface has to feel like a **confidential document that two parties read differently** —
not like a CRM, not like an analytics product, not like a marketplace listing page.

## The six screens

### 1. Vendor setup

A vendor describes what they sell and the terms they work under. Two parts on one page.

Profile: company name, city, headcount, industry, a short summary of what they do, and a list of
services.

Working terms — this is the part that makes matching possible, so it should feel consequential
rather than like a settings form:
- Minimum engagement size, with a currency and whether it is one-off or monthly.
- Which contract formats they accept, multiple allowed: a paid pilot of two to four weeks, fixed
  price per project, monthly retainer, time and materials, payment on outcome.
- The date they are free from.
- What they can meet: signing a data processing agreement, ISO 27001, keeping data in the EU,
  working in Estonian, working in English, being on site, having references in the client's
  industry.

Use for the mockup: **Rebase OÜ**, Tartu, 12 people, process automation for logistics.
"We take manual back-office work in logistics companies and turn it into software. Usually
customs and freight documentation, warehouse reporting, and the handoffs between them."
Services: process automation, document workflow, systems integration, WMS implementation.
Minimum €2,500 monthly. Accepts monthly retainer and time and materials. Free from 25 September
2026. Meets: signs a DPA, holds ISO 27001, works in English and Estonian.

### 2. Buyer interview

Instead of an empty text box, the buyer is interviewed by an AI, one question at a time, up to
five questions. Previous questions and answers stay visible above the current one, so it reads as
a conversation building up rather than a form.

The five questions in order: what exactly hurts and what it costs per month in money or hours;
what they have already tried and why it failed; the most they are willing to pay and whether
that is one-off or monthly; which contract formats they would consider; and any hard
requirements or absolute dealbreakers.

**The budget question is the hardest moment in the whole product.** Nobody wants to name their
ceiling. So next to that question the interface has to say plainly, in its own voice, that no
vendor will ever see the number — it exists only to decide which vendors the buyer is shown.
Treat that sentence as a designed element, not as fine print. It is the reason the field gets
filled in at all.

Show this screen at the third question, budget, with the first two already answered.

Use for the mockup: **Nordkai Logistics**, Tallinn, 40 people, freight forwarding.
Their answer to question one, verbatim, in their own voice — do not tidy it up:
"We're still doing customs paperwork by hand across three warehouses. It eats about 60 hours a
month between two people, and we've had two fines this year from filing errors."
Answer to question two: "We tried a freelancer last spring. He was good but he left after two
months and nothing was documented, so we went back to paper."
Their terms, for later screens: ceiling €4,000 monthly, would consider a paid pilot or a monthly
retainer, must start before 15 November 2026, requires a signed DPA and Estonian-language
support.

### 3. The search

Two stages, shown honestly as two stages, because the first one is the argument.

**Stage one is mechanical and involves no AI at all.** Every vendor is checked against the
buyer's terms: is their minimum at or below the buyer's ceiling, are they free in time, is there
any contract format both sides accept, do they meet every hard requirement. Anyone who fails is
eliminated before a single AI call.

**Stage two** reads the problem and scores whoever survived on whether they can actually solve
it.

**Eliminations must be visible, with their reasons.** This is counterintuitive and it is the
point: showing a vendor that fits the problem perfectly and was still rejected proves the system
is thinking rather than agreeing. Do not tuck this behind a toggle.

Use for the mockup, four vendors:
- **Rebase OÜ** — passed both stages, score 91.
- **Meridian Systems**, Tallinn, 80 people, enterprise process consulting — perfect fit on the
  problem, eliminated at stage one because their minimum engagement is above the buyer's ceiling.
  Say it as "their minimum engagement is above your ceiling" and **never show either number**.
- **Kadaka Digital**, Pärnu, 6 people, web and integrations — eliminated at stage one, cannot
  sign a data processing agreement.
- **Vektor Consult**, Tartu, 25 people, logistics consulting — passed stage one, scored 48 at
  stage two: they advise on process but do not build software, so the manual work would remain.

### 4. The two readings and the negotiation — the screen that matters

If you build only one screen properly, build this one.

**Top half: the same problem, twice.**

On the left, wide: the buyer's own problem exactly as they wrote it. Inside that text, the
specific details that never left their side are marked. The buyer can still read their own words
— the mark means "this stayed here", not "this is hidden from you". Five things are marked: the
word "customs", "three warehouses", "about 60 hours a month between two people", "two fines this
year", "a freelancer last spring".

On the right, narrower: everything the vendor actually received. It is two sentences:
"A mid-sized logistics company needs help automating a manual back-office process across several
sites. They have tried an external contractor before without success."

The argument is made by the difference in mass. A full paragraph of sealed specifics on one
side, a thin column on the other. Under the right column: "Nothing else crossed."

**Bottom half: the transcript.** Eight lines, the two agents alternating, buyer's agent first.

1. Buyer's agent — "My client runs a multi-site operation and is losing significant staff time to
   a manual back-office process. Have you replaced a paper-based workflow at this scale before?"
2. Seller's agent — "Three logistics clients in the last two years, all multi-warehouse. We
   typically cut manual handling by 70 to 80 percent inside the first quarter."
3. Buyer's agent — "There have been compliance consequences from the current process. Do your
   deployments cover filing accuracy, or only speed?"
4. Seller's agent — "Both. Validation sits inside the filing step, so errors surface before
   submission rather than after. To size this — how many filings a month, and how many people
   touch them?"
5. Buyer's agent — "Between one and two hundred a month, across several sites. The exact counts,
   and what the current errors have cost, stay with my client until a meeting is agreed."
6. Seller's agent — "That sits inside our normal range. A monthly retainer fits better than a
   fixed price here — volume varies and you will want us reachable after go-live."
7. Buyer's agent — "My client will consider a retainer. They need to begin before mid-November,
   and they require a signed DPA and Estonian-language support."
8. Seller's agent — "We are free from late September and we sign DPAs as standard.
   Estonian-language support is available, though our written documentation is in English."

**Line 5 must be the most deliberate visual moment on the page.** It is the moment the buyer's
agent was asked for exact figures and declined. Mark it with the same visual language used for
the sealed details above, so the two read as the same act. A short note beside it: "Asked for
exact figures. Declined."

**Then the outcome:** the agents recommend meeting, confidence 84 of 100, contract format monthly
retainer, budget shown only as "terms match", earliest start 25 September. Two questions the
agents could not settle, which go to the humans: whether Estonian-language coverage extends to
written documentation or only to support conversations, and whether the first month runs as a
trial and counts toward the retainer.

Close the screen with the line that states the principle: neither side was shown the other's
budget; the platform compared them and reported only that they match.

Nothing on this screen may compete with the sealed details and the refusal.

### 5. Consent, both sides

Two states of one screen, reachable from each other.

**The buyer's view.** An anonymous vendor: industry, company size, the agents' explanation, the
score, and the fact that terms match. **No company name and no amount.** One decision: interested,
or not.

**The vendor's view**, the mirror. They see that a company in freight forwarding, forty people,
has a problem their services address; the agents' explanation; that terms match; the format
agreed. They do not see the problem text and they do not see who it is. One decision: accept, or
decline.

Names are revealed to each other only after both have said yes. Make that sequence legible: it is
the double opt-in, and it is the second half of the product's promise.

### 6. The briefing

What a person actually brings to the meeting. Sections: who's who; the ask; what the agents
already settled; what's left for the two of you; three questions to open the conversation.

"What's left for the two of you" is built from the two unresolved questions in screen 4, and it
is the most useful part of the document — it should read that way, not as an afterthought.

## Visual direction

The subject is a confidential document that two parties read differently. Design from that, not
from fintech and not from SaaS.

**The signature device is withheld information.** Whatever form you give it, it must be
unmistakable that something exists and is being deliberately withheld, rather than simply
absent. This is the one place to spend boldness. Everything around it stays quiet and
disciplined.

Palette: four values. A paper ground that is cool rather than cream. A dark ink that is a real
colour rather than a tinted black. One signal colour used only for compatibility states. One
distinct tone reserved for withheld content and nothing else. Compatible and incompatible have
to be distinguishable without relying on hue alone.

Type: one or two families, clearly distinct if two. Choose deliberately — not Inter, not the
default system stack. The buyer's problem text is the most important content in the product and
should read as something a person wrote, not as interface chrome.

**Do not use any of these.** They appear in generated work regardless of subject, and anyone who
reviews a lot of product design reads them as a tell:
- a near-black background with one bright acid-green or vermilion accent
- a cream background with a high-contrast serif and a terracotta accent
- identical rounded cards with the same soft grey shadow under every piece of content
- tracked-out all-caps eyebrow labels above headings
- monospace type for small data labels
- meta strings joined by middle dots
- an arrow appended to button text
- one word in a headline coloured or italicised for emphasis
- numbered markers 01 / 02 / 03 on things that are not a sequence

Motion: one orchestrated moment only — the transcript arriving line by line, and the refusal
landing. No entrance animation on every section, no hover transition on every card.

Quality floor, unannounced: works at phone width, visible keyboard focus, reduced motion
respected, contrast that holds.

## How the product talks

Plain language, sentence case, active voice. A button says what happens: "Accept meeting", not
"Submit".

Never call the buyer's text "data" or "an entry" — it is a problem someone wrote down. The word
for what the vendor cannot see is **withheld**, not "hidden" and not "encrypted": the platform
itself can read it, and the copy must not imply otherwise.

Empty states are invitations, not apologies. No matches yet means "no vendor has cleared your
terms", plus what would change that.

Never display a figure that came from the other side. The correct phrasing is always that the
terms are compatible, never what they are.

---

## After the first result

Lovable builds one direction at a time. Iterate in place rather than asking for alternatives:

> The withheld details don't read as deliberate — it looks like the text is simply missing.
> Try a treatment where the act of removal is itself visible.

> Screen 3 buries the rejected vendors. Bring the eliminations up to the same weight as the
> match — a vendor that fit the problem and was still rejected is the most convincing thing on
> that screen.

> Line 5 of the transcript isn't carrying enough. It should be the first thing the eye lands on
> in the lower half of the screen.
