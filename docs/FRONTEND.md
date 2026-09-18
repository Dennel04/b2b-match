# Frontend handoff: what the backend gives you and how to call it

The backend is written, runs end to end against the live Supabase project and the DeepSeek
model, and is exercised by `npm run warm`. Nothing in `src/app/` calls it yet. This page is the
contract — everything below is verified, not planned.

## 1. The five calls that make the demo

All are Server Actions in `src/actions/`. Import them into a Server Component or call them from
a form action; never from a client component directly with fetch. All types are in `src/types.ts`.

| Call | Returns | Takes | Notes |
|---|---|---|---|
| `findMatches(problemId)` | `Match[]` | 7–25 s | Runs the mechanical filter, then the model scores the survivors. Inserts rows with `status: 'proposed'`. Returns `[]` when nothing passes — that is a valid result, show it ("nothing above threshold"), don't treat it as an error. |
| `negotiate(matchId)` | `Negotiation` = `{ lines, envelope }` | **45–80 s first time, instant after** | The 8-line agent transcript plus the `DealEnvelope`. Cached in the row; calling it again returns the stored result. Sets `status: 'declined'` if the agents' verdict is `reject`. **Stores each line as it is produced** — poll `getMatchView` meanwhile to show progress (§3). Throws "already running" if called twice. |
| `getMatchView(matchId)` | `MatchView` | instant | **The one read path for a match screen.** Projected for the current viewer — see §3. |
| `setMatchStatus(matchId, action)` | `Match` | instant | `action` is `'interested' \| 'accept' \| 'decline'`. Enforces the order (§4); throws on an illegal move. |
| `generateBrief(matchId)` | `string` (markdown) | ~10 s first time | Only for `status === 'accepted'`; throws otherwise. Cached in `brief_md`. |

Onboarding calls, same rules: `draftCompanyProfile(website?)` → `CompanyDraft` (§2a),
`saveCompany(input)` (create or update the signed-in user's company), `runInterview(turns, company?)`
→ `{ done, follow_up, summary, urgency, terms }` (one turn ≈ 3–5 s; loop until `done`; pass the
company's `profile_json` so the questions skip what it already answers), `saveProblem(input)` → `Problem`.

## 2a. Onboarding with (almost) no typing — how to build that page

The goal: a person signs up and **sees their company already filled in**, then confirms.

1. Right after sign-up, call `draftCompanyProfile()` with no argument — it reads the website
   behind the user's email domain (`anna@nordkai.ee` → `https://nordkai.ee`). Takes 10–20 s;
   show "Reading your website…" with the pages it is trying, not a bare spinner. Offer a
   "My site is elsewhere" field that calls `draftCompanyProfile('https://…')` instead.
2. It returns a `CompanyDraft`: `profile` (name, industry, size, services, keywords, summary),
   `role` guess, `seller_terms.capabilities` with one `evidence` string per capability, and
   `pages_read`. Render it as a **pre-filled form**, headed "Here is what we read on your site —
   correct anything that's wrong". Capabilities are checkboxes, pre-ticked, each with its
   evidence as help text ("ISO 27001 — from /about"). Unticking is one click.
3. Personal mailbox (gmail etc.) or a site that cannot be read → the call throws with a plain
   message. Catch it and show the same form empty, with the message as a hint. Never block.
4. Submit → `saveCompany({ name, website, role, profile_json, seller_terms })`. Done.

**Do not ask for money, contract formats or availability on this page.** The draft leaves
`budget_floor`, `contract_formats` and `available_from` empty on purpose, and the matching
filter treats empty as "unknown — don't filter", so a vendor with nothing but a website already
takes part in matching. Ask for those *lazily*, at the moment they matter: when a match shows
`compatibility.budget === 'unknown'` or `contract_formats` is empty, show one inline prompt on
that match ("Set your minimum deal size to be considered") that saves through `saveCompany`.
One field in context beats ten fields up front.

## 2. The screens, and which call feeds each

1. **Problems list** — the signed-in user's problems, each with a "Find matches" button →
   `findMatches`. Read the list with `serverClient().from('problems').select('*, companies(name)')`
   (RLS returns only your own).
2. **Matches for a problem** — `from('matches').select('id, score, status, deal_envelope_json')
   .eq('problem_id', id)`. Show score and status. **Do not show the other company's name here** —
   it is anonymous until accepted, and after migration 0002 the embed returns `null` anyway.
3. **Match page** — `getMatchView(id)`. The centrepiece: the transcript, the outcome, the buttons.
   This is the screen `src/app/preview/page.tsx` mocks up; the real data has the same shape.
4. **Briefing** — `generateBrief(id)` once accepted; render the markdown (five fixed `##` sections,
   under 300 words — a hand-rolled renderer is fine, no new dependency).

## 3. `MatchView`: what the current viewer is allowed to see

```ts
{
  id, status, score, reasoning_public,
  viewer: 'buyer' | 'seller' | 'both',      // 'both' on the demo account, which owns every company
  buyer:  { name: string | null, industry, size_hint },   // name only for the buyer, or once accepted
  seller: { name: string | null, summary },               // name only for the seller, or once accepted
  problem_text: string | null,               // the buyer's own text; null on the seller's side
  compatibility: Compatibility | null,       // budget/timeline 'ok' | 'gap' | 'unknown' — never amounts
  negotiation: { lines, envelope: DealEnvelope | null } | null,  // lines grow while running; envelope arrives last
  negotiating: boolean,                      // true while negotiate() is running for this match
  brief_md: string | null,                   // only when accepted
}
```

**Live progress.** Start `negotiate(id)` from a button action (it resolves when the whole thing
is done). While it runs, poll `getMatchView(id)` every 2–3 s — a `useEffect` with `setInterval`
calling a tiny server action, or `router.refresh()` on a timer. Render `negotiation.lines` as
they arrive; "round N of 4" is `Math.ceil(lines.length / 2)`; stop polling when `negotiating`
is `false`. `envelope` is `null` until the last call, then the outcome appears. A seller line can
never leak (that agent never has the problem), and buyer lines are checked before they are
stored, so showing the partial transcript live is safe.

The projection is done server-side on purpose. Render what you are given; never query `matches`
or `problems` from a component and decide yourself what to hide.

**`lines[i].withheld`** — `true` on the buyer-agent line where it kept an exact figure back
("…exact numbers stay with my client until a meeting is agreed"). Highlight it; it is the moment
the whole pitch is about. It comes from the pipeline — do not hardcode it as the mockup does.

The mockup's "sealed" spans inside the problem text are not produced by the backend. Show the
problem as plain text on the buyer's side, and `reasoning_public` as "what the vendor received".

## 4. Double opt-in — buttons per state

```
proposed ──(buyer: 'interested')──▶ buyer_interested ──(seller: 'accept')──▶ accepted
    │                                      │
    └────────── either side: 'decline' ────┴──────────────────────────────▶ declined
```

Which buttons to show, from `view.viewer` and `view.status`:

| status | buyer sees | seller sees |
|---|---|---|
| `proposed`, no `negotiation` | "Run the negotiation" (→ `negotiate`) | same |
| `proposed`, verdict `proceed` | **Interested** / Not this one | waiting for the buyer |
| `buyer_interested` | waiting for the vendor | **Accept meeting** / Decline |
| `accepted` | briefing (→ `generateBrief`) | briefing |
| `declined` | closed | closed |

`viewer: 'both'` (the demo account) shows both columns. The server rejects anything else, so a
wrong button is a confusing error, not a security hole — but don't rely on that.

## 5. Latency and errors — the two things that will bite on stage

- **Never call `negotiate`, `findMatches` or `generateBrief` during page render.** They take
  seconds to a minute; a page that awaits them hangs with a blank screen. Call them from a form
  action on a button, show a pending state (`useFormStatus` / `useTransition`), then
  `revalidatePath` or `redirect`. `getMatchView` is the only match call safe to await in render.
- Every action throws a plain `Error` with a readable message (model refused, output cut off,
  illegal status move, not a party to this match). Catch it in the action wrapper and surface the
  message; an uncaught throw is the Next.js error overlay in front of the judges.
- A negotiation that leaks the problem text is **discarded on purpose** (`findLeaks` in
  `src/lib/leak.ts`) and `negotiate` throws. Rare after the per-line regeneration, but handle it:
  "The agents' transcript failed the privacy check — run it again."
- For the demo, `npm run warm` has already generated the negotiations for the seeded problems, so
  those open instantly. A problem entered live on stage runs for real — plan ~1 minute of visible
  progress for it, not a spinner.

## 6. Running it locally

- `.env.local` — ask for it; it holds the Supabase keys, the DeepSeek key and
  `ANTHROPIC_BASE_URL` (the model provider is a deployment setting, see `.env.example`).
- Migrations: `0001` is applied; **`0002_privacy_fixes.sql` and `0003_negotiation_progress.sql`
  must be run in the Supabase SQL Editor**, in that order. Until 0002, any signed-in user can
  read vendors' `seller_terms`; until 0003, `negotiate()` fails on a missing column.
- Demo account: the user that owns all seeded companies (the one in `SEED_OWNER_ID`). Sign in as
  it and you see every problem and every match with `viewer: 'both'`. Any other account sees
  only its own rows.
- `npm run check` before every push (route typegen + tsc + the two self-checks).

## 7. Rules that apply to screens (from CLAUDE.md)

- `adminClient()` never in a component. Server Actions only.
- All copy in English.
- The problem text goes to its owner only. If you ever find yourself with it on the seller's
  screen, the bug is in how you fetched it — use `getMatchView`.
