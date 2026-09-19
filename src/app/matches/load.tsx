import { redirect } from "next/navigation";
import { getMatchView } from "@/actions/match";
import { initialsOf } from "@/components/layout";
import { currentUser, serverClient } from "@/lib/supabase";
import type { CompanyRole, MatchStatus, MatchView } from "@/types";
// ponytail: these three read a projected match the same way on both screens; they move to lib/
// the day the backend owner is free to take them.
import { firstSentence, openArea, splitVerbatim } from "../problems/load";
import { DEMO_MATCHES } from "./demo";
import { MatchesScreen, type MatchesScreenData } from "./MatchesScreen";

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
      name: selling
        ? (m.buyer.name ?? `A ${m.buyer.industry} company${m.buyer.size_hint ? `, ${m.buyer.size_hint}` : ""}`)
        : (m.seller.name ?? firstSentence(m.seller.summary)),
      place: m.reasoning_public,
    };
    const context = selling ? "They came to you" : m.problem_text ? splitVerbatim(m.problem_text)[0] : "";

    if (m.status === "declined" || m.negotiation?.envelope?.verdict === "reject") d.declined++;
    else if (m.status !== "proposed" || m.negotiation?.envelope?.verdict === "proceed")
      d.matched.push({ ...party, context, state: STATE[m.status][selling ? 1 : 0], yours: isYourMove(m), score: m.score });
    else d.awaiting.push({ ...party, context, area: openArea(m) });
  }

  return <MatchesScreen d={d} />;
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
