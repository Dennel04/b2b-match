import { notFound, redirect } from "next/navigation";
import { initialsOf } from "@/components/layout";
import { serverClient } from "@/lib/supabase";
import type { SellerTerms } from "@/types";
import { FORMATS } from "../onboarding/fields";
import { DEMO_SERVICE, DEMO_SERVICES } from "./demo";
import { ServiceScreen, type ServiceScreenData } from "./ServiceScreen";
import { ServicesScreen, type ServiceRow, type ServicesFilter } from "./ServicesScreen";

/**
 * The selling side reads from a `services` table that does not exist yet — one row per thing
 * the company sells, each with its own SellerTerms, and `matches.service_id` saying which one a
 * buyer arrived through. Until that migration lands these screens are real but empty, and
 * `?demo` is the way to see them filled. Nothing else in the app depends on it.
 *
 * What the backend owes, in one place:
 *   services(id, company_id, title, description, area, terms jsonb, active, created_at)
 *   matches.service_id -> services(id)
 *   findMatches() checks a buyer against each live service's own terms, not the company's
 */
interface ServiceRecord {
  id: string;
  title: string;
  description: string;
  /** The part of the business it comes out of, the selling mirror of `problems.department`. */
  area: string | null;
  terms: SellerTerms | null;
  active: boolean;
}

/** Reads the table if it is there. A missing table is a migration that has not landed, not a crash. */
async function readServices(companyId: string): Promise<ServiceRecord[] | null> {
  const db = await serverClient();
  const { data, error } = await db
    .from("services")
    .select("id, title, description, area, terms, active")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) return null;
  return (data ?? []) as ServiceRecord[];
}

export async function renderServicesList(f: ServicesFilter) {
  if (f.demo) return <ServicesScreen d={DEMO_SERVICES} f={f} />;

  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await db.from("companies").select("id, name").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) redirect("/onboarding");

  const services = (await readServices(company.id)) ?? [];
  const rows: ServiceRow[] = services.map((s) => ({
    id: s.id,
    title: s.title,
    area: s.area,
    terms: termChips(s.terms)[0] ?? "No price set",
    // Counts arrive with matches.service_id; until then every service reads as freshly listed.
    state: s.active ? "listed" : "paused",
    matched: 0,
    awaiting: 0,
    availableFrom: s.terms?.available_from ?? null,
  }));

  return <ServicesScreen d={{ initials: initialsOf(company.name), matches: 0, rows }} f={f} />;
}

export async function renderServiceScreen({ serviceId, demo }: { serviceId: string; demo?: boolean }) {
  if (demo) return <ServiceScreen d={DEMO_SERVICE} demo />;

  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await db.from("companies").select("id, name").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) redirect("/onboarding");

  const service = (await readServices(company.id))?.find((s) => s.id === serviceId);
  if (!service) notFound();

  const d: ServiceScreenData = {
    caseRef: `SRV-${service.id.slice(0, 4)}`,
    status: service.active ? "Live" : "Paused",
    initials: initialsOf(company.name),
    matches: 0,
    title: service.title,
    summary: service.description,
    terms: termChips(service.terms),
    matched: [],
    awaiting: [],
    declined: 0,
    declinedReasons: "",
  };
  return <ServiceScreen d={d} />;
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
    chips.push(`Available from ${new Date(t.available_from).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`);
  }
  return chips;
}
