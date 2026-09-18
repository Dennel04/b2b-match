# How we get scored, where we stand, and what moves each score

The jury's criteria, verbatim, then an honest read of where the project is and the shortest
path to points. Written 18 September, evening. Update the scorecard as things land.

## The criteria (Main Track, rounds 1 & 2 — five criteria, 0–10 each, 50 max)

> **Execution:** "Does the demo work? How far did you get in 24 hours? A rough thing that runs
> beats a polished thing that doesn't."
>
> **Ideation:** "Is the idea original and thought through, or the first thing anyone would come
> up with?"
>
> **Design:** "Is it good to look at and good to use? Interaction, visuals, tone — whatever form
> your project takes."
>
> **Applicability:** "Does it solve a real problem for real people? Can you say who it is for?"
>
> **Presentation:** "Can you explain what it is and why it matters, without us having to guess?"

Read the Execution line twice. It describes our exact trap: `/preview` is the "polished thing
that doesn't run". The backend runs end to end and has been verified live; until a screen calls
it, the jury cannot see that.

## One decision that shapes everything: no backup video

**There is no backup video and there will not be one.** The whole pitch rests on the live demo —
on what actually works. That is the right bet for this jury (Execution is worth as much as
Ideation), and it has consequences we accept in full:

- The demo path is rehearsed on the real deployment, with the real database, at least three
  times before we go up, by the person who will drive it.
- Every screen on that path handles errors on screen. An uncaught exception is the Next.js
  overlay in front of the jury; there is no cut to a video.
- The seeded data is the stage. It is pre-generated (`npm run warm`) so it opens instantly, and
  we know in advance which pairs match, which pair the budget filter kills, and which one the
  agents reject.
- The live problem we type on stage is written down beforehand and has been run through the
  pipeline at least once, so we know what the filter and the agents will do with it.
- Nothing gets added to the demo path after it has passed a full rehearsal.

## Scorecard: now → reachable

| Criterion | Now | Reachable | What moves it |
|---|---|---|---|
| Execution | 4–5 | 8–9 | A match screen wired to the real pipeline; a problem entered live on stage |
| Ideation | 8–9 | 9 | Show the seller-agent prompt and the leak-guard story (§ levers, 3) |
| Design | 6 | 8 | Same wiring — "good to use" is judged on screens that do something |
| Applicability | 6 | 8 | Name the first customer; bring 3 real problems from real companies |
| Presentation | 7 | 8–9 | Three beats, two one-liners, three timed rehearsals |
| **Total** | **~32** | **~42** | Almost all of the difference is one screen |

## Levers, in order of points per hour

**1. The match screen, on the real backend.** "Find matches" → the match page with the
transcript appearing line by line → Interested / Accept → the briefing. Every call already
exists (`docs/FRONTEND.md`). If time runs out, this screen alone — onboarding and the
interview can be typed around. Worth up to +4 on Execution and +2 on Design; nothing else
counts until it is done.

**2. A problem entered live, on stage.** The one action that answers "is this staged?".
Pre-written text (not typed from memory), run through the pipeline beforehand, with the
progress of the negotiation visible round by round — a minute of visible work, not a spinner.
+1–2 Execution, +1 Presentation.

**3. Show the invisible.** Two slides only we have:
- the seller agent's prompt on screen: "this is everything the vendor's side receives — the
  problem is not in it" (`sellerTurnPrompt` in `src/prompts/negotiate.ts`);
- the guard story: "our first full run discarded 4 negotiations out of 7 because the buyer's
  agent reused the wording of the ask; we did not loosen the check, we rewrote the prompt."
This is what turns "privacy" from a claim into code. +1–2 Ideation.

**4. Name the customer and bring real problems.** Not "B2B companies" — "one chamber of
commerce or accelerator with 400 member companies; Estonian SMEs in one vertical first." Then
the cheapest validation there is (`docs/RESEARCH.md` §7.4): message people at 5–10 companies
tonight and ask them to write their current problem into a box, now. Three replies make a slide
— "we asked N Estonian companies, here is what they wrote" (anonymised) — that answers "would
anyone disclose a problem?" better than any research. +2 Applicability.

**5. Show a rejection.** A pair that fits perfectly on meaning and is killed by the budget
filter, and one negotiation where the agents said no. Both exist in the seeded data. A negative
result is more convincing than a positive one. +1 Ideation, +1 Presentation.

**6. The pitch in three beats, then rehearse.**
1. A company states a private problem — nobody sees it.
2. Two agents negotiate; the buyer's agent refuses to hand over exact figures — highlighted.
3. People meet with a briefing already written.

Open with *"a dark pool for business problems"*. Close with *"we don't show the numbers — we
show that the numbers match."* Prepared answers: `docs/RESEARCH.md` §2 (LinkedIn), §6.5
(where the privacy claim stops), §7 (is this a business). Three timed rehearsals. Never open
`/preview`. +2 Presentation.

**7. Only if everything above is done: onboarding with no typing.** Sign up with a work email,
the profile is already filled from the website (`draftCompanyProfile`). Impressive live, and
risky live — test the exact site the night before, never for the first time on stage.

## What not to do

- Polish design after the screens are wired. Rough and running beats polished and dead.
- Grow the seed "for variety". Ten problems and nine negotiations are enough to demo.
- Add anything to the demo path after midnight.
- Explain all five mechanisms (interview, filter, agents, opt-in, briefing) in the pitch. Three
  beats; the rest lives in the Q&A.

## Timeline that fits

- Tonight: lever 1, then 2. Lever 4 in parallel, by hand, by whoever is not coding.
- Morning: levers 3, 5, 6 — slides and rehearsals on the real deployment.
- Lever 7 only with everything else green.
