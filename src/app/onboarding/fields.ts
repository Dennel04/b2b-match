import type { Company, CompanyRole, ContractFormat, Requirement, SellerTerms } from "@/types";

/**
 * Onboarding fields: the PROPOSAL under discussion. Every field is optional; the readiness
 * checklist says which ones the matcher needs before it can work for this company.
 *
 * Fields marked EXTRA have no column in src/types.ts yet. They are kept in the browser
 * (localStorage) until the backend adds a place for them. Nothing private is lost: extras
 * never leave the user's browser today.
 */

export const INDUSTRIES = [
  "Logistics & freight", "Manufacturing", "Retail & e-commerce", "Software & IT",
  "Finance & accounting", "Construction & real estate", "Healthcare", "Food & hospitality",
  "Energy & utilities", "Marketing & media", "Professional services", "Other",
];

export const SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"].map((s) => ({ value: s, label: s }));

export const ROLES: { value: CompanyRole; title: string; text: string }[] = [
  { value: "buyer", title: "Find suppliers", text: "You have a problem and want the company that can solve it." },
  { value: "seller", title: "Find clients", text: "You sell a service and want buyers who actually need it." },
  { value: "both", title: "Both", text: "You buy some services and sell others." },
];

export const FORMATS: { value: ContractFormat; label: string }[] = [
  { value: "pilot_first", label: "Paid pilot first" },
  { value: "fixed_price", label: "Fixed price" },
  { value: "monthly_retainer", label: "Monthly retainer" },
  { value: "time_and_materials", label: "Time & materials" },
  { value: "outcome_based", label: "Outcome based" },
];

export const REQUIREMENTS: { value: Requirement; label: string }[] = [
  { value: "gdpr_dpa", label: "Signs a GDPR DPA" },
  { value: "iso27001", label: "ISO 27001" },
  { value: "eu_data_residency", label: "EU data residency" },
  { value: "estonian_language", label: "Works in Estonian" },
  { value: "english_language", label: "Works in English" },
  { value: "on_site", label: "Can work on site" },
  { value: "industry_refs", label: "References in your industry" },
];

export const PERIODS = [
  { value: "one_off", label: "per project" },
  { value: "monthly", label: "per month" },
] as const;

export type Period = (typeof PERIODS)[number]["value"];

export interface Draft {
  // Step 1: company (public once matched)
  name: string;
  website: string;
  role: CompanyRole | null;
  industry: string;
  size: string;
  location: string; // EXTRA
  // Step 2: what you offer (public once matched)
  summary: string;
  services: string[];
  keywords: string[];
  industriesServed: string[]; // EXTRA
  capabilities: Requirement[];
  // Step 3: seller terms (private, compared by the platform only)
  floorAmount: string;
  floorPeriod: Period;
  sellerFormats: ContractFormat[];
  availableFrom: string;
  // Step 4: buyer defaults (private). All EXTRA: buyer terms live on each problem today.
  ceilingAmount: string;
  ceilingPeriod: Period;
  buyerFormats: ContractFormat[];
  mustHaves: Requirement[];
  dealbreakers: string[];
}

export const EXTRA_KEYS = [
  "location", "industriesServed", "ceilingAmount", "ceilingPeriod", "buyerFormats", "mustHaves", "dealbreakers",
] as const satisfies readonly (keyof Draft)[];

export const EXTRAS_STORAGE_KEY = "b2b-onboarding-extras";

export function draftFromCompany(c: Pick<Company, "name" | "website" | "role" | "profile_json" | "seller_terms"> | null): Draft {
  const p = c?.profile_json;
  const t = c?.seller_terms;
  return {
    name: c?.name ?? "",
    website: c?.website ?? "",
    role: c?.role ?? null,
    industry: p?.industry ?? "",
    size: p?.size_hint ?? "",
    location: "",
    summary: p?.summary ?? "",
    services: p?.services ?? [],
    keywords: p?.keywords ?? [],
    industriesServed: [],
    capabilities: t?.capabilities ?? [],
    floorAmount: t?.budget_floor ? String(t.budget_floor.amount) : "",
    floorPeriod: t?.budget_floor?.period ?? "one_off",
    sellerFormats: t?.contract_formats ?? [],
    availableFrom: t?.available_from ?? "",
    ceilingAmount: "",
    ceilingPeriod: "one_off",
    buyerFormats: [],
    mustHaves: [],
    dealbreakers: [],
  };
}

export const sells = (role: CompanyRole | null) => role !== "buyer";
export const buys = (role: CompanyRole | null) => role !== "seller";

export function sellerTermsFromDraft(d: Draft): SellerTerms {
  const amount = Number(d.floorAmount);
  return {
    budget_floor: d.floorAmount && amount > 0 ? { amount, currency: "EUR", period: d.floorPeriod } : null,
    contract_formats: d.sellerFormats,
    available_from: d.availableFrom || null,
    capabilities: d.capabilities,
  };
}

export interface ReadinessItem {
  label: string;
  done: boolean;
  why: string;
}

/** What the matcher needs from this company. Only server-saved fields count. */
export function readiness(d: Draft): ReadinessItem[] {
  const items: ReadinessItem[] = [
    { label: "Company name", done: !!d.name.trim(), why: "Nothing can be saved without it." },
    { label: "Buyer, seller or both", done: !!d.role, why: "Decides which side of the match you are on." },
    { label: "Industry and size", done: !!d.industry && !!d.size, why: "Shown to the other side instead of your name." },
  ];
  if (sells(d.role)) {
    items.push(
      { label: "What you offer, in 2–3 sentences", done: d.summary.trim().length >= 40, why: "The matcher reads this against buyers' problems." },
      { label: "At least one service", done: d.services.length > 0, why: "Used to find you in the first pass." },
      { label: "Smallest deal you take", done: !!Number(d.floorAmount), why: "Checked against budgets without showing either figure." },
      { label: "Contract formats you accept", done: d.sellerFormats.length > 0, why: "Deals with no shared format are filtered out." },
    );
  }
  if (buys(d.role)) {
    items.push({ label: "Your first problem", done: false, why: "Described in a short AI interview after setup." });
  }
  return items;
}
