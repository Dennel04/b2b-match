import type { ClientSize, Company, CompanyDraft, CompanyProfile, CompanyRole, ContractFormat, Requirement, SellerTerms } from "@/types";

/**
 * Onboarding fields. Only what the server stores and the matcher reads. Money, formats and
 * dates are optional here: the matcher treats empty as "unknown, don't filter", and a match
 * asks for them when it needs them (docs/FRONTEND.md §2a).
 */

export const SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"].map((s) => ({ value: s, label: s }));

export const ROLES: { value: CompanyRole; title: string; text: string }[] = [
  { value: "buyer", title: "Describe a problem", text: "Something is stuck" },
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

export const CLIENT_SIZES: { value: ClientSize; label: string }[] = [
  { value: "startup", label: "Startups" },
  { value: "sme", label: "Small businesses" },
  { value: "mid_market", label: "Mid-sized companies" },
  { value: "enterprise", label: "Large enterprises" },
  { value: "public_sector", label: "Public sector" },
];

export const REGIONS = ["Estonia", "Baltics", "Nordics", "EU", "UK", "Worldwide"].map((r) => ({ value: r, label: r }));

export const DELIVERY = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Remote and on site" },
  { value: "on_site", label: "On site" },
] as const;
export type Delivery = (typeof DELIVERY)[number]["value"];

export const LANGUAGES = ["Estonian", "English", "Russian", "Finnish", "Latvian", "Lithuanian", "German", "Swedish"].map((l) => ({ value: l, label: l }));

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
  // Facts a website rarely states, asked on /company after sign-up
  logoUrl: string;
  city: string;
  country: string;
  employees: string;
  founded: string;
  languages: string[];
  certifications: string[];
  industriesServed: string[];
  clientSizes: ClientSize[];
  regions: string[];
  delivery: Delivery | "";
  lookingFor: string[];
  contactName: string;
  contactRole: string;
  /** Whatever else profile_json holds, carried through a save untouched. */
  rest: Partial<CompanyProfile>;
}

export function draftFromCompany(c: Pick<Company, "name" | "website" | "role" | "profile_json" | "seller_terms"> | null): Draft {
  const p = c?.profile_json;
  const t = c?.seller_terms;
  return {
    name: c?.name ?? "",
    website: c?.website ?? "",
    role: c?.role ?? null,
    industry: p?.industry ?? "",
    size: p?.size_hint ? (sizeBucket(p.size_hint) ?? p.size_hint) : "",
    summary: p?.summary ?? "",
    services: p?.services ?? [],
    keywords: p?.keywords ?? [],
    capabilities: t?.capabilities ?? [],
    floorAmount: t?.budget_floor ? String(t.budget_floor.amount) : "",
    floorPeriod: t?.budget_floor?.period ?? "one_off",
    sellerFormats: t?.contract_formats ?? [],
    availableFrom: t?.available_from ?? "",
    logoUrl: p?.logo_url ?? "",
    city: p?.city ?? "",
    country: p?.country ?? "",
    employees: p?.employees ? String(p.employees) : "",
    founded: p?.founded ? String(p.founded) : "",
    languages: p?.languages ?? [],
    certifications: p?.certifications ?? [],
    industriesServed: p?.industries_served ?? [],
    clientSizes: p?.client_sizes ?? [],
    regions: p?.regions ?? [],
    delivery: p?.delivery ?? "",
    lookingFor: p?.looking_for ?? [],
    contactName: p?.contact_name ?? "",
    contactRole: p?.contact_role ?? "",
    rest: p ?? {},
  };
}

/**
 * The profile a save writes: everything the form edits, laid over what was stored, so a field
 * this form does not show is never wiped by saving the ones it does.
 */
export function profileFromDraft(d: Draft): CompanyProfile {
  const num = (v: string) => (Number(v) > 0 ? Math.round(Number(v)) : null);
  return {
    ...d.rest,
    name: d.name.trim(),
    industry: d.industry.trim(),
    size_hint: d.size,
    services: d.services,
    keywords: d.keywords,
    summary: d.summary.trim(),
    logo_url: d.logoUrl.trim() || null,
    city: d.city.trim() || null,
    country: d.country.trim() || null,
    employees: num(d.employees),
    founded: num(d.founded),
    languages: d.languages,
    certifications: d.certifications,
    industries_served: d.industriesServed,
    client_sizes: d.clientSizes,
    regions: d.regions,
    delivery: d.delivery || null,
    looking_for: d.lookingFor,
    contact_name: d.contactName.trim() || null,
    contact_role: d.contactRole.trim() || null,
  };
}

/**
 * What a company can still add to be matched well, each tied to the /company block that asks it.
 * Only what the matcher or the offers actually use; money is optional and asked by a match.
 */
export function missing(d: Draft): { label: string; block: "facts" | "clients" | "terms" | "help" | "contact" }[] {
  const out: { label: string; block: "facts" | "clients" | "terms" | "help" | "contact" }[] = [];
  if (!d.city && !d.country) out.push({ label: "Based in", block: "facts" });
  if (!d.employees && !d.size) out.push({ label: "Company size", block: "facts" });
  if (!d.languages.length) out.push({ label: "Languages", block: "facts" });
  if (sells(d.role)) {
    if (!d.industriesServed.length) out.push({ label: "Industries you serve", block: "clients" });
    if (!d.clientSizes.length) out.push({ label: "Clients", block: "clients" });
    if (!d.regions.length) out.push({ label: "Delivers to", block: "clients" });
    if (!d.sellerFormats.length) out.push({ label: "Contract format", block: "terms" });
    if (!d.availableFrom) out.push({ label: "When you are free to start", block: "terms" });
  }
  if (d.role !== "seller" && !d.lookingFor.length) out.push({ label: "Part of the business", block: "help" });
  if (!d.contactName) out.push({ label: "Who meets a match", block: "contact" });
  return out;
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
    // Facts only fill what is still empty: a person who typed their city keeps it.
    logoUrl: d.logoUrl || a.profile.logo_url || "",
    city: d.city || a.profile.city || "",
    country: d.country || a.profile.country || "",
    employees: d.employees || (a.profile.employees ? String(a.profile.employees) : ""),
    founded: d.founded || (a.profile.founded ? String(a.profile.founded) : ""),
    languages: d.languages.length ? d.languages : a.profile.languages ?? [],
    certifications: d.certifications.length ? d.certifications : a.profile.certifications ?? [],
    industriesServed: d.industriesServed.length ? d.industriesServed : a.profile.industries_served ?? [],
  };
}

/** "~40 people" → "11–50". Null when the hint carries no number. */
export function sizeBucket(hint: string): string | null {
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

