// SINGLE SOURCE OF TRUTH FOR TYPES.
// Announce in the team chat before changing anything here — everyone builds against it.

export type CompanyRole = 'seller' | 'buyer' | 'both';
export type MatchStatus = 'proposed' | 'buyer_interested' | 'accepted' | 'declined';
export type Urgency = 'low' | 'medium' | 'high';

/** Contract shape. The intersection of both sides' sets is all that can be discussed. */
export type ContractFormat =
  | 'pilot_first'        // a 2-4 week paid pilot before anything bigger
  | 'fixed_price'        // fixed price per project
  | 'monthly_retainer'
  | 'time_and_materials'
  | 'outcome_based';

/** Requirements checked mechanically, with no human in the loop. */
export type Requirement =
  | 'gdpr_dpa'          // willing to sign a data processing agreement
  | 'iso27001'
  | 'eu_data_residency'
  | 'estonian_language'
  | 'english_language'
  | 'on_site'
  | 'industry_refs';    // references in the same industry

/**
 * Money. The buyer states a CEILING, the seller states a FLOOR.
 * Neither side ever sees the other's figure — the platform compares them.
 */
export interface MoneyRange {
  amount: number;
  currency: 'EUR';
  period: 'one_off' | 'monthly';
}

/** The buyer's commercial envelope. Private in full. */
export interface BuyerTerms {
  budget_ceiling: MoneyRange | null;
  contract_formats: ContractFormat[];   // what they are willing to consider
  start_by: string | null;              // ISO date, "must start no later than"
  requirements: Requirement[];
  dealbreakers: string[];               // free text, checked by the agent
}

/** The seller's commercial envelope. */
export interface SellerTerms {
  budget_floor: MoneyRange | null;      // smallest deal they take
  contract_formats: ContractFormat[];
  available_from: string | null;        // ISO date, when they can start
  capabilities: Requirement[];
}

/** Result of the mechanical check. Reports compatibility, never the figures. */
export interface Compatibility {
  budget: 'ok' | 'gap' | 'unknown';
  timeline: 'ok' | 'gap' | 'unknown';
  contract_formats: ContractFormat[];   // intersection; empty means nothing to discuss
  missing_requirements: Requirement[];
  hard_fail: boolean;                   // filtered out before the model is called
}

export interface CompanyProfile {
  name: string;
  industry: string;
  size_hint: string;
  services: string[];
  keywords: string[];
  summary: string;            // 2-3 sentences, safe to show the other side
  // Read off the company's own website by draftCompanyProfile(); all optional, so profiles
  // saved before these existed stay valid. Location, languages, industries and size are safe
  // before a match is accepted; the logo identifies the company and is shown only after.
  logo_url?: string | null;   // absolute URL on the company's own site
  city?: string | null;
  country?: string | null;
  languages?: string[];       // languages the company works in, in English: "Estonian", "English"
  industries_served?: string[];
  employees?: number | null;  // headcount the site states or clearly implies
  founded?: number | null;    // year
  certifications?: string[];  // as named on the site: "ISO 27001", "SOC 2", "AWS Partner"
}

/**
 * What draftCompanyProfile() read off the company's website. Shown back as "confirm or edit":
 * every field is a guess with evidence, and money is deliberately absent — it is never inferred.
 */
export interface CompanyDraft {
  website: string;
  role: CompanyRole;
  profile: CompanyProfile;
  seller_terms: SellerTerms;            // capabilities filled from evidence; floor/formats/date left empty
  evidence: string[];                   // one entry per capability, same order
  pages_read: string[];
}

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  website: string | null;
  role: CompanyRole;
  profile_json: CompanyProfile | null;
  seller_terms: SellerTerms | null;
  created_at: string;
}

/** Private. Never leaves the server for another company's client. */
export interface Problem {
  id: string;
  company_id: string;
  text: string;
  interview_json: InterviewTurn[] | null;
  buyer_terms: BuyerTerms | null;
  urgency: Urgency;
  created_at: string;
}

export interface InterviewTurn {
  question: string;
  answer: string;
}

export interface ProblemInput {
  company_id: string;
  text: string;
  interview_json?: InterviewTurn[];
  buyer_terms?: BuyerTerms;
  urgency?: Urgency;
}

export interface AgentDialogueLine {
  speaker: 'buyer_agent' | 'seller_agent';
  text: string;
  /** The buyer's agent was asked for a specific and refused. This is the demo's key moment. */
  withheld?: boolean;
}

/** Outcome of the machine negotiation: what the agents settled, what is left to humans. */
export interface DealEnvelope {
  verdict: 'proceed' | 'reject';
  agreed_format: ContractFormat | null;
  budget_compatible: boolean;
  earliest_start: string | null;
  open_questions: string[];      // what the agents could not settle — goes into the briefing
  confidence: number;            // 0..100
}

export interface Negotiation {
  lines: AgentDialogueLine[];
  envelope: DealEnvelope;
}

export interface Match {
  id: string;
  buyer_company_id: string;
  seller_company_id: string;
  problem_id: string;
  score: number;                       // 0..100
  reasoning_public: string;            // no verbatim quotes from the problem
  compatibility_json: Compatibility | null;
  agent_dialogue_json: AgentDialogueLine[] | null;   // grows line by line while negotiate() runs
  deal_envelope_json: DealEnvelope | null;           // set only when the negotiation finished
  negotiation_started_at: string | null;
  status: MatchStatus;
  brief_md: string | null;
  created_at: string;
}

/** What the seller sees before accepting: anonymous, no figures. */
export interface AnonymousMatchView {
  id: string;
  score: number;
  reasoning_public: string;
  buyer_industry: string;
  buyer_size_hint: string;
  budget_compatible: boolean;          // "it fits", without the amount
  agreed_format: ContractFormat | null;
  status: MatchStatus;
}

export type MatchAction = 'interested' | 'accept' | 'decline';

/**
 * A match as one viewer may see it. Projected server-side by role: the problem text is present
 * only for its owner, and names appear only once both sides have accepted.
 */
export interface MatchView {
  id: string;
  status: MatchStatus;
  score: number;
  reasoning_public: string;
  viewer: 'buyer' | 'seller' | 'both';
  buyer: { name: string | null; industry: string; size_hint: string };
  seller: { name: string | null; summary: string };
  problem_text: string | null;
  compatibility: Compatibility | null;
  /** Lines appear one at a time while `negotiating`; `envelope` arrives last. */
  negotiation: { lines: AgentDialogueLine[]; envelope: DealEnvelope | null } | null;
  negotiating: boolean;                      // poll getMatchView() every 2-3 s while true
  brief_md: string | null;
}
