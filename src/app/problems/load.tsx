import { notFound, redirect } from "next/navigation";
import { getMatchView } from "@/actions/match";
import { AppShell, initialsOf } from "@/components/layout";
import { serverClient } from "@/lib/supabase";
import type { BuyerTerms, MatchView } from "@/types";
import { FORMATS } from "../onboarding/fields";
import { DEMO } from "./demo";
import { ProblemScreen, type ProblemScreenData } from "./ProblemScreen";

/**
 * Renders the problem screen for the signed-in company. `problemId` omitted means its latest
 * problem. Matches are read only through getMatchView(), which projects them per viewer.
 */
export async function renderProblemScreen({ problemId, demo }: { problemId?: string; demo?: boolean }) {
  if (demo) return <ProblemScreen d={DEMO} />;

  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await db.from("companies").select("id, name").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) redirect("/onboarding");

  // RLS limits problems to their owner, so another company's id simply finds nothing.
  let query = db.from("problems").select("id, text, buyer_terms").eq("company_id", company.id);
  query = problemId ? query.eq("id", problemId) : query.order("created_at", { ascending: false }).limit(1);
  const { data: problem } = await query.maybeSingle();

  if (!problem) {
    if (problemId) notFound();
    return (
      <AppShell active="problems" initials={initialsOf(company.name)} bar={<span className="text-[14px] font-semibold">Problems</span>}>
        <main />
      </AppShell>
    );
  }

  const { data: ids } = await db.from("matches").select("id").eq("problem_id", problem.id);
  const views = await Promise.all((ids ?? []).map((r) => getMatchView(r.id)));
  const [title, summary] = splitVerbatim(problem.text);

  const d: ProblemScreenData = {
    caseRef: `PRB-${problem.id.slice(0, 4)}`,
    status: "Matching",
    initials: initialsOf(company.name),
    offers: 0,
    title,
    summary,
    terms: termChips(problem.buyer_terms),
    matched: [],
    awaiting: [],
    declined: 0,
  };

  for (const m of views) {
    // Anonymous until both sides accept: getMatchView() leaves the name null before that.
    const party = { id: m.id, name: m.seller.name ?? firstSentence(m.seller.summary), place: m.reasoning_public };
    if (m.status === "declined" || m.negotiation?.envelope?.verdict === "reject") d.declined++;
    else if (m.status !== "proposed" || m.negotiation?.envelope?.verdict === "proceed")
      d.matched.push({ ...party, state: STATE[m.status], ready: m.status === "proposed", score: m.score });
    else d.awaiting.push({ ...party, area: openArea(m) });
  }
  d.matched.sort((a, b) => b.score - a.score);

  return <ProblemScreen d={d} />;
}

const STATE: Record<MatchView["status"], string> = {
  proposed: "Ready to meet",
  buyer_interested: "Still talking",
  accepted: "Meeting confirmed",
  declined: "Declined",
};

/** The area still open, never a figure. */
function openArea(m: MatchView) {
  if (m.compatibility?.budget !== "ok") return "Price";
  if (m.compatibility?.timeline !== "ok") return "Deadline";
  return "Contract format";
}

/** The owner's own terms, in their own figures, in the reference screen's short form. */
function termChips(t: BuyerTerms | null) {
  if (!t) return [];
  const chips: string[] = [];
  if (t.budget_ceiling) {
    const per = t.budget_ceiling.period === "monthly" ? " / month" : " / project";
    chips.push(`Ceiling €${t.budget_ceiling.amount.toLocaleString("en-US")}${per}`);
  }
  if (t.start_by) {
    chips.push(`Start by ${new Date(t.start_by).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`);
  }
  if (t.contract_formats.length) {
    chips.push(t.contract_formats.map((f) => FORMATS.find((x) => x.value === f)?.label ?? f).join(" or "));
  }
  return chips;
}

/** First sentence as the heading, the rest below it, without rewording. */
function splitVerbatim(text: string): [string, string] {
  const t = text.trim();
  const end = t.search(/[.!?](\s|$)/);
  if (end < 0 || end > 110) return [t, ""];
  return [t.slice(0, end + 1), t.slice(end + 1).trim()];
}

function firstSentence(s: string) {
  const end = s.search(/[.!?](\s|$)/);
  return end < 0 ? s : s.slice(0, end);
}
