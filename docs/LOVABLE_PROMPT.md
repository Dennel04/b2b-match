# Lovable prompt — the idea only

Copy everything between the two rules and paste it as the first message in Lovable.

This describes the product and the rules it has to obey. It deliberately says nothing about
layout, colour, typography or what screens exist — that is Lovable's job, and seeing how it
interprets the idea unprompted is the point of the exercise.

A version that does pin down the visual direction is in `DESIGN_BRIEF.md` §9, for later.

Do not connect this repo — Lovable cannot import an existing repository, and its stack is not
Next.js. Treat the result as a visual prototype we port by hand.

---

Design and build a clickable prototype of a product called **B2B Match**. Work out for yourself
what screens it needs and how it should look. Use hardcoded data throughout — no backend, no
database, no authentication, no API calls. Below is the idea and the rules it has to obey.

## The problem in the market

Business-to-business selling runs on cold outreach. Sellers buy lists and email thousands of
companies; reply rates have fallen to roughly three percent and keep falling. Buyers get buried
in pitches for things they don't need, and the one vendor who could genuinely help them is lost
somewhere in that noise. Meanwhile two thirds of business buyers now say they would rather
complete a purchase without talking to a salesperson at all.

Both sides are doing enormous work to find each other and mostly failing.

## The inversion

Instead of sellers hunting buyers, the buyer writes down the problem they actually have right
now — the real one, in their own words, with real numbers. The system then finds who can solve
it.

That sounds obvious, and it has been tried many times. It fails for one reason, and the whole
product is an answer to that reason.

## Why it normally fails, and the rule that follows

A company will not write down what is broken inside it.

Admitting a weakness in public means competitors learn about it, and it means being buried in
sales offers the moment you do. Publishing your need is expensive: it costs you your negotiating
position, and it costs you your inbox. So buyers stay quiet, vendors have nothing to respond to,
and the marketplace dies.

So the product is built on one rule, and everything else follows from it:

**No human at the other company ever reads the problem. Not before a match, not after one.**

## How that is possible

Two AI agents, one representing each company, talk to each other inside the platform.

The buyer's agent knows the problem and its job is to protect it. It reveals only as much as is
needed to test whether this vendor is real — the shape of the task, never the specifics, never
the numbers, never who the client is. The seller's agent answers substantively, says honestly
what it has and hasn't done before, and asks its own questions.

The humans are not in this conversation and do not know it is happening. They do not know the
other company exists.

Only if the agents conclude that the two companies should meet is anything surfaced to people at
all. Each side is then asked, separately, whether they are interested — the buyer sees an
anonymous vendor, the vendor sees an anonymous buyer. Identities are revealed to each other only
after both have said yes. Nobody can push their way to the other side of that gate.

After both consent, they meet, and the platform has already written the briefing: who each of
them is, what the ask is, what the agents already settled, and what is left for the humans to
decide.

## The analogy that explains it in one line

**This is a dark pool for business problems.**

On a stock exchange, an institution with a large order does not publish it. The intention itself
is worth money — the moment the market sees it, the price moves against them. So the order goes
into a dark pool, is matched internally against the other side, and becomes public only after it
has executed.

A company with a burning operational problem is in exactly that position. Saying out loud that
your warehouse operation is failing costs you your negotiating position with every vendor who
hears it, and buys you a hundred phone calls. So the intention stays dark, gets matched
internally, and surfaces only once it has found its counterparty.

## The rule about money, which is the same rule again

The buyer states the most they are willing to pay. The vendor states the least they will accept.

**Neither figure is ever shown to the other side, or anywhere in the product.**

The platform compares them internally and reports exactly one thing: the terms are compatible,
or they are not. Same for the contract shape — a paid pilot, fixed price, a monthly retainer,
time and materials, payment on outcome. Each side says what they will accept; the product shows
only what both accept, never either side's full position.

This is not a privacy setting that can be toggled. It is the product. If a number from one side
ever appears anywhere the other side can see it — in a summary, a tooltip, a chart, a
notification — the product has failed and there is no reason for anyone to use it.

The same applies to hard requirements: whether a vendor will sign a data protection agreement,
holds a security certification, keeps data inside the EU, works in the local language, can be on
site, has references in the buyer's industry. These are checked mechanically before any AI is
involved. A vendor who fails any of them never enters the conversation at all.

## Two stages, and why the rejections matter

Matching happens in two stages.

The first is mechanical and involves no AI: does this vendor's minimum fit under this buyer's
ceiling, are they available in time, is there any contract shape both sides accept, do they meet
every hard requirement. Anyone who fails is eliminated immediately.

The second stage reads the problem and judges whether the survivors can actually solve it.

The eliminations are as important to show as the matches. A vendor who understands the problem
perfectly and is still rejected — because their smallest engagement is above what the buyer can
pay, or because they will not sign the data agreement — is the most convincing evidence that the
system is thinking rather than agreeing. A product that only ever shows successes looks like it
is selling something.

## How it makes money

The vendor pays, and only when a buyer has accepted a meeting. Never for being shown, never for
a lead, never a subscription for access.

This matters because every competing product charges for exposure, which quietly rewards
spamming everyone. Here a rejection costs the platform nothing and earns the vendor nothing, so
there is no reason to chase a bad match.

## Who uses this

Ordinary small and mid-sized companies in Estonia. A forty-person freight forwarder. A
twelve-person software shop. An accounting firm. A logistics consultancy.

They are not traders, not enterprise procurement departments, not venture-backed startups. They
are careful about what they disclose, unmoved by dashboards full of metrics, and they will walk
away from anything that feels like a sales tool aimed at them. The person using it is often the
owner, doing this between two other jobs.

## A real case to build the prototype around

Use this throughout instead of placeholder text. Both companies are fictional but the situation
is ordinary.

**The buyer — Nordkai Logistics**, Tallinn, 40 people, freight forwarding.
What they wrote, in their own words, unedited:
"We're still doing customs paperwork by hand across three warehouses. It eats about 60 hours a
month between two people, and we've had two fines this year from filing errors. We tried a
freelancer last spring and it didn't stick."
They can pay up to €4,000 a month. They would consider a short paid pilot or a monthly retainer.
They must start before mid-November. They need a signed data protection agreement and support in
Estonian.

**The vendor — Rebase OÜ**, Tartu, 12 people, process automation for logistics companies. They
turn manual back-office work into software — customs and freight documentation, warehouse
reporting, and the handoffs between them. Their smallest engagement is €2,500 a month. They work
on retainer or time and materials. They are free from late September. They sign data protection
agreements, hold ISO 27001, and work in both English and Estonian.

**The vendors who don't make it**, for whatever you build to show rejections:
Meridian Systems, Tallinn, 80 people, enterprise process consulting — understands the problem
completely, but their smallest engagement is far above what Nordkai can pay.
Kadaka Digital, Pärnu, 6 people, web development and integrations — will not sign a data
protection agreement.
Vektor Consult, Tartu, 25 people, logistics consulting — clears every requirement, but they
advise on process rather than build software, so the manual work would still be there afterwards.

**What the vendor's agent was actually given about the problem** — this, and nothing more:
"A mid-sized logistics company needs help automating a manual back-office process across several
sites. They have tried an external contractor before without success."

Notice the distance between what Nordkai wrote and what Rebase received. Everything specific —
that it is customs, that there are three warehouses, the sixty hours, the two fines, the
freelancer — stayed on Nordkai's side and was never transmitted. That distance is the product.

## What I want from you

Decide what screens this product needs and design them. Think about where a person enters, what
they have to be persuaded of at each step, and what the hardest moment is — asking a company to
type its budget into a box is not a form field, it is a moment of trust that has to be earned on
screen.

Then build it as a working clickable prototype with this data hardcoded.

Make your own decisions about the visual language. The only thing I will say is that this
product lives or dies on whether a cautious forty-person company believes that what they write
will not reach anyone. Design something that earns that.
