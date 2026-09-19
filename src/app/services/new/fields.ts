import type { ContractFormat, Requirement, SellerTerms } from "@/types";
import type { Period } from "../../onboarding/fields";
import { DEPARTMENTS } from "../../problems/new/fields";

/**
 * A service is filed under the part of a BUYER'S business it fixes — the same list a problem is
 * filed under, because that is what makes the two sides line up. A call centre answers
 * "Customer support", a fibre install answers "IT & software".
 */
export const AREAS = DEPARTMENTS;

/**
 * What the seller can already satisfy. Same values as the buyer's hard requirements, said from
 * the other side of the table: the buyer asks "signs a DPA", the seller answers "we sign one".
 */
export const CAPABILITIES: { value: Requirement; label: string }[] = [
  { value: "gdpr_dpa", label: "We sign a GDPR DPA" },
  { value: "iso27001", label: "ISO 27001 certified" },
  { value: "eu_data_residency", label: "Data stays in the EU" },
  { value: "estonian_language", label: "We work in Estonian" },
  { value: "english_language", label: "We work in English" },
  { value: "on_site", label: "We can work on site" },
  { value: "industry_refs", label: "We can name industry references" },
];

/** What the chat and the form both write into. Every field is optional except the description. */
export interface ServiceDraft {
  title: string;
  description: string;
  area: string;
  /** The smallest deal worth taking. The buyer states a ceiling; this is the floor it is compared to. */
  floorAmount: string;
  floorPeriod: Period;
  formats: ContractFormat[];
  availableFrom: string;
  capabilities: Requirement[];
}

export const EMPTY: ServiceDraft = {
  title: "",
  description: "",
  area: "",
  floorAmount: "",
  floorPeriod: "one_off",
  formats: [],
  availableFrom: "",
  capabilities: [],
};

export function sellerTermsFrom(d: ServiceDraft): SellerTerms {
  const amount = Number(d.floorAmount);
  return {
    budget_floor: d.floorAmount && amount > 0 ? { amount, currency: "EUR", period: d.floorPeriod } : null,
    contract_formats: d.formats,
    available_from: d.availableFrom || null,
    capabilities: d.capabilities,
  };
}

/**
 * The stored service is one text: heading on the first line, what it is below it — the same
 * shape a problem is stored in, so both sides read alike. A title the person did not write is
 * the first sentence of what they did write.
 */
export function serviceText(d: ServiceDraft): string {
  const body = d.description.trim();
  const title = d.title.trim() || firstSentence(body);
  return `${title}\n\n${body}`;
}

function firstSentence(s: string) {
  const end = s.search(/[.!?](\s|$)/);
  const one = end < 0 ? s : s.slice(0, end);
  return one.length > 90 ? `${one.slice(0, 87).trimEnd()}…` : one;
}

/** What the person filled in themselves, as plain lines for the interviewer. */
export function knownLines(d: ServiceDraft, labels: { formats: string[]; capabilities: string[] }): string {
  const out: string[] = [];
  if (d.title.trim()) out.push(`Title: ${d.title.trim()}`);
  if (d.description.trim()) out.push(`Service: ${d.description.trim()}`);
  if (d.area) out.push(`Fixes this part of a buyer's business: ${d.area}`);
  if (Number(d.floorAmount) > 0)
    out.push(`Smallest deal: EUR ${d.floorAmount} ${d.floorPeriod === "monthly" ? "per month" : "one-off"}`);
  if (d.availableFrom) out.push(`Can start from: ${d.availableFrom}`);
  if (labels.formats.length) out.push(`Contract formats: ${labels.formats.join(", ")}`);
  if (labels.capabilities.length) out.push(`Can satisfy: ${labels.capabilities.join(", ")}`);
  return out.join("\n");
}
