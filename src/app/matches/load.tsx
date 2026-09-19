import { notFound, redirect } from "next/navigation";
import { getMatchView, unseenMatchCount } from "@/actions/match";
import { initialsOf } from "@/components/layout";
import { FORMAT_LABELS } from "@/lib/overlap";
import { currentUser, serverClient } from "@/lib/supabase";
import type { CompanyRole, MatchStatus, MatchView, SellerTerms } from "@/types";
// ponytail: these three read a projected match the same way on both screens; they move to lib/
// the day the backend owner is free to take them.
import { anonymousName, firstSentence, openArea, splitVerbatim } from "../problems/load";
import { DEMO_MATCHES } from "./demo";
import { MarkSeen } from "./MarkSeen";
import { MatchesScreen, type MatchesScreenData } from "./MatchesScreen";
import { MatchScreen } from "./MatchScreen";

/**
 * Every match the company is a party to, either side. RLS (`matches_participant`) already limits
 * the rows to matches it belongs to, and getMatchView() decides per row what this viewer may see
 * — so nothing here projects a match field itself.
 */
export async function renderMatchesList({ demo }: { demo?: boolean }) {
  if (demo) return <MatchesScreen d={DEMO_MATCHES} demo />;

  const db = await serverClient();
  const user = await currentUser();
  if (!user) redirect("/login");

  const { data: company } = await db.from("companies").select("id, name, role").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) redirect("/onboarding");

  const { data: ids } = await db.from("matches").select("id").order("created_at", { ascending: false });
  const views = await Promise.all((ids ?? []).map((r) => getMatchView(r.id)));

  // The problem title is only ever read off the viewer's own problem_text, which getMatchView()
  // leaves null for the selling side. A seller row therefore cannot carry one.
  const d: MatchesScreenData = {
    initials: initialsOf(company.name),
    // Counted before the rows below are marked as read, so the screen you arrive on still
    // shows what was new when you arrived.
    unseen: await unseenMatchCount(),
    role: company.role as CompanyRole,
    matched: [],
    awaiting: [],
    declined: 0,
  };

  for (const m of views) {
    const selling = m.viewer === "seller";
    const party = {
      id: m.id,
      // Anonymous until both sides accept: getMatchView() leaves the name null before that.
      name: selling ? (m.buyer.name ?? anonymousName(m.buyer)) : (m.seller.name ?? anonymousName(m.seller)),
      // The reason, not the reasoning: a row is read in a glance, the match screen is read.
      place: firstSentence(m.reasoning_public),
      logo: selling ? m.buyer.logo : m.seller.logo,
      anon: selling ? !m.buyer.name : !m.seller.name,
    };
    const context = selling ? "They came to you" : m.problem_text ? splitVerbatim(m.problem_text)[0] : "";

    if (m.status === "declined" || m.negotiation?.envelope?.verdict === "reject") d.declined++;
    else if (m.status !== "proposed" || m.negotiation?.envelope?.verdict === "proceed")
      d.matched.push({ ...party, context, state: STATE[m.status][selling ? 1 : 0], yours: isYourMove(m), score: m.score });
    else d.awaiting.push({ ...party, context, area: openArea(m) });
  }

  return (
    <>
      <MatchesScreen d={d} />
      <MarkSeen ids={views.map((m) => m.id)} />
    </>
  );
}

/** One name per state, read from the viewer's own side: [buyer, seller]. */
const STATE: Record<MatchStatus, [buyer: string, seller: string]> = {
  proposed: ["Ready to meet", "Waiting on the buyer"],
  buyer_interested: ["Interest sent", "Interest received"],
  accepted: ["Meeting confirmed", "Meeting confirmed"],
  declined: ["Declined", "Declined"],
};

/** The double opt-in in one line: the buyer signals first, the seller answers. */
function isYourMove(m: MatchView) {
  return m.viewer === "seller" ? m.status === "buyer_interested" : m.status === "proposed";
}

/**
 * One match. Everything a component may show is decided in getMatchView(): the problem text
 * reaches only its owner, names only once both sides accepted, terms only as compatibility.
 */
export async function renderMatchScreen(matchId: string) {
  const db = await serverClient();
  const user = await currentUser();
  if (!user) redirect("/login");

  const { data: company } = await db.from("companies").select("id, name").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) redirect("/onboarding");

  let m: MatchView;
  try {
    m = await getMatchView(matchId);
  } catch {
    notFound();
  }

  const selling = m.viewer === "seller";
  const counterparty = selling ? (m.buyer.name ?? anonymousName(m.buyer)) : (m.seller.name ?? anonymousName(m.seller));

  // The viewer's own terms, in their own figures. The other side's never reach this screen.
  const { data: own } = selling
    ? await db.from("services").select("terms").eq("company_id", company.id).limit(1).maybeSingle()
    : { data: null };

  return (
    <>
      <MatchScreen
        d={{
          m,
          initials: initialsOf(company.name),
          matches: await unseenMatchCount(),
          counterparty,
          problemTitle: m.problem_text ? splitVerbatim(m.problem_text)[0] : null,
          logo: selling ? m.buyer.logo : m.seller.logo,
          anon: selling ? !m.buyer.name : !m.seller.name,
          // ponytail: only the selling side shows its own figures here; the buyer reads theirs
          // on the problem screen, where the ceiling lives.
          terms: selling ? sellerChips(own?.terms ?? null) : [],
          formats: (m.compatibility?.contract_formats ?? []).map((f) => FORMAT_LABELS[f]),
        }}
      />
      <MarkSeen ids={[m.id]} />
    </>
  );
}

function sellerChips(t: SellerTerms | null) {
  if (!t) return [];
  const chips: string[] = [];
  if (t.budget_floor) {
    const per = t.budget_floor.period === "monthly" ? " / month" : " / project";
    chips.push(`From €${t.budget_floor.amount.toLocaleString("en-US")}${per}`);
  }
  if (t.available_from) chips.push(`Free from ${t.available_from}`);
  return chips;
}
