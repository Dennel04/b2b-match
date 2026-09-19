import type { BuyerTerms, ContractFormat, Requirement, Urgency } from "@/types";
import type { Period } from "../../onboarding/fields";

/**
 * The parts of the business a problem can sit in. One list for the whole product: the interviewer
 * guesses from it, the interview asks the person to confirm with a chip, the form offers it, and
 * the problems list groups by it. Broad enough that "Other" is rare, short enough to scan.
 */
export const DEPARTMENTS = [
  "Operations",
  "Sales",
  "Marketing & brand",
  "Customer support",
  "Finance & accounting",
  "Legal & compliance",
  "People & hiring",
  "IT & software",
  "Data & analytics",
  "Cybersecurity",
  "Product & R&D",
  "Production & manufacturing",
  "Logistics & supply chain",
  "Procurement",
  "Facilities & office",
  "Sustainability & ESG",
  "Other",
];

/** What the chat and the form both write into. Every field is optional except the description. */
export interface ProblemDraft {
  title: string;
  description: string;
  department: string;
  ceilingAmount: string;
  ceilingPeriod: Period;
  formats: ContractFormat[];
  startBy: string;
  requirements: Requirement[];
  dealbreakers: string[];
  urgency: Urgency;
}

export const EMPTY: ProblemDraft = {
  title: "",
  description: "",
  department: "",
  ceilingAmount: "",
  ceilingPeriod: "one_off",
  formats: [],
  startBy: "",
  requirements: [],
  dealbreakers: [],
  urgency: "medium",
};

export function buyerTermsFrom(d: ProblemDraft): BuyerTerms {
  const amount = Number(d.ceilingAmount);
  return {
    budget_ceiling: d.ceilingAmount && amount > 0 ? { amount, currency: "EUR", period: d.ceilingPeriod } : null,
    contract_formats: d.formats,
    start_by: d.startBy || null,
    requirements: d.requirements,
    dealbreakers: d.dealbreakers,
  };
}

/**
 * The stored problem is one text: heading on the first line, the problem below it. A title the
 * person did not write is the first sentence of what they did write — the interviewer usually
 * supplies a better one, and neither is worth a model call of its own.
 */
export function problemText(d: ProblemDraft): string {
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
export function knownLines(d: ProblemDraft, labels: { formats: string[]; requirements: string[] }): string {
  const out: string[] = [];
  if (d.title.trim()) out.push(`Title: ${d.title.trim()}`);
  if (d.description.trim()) out.push(`Problem: ${d.description.trim()}`);
  if (d.department) out.push(`Part of the business: ${d.department}`);
  if (Number(d.ceilingAmount) > 0)
    out.push(`Budget ceiling: EUR ${d.ceilingAmount} ${d.ceilingPeriod === "monthly" ? "per month" : "one-off"}`);
  if (d.startBy) out.push(`Start by: ${d.startBy}`);
  if (labels.formats.length) out.push(`Contract format: ${labels.formats.join(", ")}`);
  if (labels.requirements.length) out.push(`Requirements: ${labels.requirements.join(", ")}`);
  if (d.dealbreakers.length) out.push(`Dealbreakers: ${d.dealbreakers.join(", ")}`);
  return out.join("\n");
}
