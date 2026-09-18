# B2B Match — "connect the problem to the solution, without the spam"

Hackathon 18–19 September 2026, Business track. Goal: **a working MVP in 24 hours**, not a
pitch about the future.

---

## 1. The idea in one paragraph

Companies fill in a profile: what they sell, and — **privately** — what problems they have
right now. Under the hood the system matches one company's problem to another's solution.
Two AI agents negotiate on their owners' behalf; neither human sees the other side's data.
Only once the agents agree do both sides confirm interest, and only then are people
introduced, with a briefing already written. Cold outreach becomes unnecessary: the seller
does not write a thousand emails, the buyer does not read a thousand emails.

---

## 2. Honest critique

> Market research, competitors, numbers and ready answers for the judges are in
> [`docs/RESEARCH.md`](docs/RESEARCH.md). Short version: as a category the idea is not
> original (Xpylon, Bark, Sortlist, Brella, Axial, EEN). What is defensible is the mechanism:
> the problem is never disclosed, payment is per accepted meeting, and matching runs on
> unstructured text.

### What's strong
- **The pain is real.** Cold email reply rates fell from 5.1% in 2024 to 3.43% in 2026.
  A judge gets this in ten seconds.
- **The model is inverted.** Today the seller hunts blind. Here the buyer states the need.
  Declared intent is the most valuable data in sales.
- **It demos well.** A blind match, an agent negotiation, a briefing — all visible in two minutes.

### Where it's weak (the judges will ask exactly this)

**1. Why would a buyer disclose a problem at all?**
→ Blind matching and **double opt-in**. The seller never sees the problem text — only a
category-level explanation generated with quoting forbidden. The buyer controls the flow.

**2. Chicken and egg / cold start.**
→ Seed 15–20 plausible companies. In the pitch, name one community or niche, not "every
company in Europe". And note that most marketplaces die of lost liquidity *after* launch,
not before.

**3. Quality of self-described problems.**
→ An AI interview at onboarding: instead of an empty text box, five targeted questions that
also capture the commercial envelope. This is a strong demo feature in its own right.

**4. Seller incentives.**
→ The seller pays, and only **for an accepted meeting** — never for exposure. Spamming becomes
economically pointless. This is the single thing that separates us from Bark and Sortlist.

**5. Competitors.**
→ LinkedIn Sales Navigator, Apollo, Clay find leads for sellers. Brella and Grip do consented
matchmaking at events. Axial and Dealsuite do blind matching in M&A. Our line: *they help the
seller find a target faster; we give the buyer control, so only relevant people ever write.*

**6. Hackathon risk: too broad.**
→ You cannot build "an alternative to LinkedIn" in 24 hours. You can build one end-to-end path
that works perfectly.

### Verdict
A good hackathon idea on one condition: **privacy and double opt-in are the core of the
product, not a detail**, and that has to be visible in the demo. Without it the judges will
say "this is just another spam channel".

---

## 3. What we build in 24 hours

### The demo path
1. Company A (seller) registers, fills in its service profile and its **working terms**:
   minimum deal size, contract formats, the date it is free from, what it meets (DPA, ISO,
   language).
2. Company B (buyer) goes through an AI interview: what hurts, **budget ceiling**, which
   contract formats it will consider, when it must start, hard requirements. All of it marked
   "visible to the system only".
3. "Find matches" runs two stages: a **mechanical terms check** filters out anyone incompatible
   on money, timing, format or requirements — neither side sees the other's figures — then
   **Claude scores only the survivors**.
4. **The core:** the buyer's agent and the seller's agent negotiate. No human is in the loop and
   neither yet knows the other exists. The seller's agent is a separate model call that is never
   handed the problem text — it knows only what the buyer's agent says out loud. The buyer's
   agent flags each turn where it refused to reveal a specific (`withheld`); the agents converge
   on a contract format and record what is left for the humans.
5. Only after a `proceed` verdict does the buyer see an anonymous match → "Interested".
   The seller is notified → "Accept".
6. A **briefing** is generated: who's who, the ask, what the agents settled, what's left for the
   humans, three opening questions.

### Must have
- Auth
- Company profile (entered by hand) and seller working terms
- Private problems, AI interview that captures the commercial envelope
- Mechanical terms check: budget, timing, contract format, requirements
- Matching with a score and an explanation
- **Agent negotiation and deal envelope** — this is the product, not decoration
- Double opt-in (match statuses)
- Meeting briefing
- 15–20 seeded companies, including 2 pairs that are filtered out mechanically

### If there's time
- A weekly cap on offers shown to a buyer
- Document upload into the profile (PDF, Notion pasted as text)
- Calendar export
- Streaming the agent negotiation live on screen

### Explicitly not doing
- **Website scraping** — cut; the profile is typed in 30 seconds
- OAuth integrations with Notion/Slack/CRM — a roadmap slide only
- Payments, human-to-human chat, mobile app, admin panel, email campaigns

---

## 4. Technical architecture

**Stack:** Next.js (App Router) + Supabase (auth, Postgres, RLS) + Claude API + Vercel.

### How matching works (three stages)

**Stage 1 — mechanical check, no AI and no cost.** The buyer states a ceiling, the seller a
floor. Neither human sees the other's number: `checkCompatibility()` compares them server-side
and emits only "fits / does not fit". Same for dates, contract formats (set intersection) and
requirements (DPA, ISO 27001, language). Fail here and the model is never called.

This is a direct analogy to a dark pool: orders are not published, the engine crosses them
internally. See `docs/RESEARCH.md` §6.

**Stage 2 — Claude scores only the survivors.** The problem text plus the surviving profiles
go out in one request: "score each 0-100, explain in two sentences, return JSON." Above 70 we
store a match.

**Stage 3 — the agents negotiate, in isolation.** Four rounds, and each round is **two separate
model calls**. The buyer's agent gets the problem, the dealbreakers and the transcript so far.
The seller's agent gets its own profile and the transcript — `sellerTurnPrompt()` in
`src/prompts/negotiate.ts` has no problem-text argument, which is what makes "the vendor never
saw your problem" a property of the code. Both agents know the stage-1 result, never the figures.

After the last round a deterministic leak guard (`src/lib/leak.ts`) checks the transcript for
phrases and specific figures from the problem; a transcript that fails is discarded, never
stored. A third call — which also never sees the problem — reads the transcript and returns the
`DealEnvelope`: verdict, agreed contract format (must be in the stage-1 intersection), open
questions for the humans, confidence. `budget_compatible` and `earliest_start` are copied from
stage 1, not asked of the model.

In the pitch: "at scale we replace stage 2 with embeddings plus LLM reranking." Stage 1 does
not change — it is already O(n) and free.

### Privacy in the database
The problems table is protected by RLS (row-level security — rules in the database itself
deciding who may read which row): the owner sees their own problems, nobody else ever does.
Matching runs server-side with the service role key. The seller receives only the explanation
the model wrote **without** quoting the problem.

Migration `0002` closes the two gaps 0001 left: a company row is readable by its owner only (the
old policy exposed `seller_terms`, i.e. the vendor's price floor, to every signed-in user), and
clients can no longer write `matches` at all — status moves only through `setMatchStatus()`,
which enforces the double opt-in order. Screens read a match through `getMatchView()`, which
projects by role: the problem text goes to its owner only, names appear only once accepted.

### Schema (draft)
```
companies   id, owner_id, name, website, role ('seller'|'buyer'|'both'),
            profile_json, seller_terms, created_at
problems    id, company_id, text, interview_json, buyer_terms, urgency, created_at  -- RLS: owner only
matches     id, buyer_company_id, seller_company_id, problem_id, score,
            reasoning_public, compatibility_json, agent_dialogue_json,
            deal_envelope_json, status, brief_md, created_at
```

### Server function contract
```ts
saveCompany(input): Promise<Company>
runInterview(turns: InterviewTurn[]): Promise<{ done, follow_up, summary, urgency, terms }>
saveProblem(input: ProblemInput): Promise<Problem>
checkCompatibility(buyer: BuyerTerms, seller: SellerTerms): Compatibility  // pure, no AI
findMatches(problemId: string): Promise<Match[]>                          // terms check → Claude
negotiate(matchId: string): Promise<Negotiation>                          // 2 calls/round, leak-checked, cached
setMatchStatus(matchId, action: 'interested'|'accept'|'decline'): Promise<Match>  // enforces the opt-in order
generateBrief(matchId: string): Promise<string /* markdown */>            // accepted matches only
getMatchView(matchId: string): Promise<MatchView>                         // what THIS viewer may see
```
All types live in `src/types.ts`. It is the single source of truth: the frontend builds
against fake objects of that shape without waiting for the backend.

---

## 5. Roles

| Role | Owns |
|---|---|
| **Backend / AI** | Supabase schema, RLS, prompts, terms check, matching, negotiation, briefing |
| **Frontend** | Onboarding, profile, AI interview, match screen, negotiation transcript, briefing |
| **Product / demo / pitch** | Seed data, demo script, slides, answers for the judges, testing |

If there are two of you, split the third role — but start the seed data **immediately**,
it blocks the demo.

---

## 6. Timeline

| Time | What |
|---|---|
| 0:00–1:00 | Agree the schema, `types.ts`, demo path. Repo created, `CLAUDE.md` in place, everyone added as a collaborator |
| 1:00–2:00 | Empty Next.js deployed to Vercel, Supabase connected, auth working |
| 2:00–8:00 | In parallel: profile and working terms / onboarding UI / seed data |
| 8:00–13:00 | Problems, AI interview with the commercial envelope, `checkCompatibility`, matching |
| 13:00–17:00 | **Agent negotiation** and the transcript screen, double opt-in |
| 17:00–19:00 | Briefing, wiring the end-to-end path together |
| 19:00–22:00 | **Feature freeze.** Bugs only, polish the demo path, write the pitch |
| 22:00–24:00 | Rehearse the demo 3+ times, record a backup video in case the network dies |

---

## 7. Working rules

- `main` always works and is always deployed. Merge small, every 1–2 hours.
- Everyone stays in their own folders. See `TEAM.md`.
- Schema and `types.ts` change only after telling everyone.
- Prompts live in `src/prompts/`, one file per task — easy to edit without digging through code.
- Only change the terms comparison (`src/lib/overlap.ts`) or the leak guard (`src/lib/leak.ts`)
  together with `npm run check` — both have self-checks that run there.
- For the demo, AI responses are cached in the database so nothing hangs on stage.

---

## 8. What matters most in the demo

1. **Lead with privacy, not matching.** Show two screens side by side: what the buyer sees,
   what the seller sees. Without that contrast a match looks like ordinary search.
2. **Highlight the refusal.** In the transcript, mark the line where the buyer's agent declined
   to reveal a detail. Not "they had a nice chat" — "here it protected its client". The pipeline
   flags these lines itself (`withheld: true` on `AgentDialogueLine`) — render the flag, do not
   hardcode the moment.
3. **Show a rejected match.** A pair that fits perfectly on meaning, killed by the budget
   filter. A negative result is more convincing than a positive one.
4. **Say the line out loud:** *"We don't show the numbers. We show that the numbers match."*
