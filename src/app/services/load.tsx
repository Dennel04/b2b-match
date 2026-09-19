import { notFound, redirect } from "next/navigation";
import { getMatchView } from "@/actions/match";
import { initialsOf } from "@/components/layout";
import { currentUser, serverClient } from "@/lib/supabase";
import type { MatchStatus, MatchView, SellerTerms, Service } from "@/types";
import { FORMATS } from "../onboarding/fields";

import { DEMO_SERVICE, DEMO_SERVICES } from "./demo";
import { ServiceScreen, type ServiceScreenData } from "./ServiceScreen";
import { ServicesScreen, type ServiceRow, type ServicesFilter } from "./ServicesScreen";

/**
 * The selling side. A service carries its own SellerTerms (migration 0007), and a match records
 * which service a buyer arrived through, so the counts on a row are that service's own.
 *
 * ponytail: `findMatches()` does not write `matches.service_id` yet — it still scores a buyer
 * against the company as a whole. Until it does, these counts read zero on real data and the
 * groups below come back empty. Nothing here changes when it lands.
 */

/** Reads the table. A missing one is a migration that has not been applied, not a crash. */
async function readServices(companyId: string): Promise<Service[]> {
  const db = await serverClient();
  const { data, error } = await db
    .from("services")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Service[];
}

/** Every match that arrived through one service, projected per viewer. */
async function viewsFor(serviceId: string): Promise<MatchView[]> {
  const db = await serverClient();
  const { data: ids } = await db.from("matches").select("id").eq("service_id", serviceId);
  return Promise.all((ids ?? []).map((r) => getMatchView(r.id)));
}

export async function renderServicesList(f: ServicesFilter) {
  if (f.demo) return <ServicesScreen d={DEMO_SERVICES} f={f} />;

  const user = await currentUser();
  if (!user) redirect("/login");

  const db = await serverClient();
  const { data: company } = await db.from("companies").select("id, name").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) redirect("/onboarding");

  const services = await readServices(company.id);
  const rows: ServiceRow[] = [];
  for (const s of services) {
    const views = await viewsFor(s.id);
    const live = views.filter((m) => m.status !== "declined" && m.negotiation?.envelope?.verdict !== "reject");
    const awaiting = live.filter((m) => m.status === "proposed" && m.negotiation?.envelope?.verdict !== "proceed");
    const matched = live.length - awaiting.length;
    rows.push({
      id: s.id,
      title: s.title,
      area: s.area,
      terms: termChips(s.terms)[0] ?? "No price set",
      state: !s.active ? "paused" : live.some(isYourMove) ? "interested" : live.length > 0 ? "talking" : "listed",
      matched,
      awaiting: awaiting.length,
      availableFrom: s.terms?.available_from ?? null,
    });
  }

  return <ServicesScreen d={{ initials: initialsOf(company.name), rows }} f={f} />;
}

export async function renderServiceScreen({ serviceId, demo }: { serviceId: string; demo?: boolean }) {
  if (demo) return <ServiceScreen d={DEMO_SERVICE} demo />;

  const user = await currentUser();
  if (!user) redirect("/login");

  const db = await serverClient();
  const { data: company } = await db.from("companies").select("id, name").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) redirect("/onboarding");

  // RLS lets anyone read a service; the company filter is what makes this the OWNER'S screen.
  const { data: service } = await db
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!service) notFound();
  const s = service as Service;

  const d: ServiceScreenData = {
    caseRef: `SRV-${s.id.slice(0, 4)}`,
    status: s.active ? "Live" : "Paused",
    initials: initialsOf(company.name),
    title: s.title,
    summary: s.description,
    terms: termChips(s.terms),
    matched: [],
    awaiting: [],
    declined: 0,
    declinedReasons: "",
  };

  const reasons: Record<string, number> = {};
  for (const m of await viewsFor(s.id)) {
    // Anonymous until both sides accept: getMatchView() leaves the name null before that.
    const party = {
      id: m.id,
      name: m.buyer.name ?? `A ${m.buyer.industry} company${m.buyer.size_hint ? `, ${m.buyer.size_hint}` : ""}`,
      place: m.reasoning_public,
    };
    if (m.status === "declined" || m.negotiation?.envelope?.verdict === "reject") {
      d.declined++;
      const area = openArea(m);
      reasons[area] = (reasons[area] ?? 0) + 1;
    } else if (m.status !== "proposed" || m.negotiation?.envelope?.verdict === "proceed")
      d.matched.push({ ...party, state: STATE[m.status], yours: isYourMove(m), score: m.score });
    else d.awaiting.push({ ...party, area: openArea(m) });
  }
  d.matched.sort((a, b) => Number(b.yours) - Number(a.yours) || b.score - a.score);
  d.declinedReasons = describeReasons(reasons);

  return <ServiceScreen d={d} />;
}

/** One name per state, read from the seller's own side. */
const STATE: Record<MatchStatus, string> = {
  proposed: "Waiting on the buyer",
  buyer_interested: "Interest received",
  accepted: "Meeting confirmed",
  declined: "Declined",
};

/** The double opt-in from the selling side: the buyer signals first, the seller answers. */
function isYourMove(m: MatchView) {
  return m.status === "buyer_interested";
}

/** The area still open, never a figure. */
function openArea(m: MatchView) {
  if (m.compatibility?.budget !== "ok") return "price";
  if (m.compatibility?.timeline !== "ok") return "the deadline";
  return "contract format";
}

/** "4 on price, 2 on the deadline" — where they fell away, never who they were. */
function describeReasons(counts: Record<string, number>) {
  const parts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([area, n]) => `${n} on ${area}`);
  return parts.join(", ") || "Nothing was sent to them";
}

/** The company's own floor, in its own figures — the selling mirror of the buyer's ceiling. */
function termChips(t: SellerTerms | null) {
  if (!t) return [];
  const chips: string[] = [];
  if (t.budget_floor) {
    const per = t.budget_floor.period === "monthly" ? " / month" : " / project";
    chips.push(`From €${t.budget_floor.amount.toLocaleString("en-US")}${per}`);
  }
  if (t.contract_formats.length) {
    chips.push(t.contract_formats.map((f) => FORMATS.find((x) => x.value === f)?.label ?? f).join(" or "));
  }
  if (t.available_from) {
    chips.push(
      `Available from ${new Date(t.available_from).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    );
  }
  return chips;
}
