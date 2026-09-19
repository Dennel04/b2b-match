import type { Company, CompanyDraft, CompanyRole, ContractFormat, Requirement, SellerTerms } from "@/types";

/**
 * Onboarding fields. Only what the server stores and the matcher reads. Money, formats and
 * dates are optional here: the matcher treats empty as "unknown, don't filter", and a match
 * asks for them when it needs them (docs/FRONTEND.md §2a).
 */

export const SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"].map((s) => ({ value: s, label: s }));

export const ROLES: { value: CompanyRole; title: string; text: string }[] = [
  { value: "buyer", title: "Bring a problem", text: "Something is stuck" },
  { value: "seller", title: "Offer a service", text: "Buyers come to you" },
  { value: "both", title: "Both", text: "You do each" },
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
  // Profile: shown to the other side once matched, the name only after both agree
  name: string;
  website: string;
  role: CompanyRole | null;
  industry: string;
  size: string;
  summary: string;
  services: string[];
  keywords: string[];
  capabilities: Requirement[];
  // Working terms: private, compared by the platform only
  floorAmount: string;
  floorPeriod: Period;
  sellerFormats: ContractFormat[];
  availableFrom: string;
}

export function draftFromCompany(c: Pick<Company, "name" | "website" | "role" | "profile_json" | "seller_terms"> | null): Draft {
  const p = c?.profile_json;
  const t = c?.seller_terms;
  return {
    name: c?.name ?? "",
    website: c?.website ?? "",
    role: c?.role ?? null,
    industry: p?.industry ?? "",
    size: p?.size_hint ?? "",
    summary: p?.summary ?? "",
    services: p?.services ?? [],
    keywords: p?.keywords ?? [],
    capabilities: t?.capabilities ?? [],
    floorAmount: t?.budget_floor ? String(t.budget_floor.amount) : "",
    floorPeriod: t?.budget_floor?.period ?? "one_off",
    sellerFormats: t?.contract_formats ?? [],
    availableFrom: t?.available_from ?? "",
  };
}

/** Lays an autofill result over the form. Terms the person already set are kept. */
export function applyAutofill(d: Draft, a: CompanyDraft): Draft {
  return {
    ...d,
    name: a.profile.name || d.name,
    website: a.website || d.website,
    role: d.role ?? a.role,
    industry: a.profile.industry || d.industry,
    size: sizeBucket(a.profile.size_hint) ?? d.size,
    summary: a.profile.summary || d.summary,
    services: a.profile.services.length ? a.profile.services : d.services,
    keywords: a.profile.keywords.length ? a.profile.keywords : d.keywords,
    capabilities: a.seller_terms.capabilities.length ? a.seller_terms.capabilities : d.capabilities,
  };
}

/** "~40 people" → "11–50". Null when the hint carries no number. */
function sizeBucket(hint: string): string | null {
  const n = Number(hint.replace(/[\s,]/g, "").match(/\d+/)?.[0]);
  if (!n) return null;
  if (n <= 10) return "1–10";
  if (n <= 50) return "11–50";
  if (n <= 200) return "51–200";
  if (n <= 1000) return "201–1000";
  return "1000+";
}

export const sells = (role: CompanyRole | null) => role !== "buyer";

export function sellerTermsFromDraft(d: Draft): SellerTerms {
  const amount = Number(d.floorAmount);
  return {
    budget_floor: d.floorAmount && amount > 0 ? { amount, currency: "EUR", period: d.floorPeriod } : null,
    contract_formats: d.sellerFormats,
    available_from: d.availableFrom || null,
    capabilities: d.capabilities,
  };
}

