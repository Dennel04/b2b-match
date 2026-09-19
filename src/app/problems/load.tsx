import { notFound, redirect } from "next/navigation";
import { getMatchView } from "@/actions/match";
import { initialsOf } from "@/components/layout";
import { currentUser, serverClient } from "@/lib/supabase";
import type { BuyerTerms, MatchView } from "@/types";
import { FORMATS } from "../onboarding/fields";
import { DEMO, DEMO_LIST } from "./demo";
import { ProblemScreen, type ProblemScreenData } from "./ProblemScreen";
import { ProblemsScreen, type ProblemRow, type ProblemsFilter } from "./ProblemsScreen";

/**
 * Renders the problem screen for the signed-in company. `problemId` omitted means its latest
 * problem. Matches are read only through getMatchView(), which projects them per viewer.
 */
export async function renderProblemScreen({ problemId, demo }: { problemId?: string; demo?: boolean }) {
  if (demo) return <ProblemScreen d={DEMO} demo />;

  const db = await serverClient();
  const user = await currentUser();
  if (!user) redirect("/login");

  const { data: company } = await db.from("companies").select("id, name, website, role, profile_json, seller_terms").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) redirect("/onboarding");

  // RLS limits problems to their owner, so another company's id simply finds nothing.
  let query = db.from("problems").select("id, text, buyer_terms").eq("company_id", company.id);
  query = problemId ? query.eq("id", problemId) : query.order("created_at", { ascending: false }).limit(1);
  const { data: problem } = await query.maybeSingle();

  if (!problem) notFound();

  const { data: ids } = await db.from("matches").select("id").eq("problem_id", problem.id);
  const views = await Promise.all((ids ?? []).map((r) => getMatchView(r.id)));
  const [title, summary] = splitVerbatim(problem.text);

  const d: ProblemScreenData = {
    caseRef: `PRB-${problem.id.slice(0, 4)}`,
    status: "Matching",
    initials: initialsOf(company.name),
    matches: 0,
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
export function openArea(m: MatchView) {
  if (m.compatibility?.budget !== "ok") return "Price";
  if (m.compatibility?.timeline !== "ok") return "Start date";
  return "Contract format";
}

/** The owner's own terms, in their own figures, in the reference screen's short form. */
function termChips(t: BuyerTerms | null) {
  if (!t) return [];
  const chips: string[] = [];
  if (t.budget_ceiling) {
    const per = t.budget_ceiling.period === "monthly" ? " / month" : " / project";
    chips.push(`Up to €${t.budget_ceiling.amount.toLocaleString("en-US")}${per}`);
  }
  if (t.start_by) {
    chips.push(`Start by ${new Date(t.start_by).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`);
  }
  if (t.contract_formats.length) {
    chips.push(t.contract_formats.map((f) => FORMATS.find((x) => x.value === f)?.label ?? f).join(" or "));
  }
  return chips;
}

/** The first line is the heading when there is one; otherwise the first sentence. Never reworded. */
export function splitVerbatim(text: string): [string, string] {
  const t = text.trim();
  const br = t.indexOf("\n");
  if (br > 0 && br <= 110) return [t.slice(0, br).trim(), t.slice(br).trim()];
  const end = t.search(/[.!?](\s|$)/);
  if (end < 0 || end > 110) return [t, ""];
  return [t.slice(0, end + 1), t.slice(end + 1).trim()];
}

export function firstSentence(s: string) {
  const end = s.search(/[.!?](\s|$)/);
  return end < 0 ? s : s.slice(0, end);
}

/**
 * The company's problems as a list. Filters come from the URL, so the screen stays a Server
 * Component; matches are counted through getMatchView(), never by projecting `matches` here.
 */
export async function renderProblemsList(f: ProblemsFilter) {
  if (f.demo) return <ProblemsScreen d={DEMO_LIST} f={f} />;

  const db = await serverClient();
  const user = await currentUser();
  if (!user) redirect("/login");

  const { data: company } = await db.from("companies").select("id, name, website, role, profile_json, seller_terms").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) redirect("/onboarding");

  const { data: problems } = await db
    .from("problems")
    .select("id, text, department, buyer_terms, created_at")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  // One query for the matches of every problem, then every view at once. Asking per problem
  // inside the loop made the page cost one round trip per row, in series. `problem_id` is read
  // only to group the ids; every field the screen shows still comes from getMatchView().
  const list = problems ?? [];
  const { data: ids } = list.length
    ? await db.from("matches").select("id, problem_id").in("problem_id", list.map((p) => p.id))
    : { data: [] };
  const views = await Promise.all((ids ?? []).map(async (r) => [r.problem_id as string, await getMatchView(r.id)] as const));
  const byProblem = new Map<string, MatchView[]>();
  for (const [problemId, view] of views) {
    const seen = byProblem.get(problemId);
    if (seen) seen.push(view);
    else byProblem.set(problemId, [view]);
  }

  const rows: ProblemRow[] = [];
  for (const p of list) {
    const live = (byProblem.get(p.id) ?? []).filter((m) => m.status !== "declined" && m.negotiation?.envelope?.verdict !== "reject");
    const awaiting = live.filter((m) => m.status === "proposed" && m.negotiation?.envelope?.verdict !== "proceed");
    const ready = live.length > awaiting.length;
    const terms = termChips(p.buyer_terms);
    rows.push({
      id: p.id,
      area: p.department,
      title: splitVerbatim(p.text)[0],
      state: ready ? "ready" : live.length > 0 ? "matching" : "searching",
      matched: live.length - awaiting.length,
      awaiting: awaiting.length,
      startBy: p.buyer_terms?.start_by ?? null,
      terms: terms[0] ?? "",
    });
  }

  const open = rows.reduce((n, r) => n + r.matched + r.awaiting, 0);
  return <ProblemsScreen d={{ initials: initialsOf(company.name), matches: open, rows }} f={f} />;
}
