# Market research: how original is this, and what to tell the judges

Compiled 18 September 2026. Every claim below is sourced at the end.

## Executive summary

**As a category, the idea is not original.** At least three established markets already do
parts of it, plus one direct competitor charging $75/month. The mechanism — *private problem,
blind match, machine-to-machine negotiation, payment per accepted meeting* — is not packaged
anywhere, and LinkedIn has a structural reason never to build it.

Three things are defensible:

1. **The problem is never disclosed** — not publicly, not to the seller before consent.
2. **Payment per accepted meeting**, not per lead and not by subscription. The only model where
   spam is mathematically pointless.
3. **Matching on unstructured problem text** — impossible before LLMs, and the reason the EU's
   own database stayed a catalogue instead of becoming a matcher.

The strongest pitch framing is **"a dark pool for business problems"**. The strongest single
line is *"We don't show the numbers. We show that the numbers match."*

As a standalone marketplace the odds are poor — frequency and liquidity, not competitors, are
what kill it. As a layer sold to an organisation that already owns both sides (a chamber of
commerce, an accelerator, an event organiser) the same code is a viable business. See §7.

## Contents

1. [Who already does something similar](#1-who-already-does-something-similar)
2. [Why people keep using LinkedIn](#2-why-people-keep-using-linkedin)
3. [Why now](#3-why-now)
4. [Honest weaknesses and how to answer them](#4-honest-weaknesses-and-how-to-answer-them)
5. [What is actually original](#5-what-is-actually-original)
6. [The machine-only channel: does anyone ship it?](#6-the-machine-only-channel-does-anyone-ship-it)
7. [Verdict: continue or drop it](#7-verdict-continue-or-drop-it)
8. [Sources](#8-sources)

---

## 1. Who already does something similar

### 1.1 Direct competitor: Xpylon

The closest thing to our idea. An AI B2B matchmaking platform: you describe a need (sector,
geography, certifications), the AI scans a "global deal graph" and delivers matching
counterparties to your inbox. Segments: buyers, sellers, M&A, procurement.

| | Xpylon | Us |
|---|---|---|
| Matching | structured criteria (sector, geography) | problem text, no taxonomy |
| Request privacy | not claimed | the core of the product |
| Double opt-in | not claimed | a required step |
| Price | $75/month per user | the seller pays per accepted meeting |
| Traction | not disclosed | — |

**What this means:** we are not first. But Xpylon sells a subscription for *access to matches* —
it monetises exposure, not outcomes. Same incentive to spam as everyone else.

### 1.2 Lead marketplaces: Bark, Sortlist, Clutch

The model: a buyer describes a job, the platform sells that lead to vendors.

- **Bark.com** — 1000+ service categories. Professionals buy credits and spend them to contact
  a customer. Customer details are released only once a quote has been sent.
- **Sortlist** — a business submits a brief, an algorithm selects agencies by expertise,
  language, radius and budget band. Agencies pay a subscription (Sortlist+) plus credits for
  lead access.

**The key lesson here is a negative one.** Both charge the seller **for access to the lead**,
not for the outcome. Anyone who has used Bark knows what follows: you post a request and get
five to ten calls within the hour. That is exactly the spam we promise to remove, relocated
inside a platform. **Our payment model is the only thing that separates us from them, and it
has to be said in the pitch.**

### 1.3 Event matchmaking: Brella, Grip, Swapcard, b2match

The most mature "both sides must consent" mechanic on the market — and long since solved.

- **Brella** — intent-based AI reading goals and behaviour across hundreds of signals.
  **3+ million meetings since 2016.** A meeting requires both sides to agree.
- **Grip** — 16+ ML algorithms combining stated preferences with behavioural signals.
- **b2match, Swapcard** — the same for trade fairs and conferences.

**What this means:** "AI introduces two companies and both confirm a meeting" is a solved
problem with millions of transactions behind it. Any judge who attends conferences will
recognise it. Our difference is not the matching — it is that **there is no event**: no shared
context and no time box, but there is a private problem, which conferences never have.

### 1.4 Intent data: 6sense, Bombora, G2, ZoomInfo

A large, mature market solving the same pain **from the other end**: inferring which companies
are in-market from digital exhaust — what they read, search, and review.

The fundamental difference: **this is data about the buyer without their knowledge or consent.**
The buyer never declares a need; it is inferred, and they still get cold email, just
better-targeted. We are the opposite: declared intent with access control.

Best single pitch line here: *"Intent data guesses the buyer's intent behind their back.
We ask the buyer — and give them the switch."*

### 1.5 The free competitor people forget: Enterprise Europe Network

The EU's own database at `een.ec.europa.eu/partnering-opportunities`: **6,045 live profiles**,
types including Business Offer, **Business Request**, R&D Request, Technology Offer/Request.
Companies from 60+ countries. **Free.**

So "a company publishes a request and another finds it" already exists in Europe at zero cost.
Why nobody uses it at scale: it is a static catalogue with no matching, no privacy and no
ranking — you page through 605 pages by hand. **That is our argument, not our problem:** demand
is proven by a government, execution is terrible.

### 1.6 Proof the model can work: Xometry

A vertical buyer-driven marketplace (ordering manufactured parts). Q1 2026:
**revenue $205M (+36% YoY), marketplace up 40%, 85,581 active buyers (+20%)**, marketplace
gross margin up from 31.8% to 34.7%.

Why it works: **one vertical plus instant quoting**. Upload a 3D model, get a price in seconds.
No "describe your problem in words".

**Lesson:** horizontal "for every industry" platforms die; vertical ones with an instant answer
grow. The pitch must name **one niche** to start in.

---

## 2. Why people keep using LinkedIn

The judges will ask this in exactly these words. The honest answer: **because it cannot be
routed around, and we are not trying to.**

### The numbers

| Metric | Value |
|---|---|
| Members | **1.2 billion**, four straight years of double-digit growth |
| FY2026 revenue (Microsoft) | **$19.8B**; first $5B+ quarter in Dec 2025 |
| Premium subscriptions | $2B+/year, subscribers up ~50% in two years |
| Recruitment tech market share | **88.05%** |
| Sales Navigator | $99–149/month; users close 42% larger deals |

### Three reasons it does not fall over

1. **A trust graph, not a product.** Two decades of accumulated profiles, work history,
   endorsements and relationships. Not reproducible. The product is mediocre and the feed is
   noise, and revenue still grows double digits. People tolerate LinkedIn not because it is
   good, but because everyone is there.
2. **Identity equals switching cost.** Leaving means losing the proof of who you are.
3. **It is the only place to verify a person.** Even when a deal starts elsewhere, the
   participants get looked up on LinkedIn.

### Why that is our opening, not our death sentence

**LinkedIn's business model is selling access to people.** InMail credits, Sales Navigator at
$99–149/month, advertising. Revenue grows exactly when outbound volume grows.

It follows that **LinkedIn structurally cannot hand the buyer a switch.** A feature that says
"I receive at most three offers a week, and only ones that passed double opt-in" destroys InMail
as a product. That is not a roadmap priority — it is a contradiction in how they make money.

**Pitch wording (learn it verbatim):**

> "We are not competing with LinkedIn for the graph — 1.2 billion people is not a fight you
> win. We compete on one function LinkedIn will never build: control on the buyer's side.
> LinkedIn earns $19.8 billion selling sellers access to buyers. Handing the buyer an off
> switch means killing its own revenue. We start where their business risk begins."

---

## 3. Why now

| Fact | Source | What it means |
|---|---|---|
| Cold email reply rates fell **5.1% (2024) → 3.43% (2026)** | Instantly, 10M+ emails analysed | The old channel is dying in real time |
| **67% of B2B buyers** prefer a **rep-free** purchase (61% in 2025) | Gartner, 646 buyers, March 2026 | The market is moving toward our model on its own |
| Buyers spend **17% of the buying cycle** with vendors; ~80% happens without a rep | Gartner | The seller does not control the process |
| **45%** of buyers used AI in a recent purchase | Gartner, 2026 | An AI intermediary is already normal |
| **20% of B2B sellers** will face negotiations run by a buyer's AI agent in 2026 | Deloitte / industry forecasts | Our agent negotiation is a trend, not a toy |
| MCP (Anthropic), A2A (Google), NLWeb (Microsoft) shipped 2025–2026 | — | Agent-to-agent infrastructure already exists |

**The real "why not in 2015" argument:** matching an unstructured problem against an
unstructured service description used to require taxonomies, tags and manual moderation — which
is why EEN became a catalogue rather than a matcher. LLMs remove that layer: "we're bleeding 12
hours a week on manual warehouse bookkeeping" matches "we implement WMS" with no shared
vocabulary at all. **That is the actual answer to "why now".**

Historical footnote for a sharp judge: buyer-driven commerce was patented by Walker Digital and
became Priceline in 1998 ("name your own price" — the buyer states terms, sellers accept or
not). The idea is 28 years old. What is new is not buyer intent; it is that intent can now be
understood without a form.

---

## 4. Honest weaknesses and how to answer them

### 4.1 Why would a buyer disclose a problem at all?

The hardest hit. RFP research shows public disclosure deters both sides: the buyer fears leaks
to competitors; the vendor doubts the request is genuine and will not spend time on the
uncertainty. That closes a loop — few vendors respond, so buyers stop publishing.

**Answer:** the problem is never published anywhere. The seller never sees its text — only a
generated, category-level explanation ("this company needs help with X in the Y area"). This is
not a privacy setting, it is architecture: `problems` is behind RLS, and `reasoning_public` is
generated by a prompt that forbids quoting. **Show it on screen rather than saying it** — here
is what the buyer sees, here is what the seller sees; the difference is visible.

### 4.2 Cold start — and the thing that kills more often

The standard chicken-and-egg answer is known. But the marketplace data is harsher:
**most two-sided platforms die after launch, of lost liquidity, not before it.** Typical causes:
supply spread across too many segments, seeding the wrong side first, transactions leaking off
platform in year two, setting a take rate before understanding the unit economics.

**Answer:** start in one niche and seed the side that is harder to acquire. A buyer with a
burning problem is the harder side, so start there and pull vendors toward concrete demand.
One vertical, one community (the Estonian startup hub, or a single industry association) —
not "every company in Europe".

### 4.3 Disintermediation

You introduce two parties and then they talk directly and the platform is no longer needed.
A classic year-two cause of death.

**Answer:** we take payment at the moment of **meeting acceptance**, before contacts are
exchanged. The briefing is both the value handover and the billing event.

### 4.4 Seller incentives

Bark's model (pay per lead) inevitably degrades into spam: the seller pays for exposure, so they
want to appear in every match. Xpylon's model (subscription for access) is the same.

**Answer:** the seller pays, and only for a meeting the **buyer accepted**. Spamming is
economically pointless: a rejection costs the platform nothing and earns the seller nothing.
Precedent that this works: **Startup Intros** — every match is double opt-in, an investor only
sees a founder if they opted into the category; $790/year subscription, no placement fee,
500+ founders in 18 months.

### 4.5 Regulatory tailwind (EU specific)

Cold outreach in the EU is legally fragile: **Germany and Italy** effectively require prior
consent for B2B email; France, the Netherlands and Ireland allow legitimate interest for
role-based addresses. GDPR fines reach €20M or 4% of global turnover.

**Answer, and an argument in itself:** a platform built on explicit consent from both sides
**structurally** does not have this problem. For an Estonian or EU jury this lands — say it in
one sentence and move on.

---

## 5. What is actually original

**Not original:** AI matching of companies (Xpylon, Skipso, Innoloft), mutual consent before a
meeting (Brella, Grip — 3M meetings), "describe your task, we'll find a vendor" (Bark,
Sortlist), "a company publishes a request" (EEN, free, 6,045 profiles), and buyer-driven
commerce itself (patented 1998).

**Original and defensible in exactly three points:**

1. **The problem is never disclosed** — not publicly, not to the seller before consent. On every
   platform above the buyer's request is either public or sold.
2. **Payment per accepted meeting**, not per lead and not by subscription. The only model where
   spam is mathematically pointless. None of the competitors studied has it.
3. **Matching on unstructured problem text.** No taxonomies, no forms — exactly what was
   impossible before LLMs, and why EEN remained a catalogue.

Everything else ("AI matching", "smart pairing", "saving sales reps time") is a red flag to a
jury that heard those words from ten teams before us.

### What that changes in the product and the pitch

- **Lead the demo with privacy, not matching.** Two screens side by side: what the buyer sees,
  what the seller sees. Without the contrast a match looks like ordinary search.
- **Name the niche out loud.** Not "B2B companies" but, say, Estonian logistics firms and their
  contractors. Xometry grew by vertical, not by reach.
- **The pitch metric is the accepted-meeting rate**, not the number of matches. Anyone can
  generate matches; an accepted meeting is the product, and it is what gets billed.
- **Frame the agent negotiation as early agent-to-agent commerce**, not as a fun feature: 20% of
  sellers meet this in 2026, and the standards shipped in 2025–26.
- **Have the LinkedIn answer ready verbatim** (§2). That question is coming.

---

## 6. The machine-only channel: does anyone ship it?

Refined idea: **no human on the other side ever sees the list of problems.** The negotiation
happens entirely inside the platform, between agents. Humans learn about a counterparty only
once the algorithms have agreed, and they receive a summary.

I searched specifically for this. **I found no product in production with that mechanism.**
Below is everything that came closest, and how it differs.

### 6.1 Closest real analogue: Axial and Dealsuite (M&A)

| | What they do | How it differs from our mechanism |
|---|---|---|
| **Axial** | 20,000+ investors, advisors and owners. The algorithm evaluates buy-side preferences and **privately** suggests counterparties to sell-side members, ranked by fit. The seller keeps full control over who sees what, and when. | The anonymised teaser is written by a **human**. Every disclosure is approved by hand. No machine negotiation. |
| **Dealsuite** | European M&A. A deal is uploaded as **anonymised criteria** and the platform returns interested buyers immediately. Built-in NDA tool. The user decides how much to share and with whom. | Same: anonymisation is manual, the match is a criteria filter rather than a conversation. |

**This is an important precedent to know.** "The request is never public, an algorithm matches
blind, disclosure only on mutual consent" **already exists and works — but only in M&A, and with
a human in every link.**

What has not been done: removing the human from the middle, and moving this from selling a
business to **current operational problems**, which are orders of magnitude more common.

### 6.2 The financial precedent worth naming in the pitch: dark pools

Exactly our mechanism, decades old, on exchanges: large block orders are **not published**, no
participant sees anyone else's intent, the engine crosses them internally, and the trade becomes
known only after execution. The point is to prevent the leak of an intention that would move the
price against you. In the US this is legal and regulated by the SEC (Regulation ATS).

**Pitch wording — the shortest and clearest we have:**

> "It's a dark pool for business problems. On an exchange, a large player doesn't show its order
> to the market, because the intention itself is worth money. For a company it's the same:
> saying out loud 'our warehouse is on fire' means a hundred phone calls and a lost negotiating
> position. We keep the intention dark and cross it only once the match has been checked."

That explains itself in ten seconds and kills the "why would a buyer disclose" question outright.

### 6.3 Machine negotiation exists, but one-sided

**Pactum** — AI runs autonomous negotiations with suppliers. Walmart, Maersk and Vodafone run
this at scale. Walmart: average payment terms extended by 35 days at a 68% supplier agreement
rate. Negotiation cycles drop from weeks to minutes, with 2–30% value on negotiated spend.

How it differs: this is **AI against a human**, not AI against AI. And it negotiates terms in an
**existing** relationship with a known supplier — not discovery, not introduction. Pactum itself
describes AI-to-AI as a future state, not a current product.

Market forecasts: ~20% of B2B sellers will face negotiations run by a buyer's agent during 2026;
a genuinely agent-negotiable stage is expected 2027–2028. We are building at the hackathon what
the market expects in a year or two. Good argument — and an honest risk: we are early.

### 6.4 The direction is named, the product is not built

There is commentary on A2A marketing: agents evaluate a company's trust signals, documentation,
integrations and credibility **before** a human buyer ever sees the shortlist. That is our logic
exactly — but it is articles and forecasts, not shipping products.

Separately: the technology where **nobody at all sees the data, including the platform
operator** — confidential computing and MPC — does exist (OPAQUE raised $24M in Feb 2026,
Evervault $25M in Mar 2026; 75% of organisations are adopting or piloting). We do **not** use it;
see the next point.

### 6.5 Where this framing becomes a lie a judge will catch

Saying "nobody sees the problem" is **false for our implementation**, and a sharp judge will
expose it. It is seen by:

- our Postgres, in plaintext,
- anyone holding the service role key, which is the whole team,
- the Anthropic API, where we send it inside the buyer agent's prompt.

What is **not** on that list any more: the counterparty's agent. The negotiation runs as two
separate model calls per round, and the seller agent's prompt takes no problem text at all
(`sellerTurnPrompt()` in `src/prompts/negotiate.ts` — printable on stage). A deterministic guard
(`src/lib/leak.ts`) then rejects any transcript that carries a phrase or a figure across. The
first version had one call playing both agents with the problem in shared context; that was the
"isolation in a prompt" a judge would have caught, and it is gone.

**Say this instead:**

> "No human at the counterparty company ever sees the problem statement — and neither does the
> agent acting for them. It is a separate model call that is never handed the text. Even after
> the meeting is accepted, the seller receives a summary, not the raw text."

That is true, it is verifiable on screen and in the code, and it is enough. If someone asks
"but do *you* see it?", the honest answer is: "today, yes — the platform is a trusted
intermediary, like a dark pool or an escrow. The next step is confidential computing so that we
don't either." That answer is stronger than an exaggeration that got caught.

### 6.6 What this framing changes in the product

**It is stronger than the original.** "Another matching platform" becomes "a dark pool for
business problems". The judges will remember the second one.

Three hard consequences for 24 hours:

1. **The agent negotiation stops being a stretch goal and becomes the product.** If the machine
   channel is the substance and we do not show it, we have shown ordinary matching. It moves
   into the required scope and something else gets cut (website scraping was the candidate; the
   profile can be typed by hand).
2. **The demo risks becoming invisible.** If everything happens inside machines, there is nothing
   on screen. So the centrepiece is **the negotiation transcript itself**, with the moment
   highlighted where the buyer's agent refused to disclose a detail. That is the only way to show
   the invisible. (The pipeline marks those lines itself — `withheld` on each buyer turn — so the
   highlight is real, not staged.)
3. **Cold start gets worse, not better.** If people cannot browse a catalogue, the platform has
   no pull until density exists: you arrive, fill a form, and leave to wait. In the demo that is
   solved by seeding; in the pitch, by an honest answer about starting inside one community.

### 6.7 Originality scorecard, with the refinement applied

| Element | Done on the market? | By whom |
|---|---|---|
| Request never public, blind match | **Yes** | Axial, Dealsuite — M&A only |
| Disclosure only on mutual consent | **Yes** | Axial, Dealsuite, Brella, Startup Intros |
| Anonymised teaser instead of raw text | **Yes**, manually | Axial, Dealsuite |
| AI negotiating autonomously | **Yes**, one-sided | Pactum (Walmart, Maersk, Vodafone) |
| Matching on unstructured problem text | Barely | — |
| **Agent vs agent, humans outside the loop until consent** | **No product found** | — |

We invented none of the bricks. What is original is **the assembly**: take the dark pool
mechanism from M&A, remove the human intermediary using LLMs, and apply it not to selling a
business but to operational problems. Say it that way — it sounds honest and strong, whereas
"we invented private matching" sounds like not having read the market.

---

## 7. Verdict: continue or drop it

Two different questions with opposite answers.

### 7.1 For the hackathon — continue, unambiguously

Changing the idea hours before the deadline is a guaranteed loss. What already exists: a working
skeleton, market research with numbers, a sharp framing ("a dark pool for business problems"),
and a mechanism nobody has assembled this way.

The idea demos well — that is the hackathon criterion, not market size. Blind match, agent
negotiation, briefing: all visible on screen in two minutes.

### 7.2 As a standalone marketplace — poor odds

Honestly: **frequency and liquidity kill this model, not competitors and not technology.**

**Frequency.** A company has a problem worth hunting a vendor for 2–4 times a year. That is not
a habit; the product never enters daily use. Low frequency plus modest value per transaction is
the worst quadrant for a marketplace.

For comparison: Axial works on the same mechanism because a single M&A deal is a six- or
seven-figure sum. There it is worth filling in an anonymous form and waiting a month. Nobody
waits a month to solve a €3,000/month operational problem.

**Liquidity.** The marketplace data says most two-sided platforms die after launch, of lost
liquidity. Our refined mechanism makes cold start **worse**: people cannot browse, so the
platform has no pull at all. Arrive, fill a form, leave. If the other side is empty, they never
come back.

**Trust.** For the mechanism to work, a company must put its confidential problems into an
unknown startup's database. Axial spent years building that reputation. This is a second
chicken-and-egg problem that people usually forget.

**ARPU.** Payment per accepted meeting is right on incentives, but if a meeting is worth €50–200
and a company accepts three a year, that is €150–600 per customer per year. Volume is required;
volume requires liquidity; liquidity runs into frequency. The loop closes.

Odds of taking off as a standalone marketplace: **low.** Not because of the idea — because of the
distribution shape.

### 7.3 Where it does work — and it is the same code

**Stop being a marketplace. Become a layer on top of a pool that already exists.**

Cold start disappears if you sell not to two sides separately but to **one organisation that
already has both**:

| Who to sell to | Why they already have the pool |
|---|---|
| Chambers of commerce, industry associations | Hundreds of member companies paying dues and demanding value |
| Accelerators, incubators, Startup Estonia | A portfolio that needs introducing to itself |
| Trade fair and conference organisers | Exactly what they already buy from Brella and Grip |
| Banks with an SME customer base | They know who has what turnover and what problems |
| Enterprise Europe Network | 6,045 profiles sitting dead without matching |

This changes the model from "two-sided marketplace" (dies) to "B2B SaaS for an organisation that
owns both sides" (works). That is precisely how Brella, Grip and Swapcard are built — they sell
to organisers, not participants. It also explains why they have millions of meetings and
standalone platforms do not.

The code does not change at all. What changes is who gets the invoice.

**It is stronger for the pitch too:** answering "how will you get your first users" with "we sell
to one chamber of commerce with 400 member companies" is far more convincing than "we'll start
with one niche".

### 7.4 The cheapest way to find out instead of guessing

Before writing another line of code after the hackathon — **two days and ten conversations**:

Go to ten companies you know and ask them to write their current problem into an input field
right now, in front of you. Not "would you use this?" — everyone says yes. Actually write it,
here and now.

- **7+ out of 10 wrote something** — the privacy hypothesis holds, the product is worth building.
- **7+ refused, or wrote "we want to grow"** — the mechanism is dead regardless of code quality,
  and no technology fixes that.

Cheaper than any development, and it answers the one question that decides everything.

### 7.5 Bottom line

Do not drop it. But do not spend six months building a marketplace either.

1. Finish the hackathon build as is — the foundation is strong.
2. Then run the test in §7.4. It costs two days.
3. If it passes, go to organisations with a ready-made pool, not to a marketplace.

---

## 8. Sources

**Competitors**
- Xpylon — https://landing.xpylon.com/
- Bark.com, how it works — https://www.bark.com/en/gb/how-it-works/
- Sortlist vs Clutch, monetisation models — https://www.leadrpro.com/blog/clutch-co-vs-sortlist-a-comprehensive-look-at-b2b-platforms
- How a Bark-style lead marketplace is built — https://www.sharetribe.com/create/how-to-build-website-like-bark.com/
- Brella, matchmaking and 3M meetings — https://www.brella.io/event-matchmaking
- Grip, 16+ ML algorithms — https://youreventkit.com/tools/grip/
- Matchmaking software comparison — https://innoloft.com/en-us/blog/matchmaking-software
- Enterprise Europe Network, Partnering Opportunities — https://een.ec.europa.eu/partnering-opportunities
- Startup Intros, double opt-in — https://startupintros.com/
- Intent data market overview — https://www.onfire.ai/blog/top-b2b-intent-data-providers
- Axial, confidential deal origination — https://www.axial.net/
- Axial reviewed from the buy side — https://duedilio.com/axial-is-it-the-best-deal-sourcing-platform-for-small-business-buyers/
- Dealsuite, anonymised criteria and NDA tool — https://www.dealsuite.com/en/users/ma-advisory

**Market data**
- Gartner: 67% of buyers prefer rep-free (March 2026) — https://www.gartner.com/en/newsroom/press-releases/2026-03-09-gartner-sales-survey-finds-67-percent-of-b2b-buyers-prefer-a-rep-free-experience
- Gartner: 61% a year earlier — https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-sales-survey-finds-61-percent-of-b2b-buyers-prefer-a-rep-free-buying-experience
- 17% of time with vendors, 80% of the journey without a rep — https://brixongroup.com/en/the-modern-b2b-buying-journey-why-buyers-complete-80-of-their-journey-alone-and-how-you-can-still-remain-visible
- Cold email benchmark 2026, 5.1% → 3.43% — https://instantly.ai/cold-email-benchmark-report-2026
- Cold email statistics — https://snov.io/blog/cold-email-statistics/
- LinkedIn: moat, 1.2B members, $19.8B FY2026 — https://app.dealroom.co/news/note/linkedin-s-unshakeable-moat-network-effects-ai-slop-and-the-walled-garden
- LinkedIn statistics 2026 — https://axis-intelligence.com/linkedin-statistics/
- Sales Navigator, pricing and effect — https://www.joinvalley.co/blog/is-linkedin-sales-navigator-worth-it-in-2026-honest-review
- Xometry Q1 2026 results — https://investors.xometry.com/news-releases/news-release-details/xometry-reports-record-first-quarter-2026-results
- Xometry, numbers analysed — https://www.digitalcommerce360.com/article/xometry-marketplace-sales-revenue/

**Marketplace risk and mechanics**
- Why two-sided platforms die after launch — https://www.raftlabs.com/blog/two-sided-marketplace-failure-rate
- Cold-start playbook, first 100 users — https://techvinta.com/blog/marketplace-cold-start-playbook-first-100-users
- Why vendors don't bid on RFPs — https://eunasolutions.com/resources/why-vendors-arent-bidding-on-your-rfps-and-what-to-do-about-it/
- Marketplace fundraising in 2026 — https://www.gardinercolin.com/p/marketplace-startup-fundraising-2026

**Dark pools, agent-to-agent, regulation**
- Dark pools: mechanics and regulation — https://www.six-group.com/en/blog/dark-pools-explained.html
- Order matching in dark pools — https://devexperts.com/blog/order-matching-in-exchanges-and-dark-pools/
- Pactum, agentic negotiation in procurement — https://pactum.com/blog/understanding-agentic-ai-in-procurement-how-autonomous-ai-has-been-transforming-supplier-deals
- Walmart, Maersk, Vodafone: AI negotiators at scale — https://www.cfotech.com/blog/ai-agents-that-negotiate-vendor-contracts-autonomously/
- Deloitte, agentic commerce in B2B — https://www.deloitte.com/us/en/what-we-do/capabilities/applied-artificial-intelligence/articles/b2b-agentic-commerce.html
- Agent-to-agent commerce, stages and timing — https://salespeak.ai/blog/agent-to-agent-commerce/
- AI agents in B2B buying 2026 — https://elogic.co/blog/ai-agents-b2b-buying/
- A2A marketing: agents filter before the human — https://www.entrepreneur.com/science-technology/the-rise-of-a2a-agent-to-agent-marketing-how-to-get/504522
- Confidential computing and MPC landscape — https://www.edgeless.systems/blog/the-landscape-of-privacy-preserving-computing-ppc
- GDPR and cold email in the Baltics — https://balticleads.ee/gdpr-cold-email-guide-baltic
- Cold calling and emailing laws across Europe — https://www.leadfeeder.com/blog/sales-prospecting/cold-calling-illegal-ireland/

**History**
- Name your own price / buyer-driven commerce — https://en.wikipedia.org/wiki/Name_your_own_price
