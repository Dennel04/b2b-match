import type {
  AgentDialogueLine,
  AnonymousMatchView,
  Compatibility,
  ContractFormat,
  DealEnvelope,
  MatchStatus,
  Urgency,
} from '@/types';

/**
 * Shared fake dashboard content for the /lab design variants. Every variant renders exactly
 * this data, so the only difference between them is the design.
 *
 * Viewer: Nordkai Logistics, role 'both'. Their own problem text is shown because they own it.
 * Incoming matches (where Nordkai is the seller) are AnonymousMatchView: no names, no figures.
 */

export const COMPANY = {
  name: 'Nordkai Logistics',
  person: 'Kadri',
  industry: 'Freight & warehousing',
  size: '120 people, 3 sites',
  city: 'Tallinn',
};

export const STATS = [
  { label: 'Open problems', value: 2 },
  { label: 'Matches found', value: 7 },
  { label: 'Agents negotiating', value: 1 },
  { label: 'Meetings agreed', value: 1 },
];

export interface OwnProblem {
  id: string;
  title: string;
  text: string; // private: visible only to its owner
  parts: (string | { sealed: string })[]; // same text, with the specifics that never left marked
  urgency: Urgency;
  created: string;
  matches: number;
  sealed: number; // specifics that never left Nordkai
}

export const PROBLEMS: OwnProblem[] = [
  {
    id: 'p1',
    title: 'Customs paperwork by hand',
    text: 'We still file customs paperwork by hand across three warehouses. About 60 hours a month between two people, and two fines this year from filing errors.',
    parts: [
      'We still file ',
      { sealed: 'customs' },
      ' paperwork by hand across ',
      { sealed: 'three warehouses' },
      '. ',
      { sealed: 'About 60 hours a month between two people' },
      ', and ',
      { sealed: 'two fines this year' },
      ' from filing errors.',
    ],
    urgency: 'high',
    created: '12 Sep',
    matches: 4,
    sealed: 4,
  },
  {
    id: 'p2',
    title: 'Driver onboarding takes three weeks',
    text: 'New drivers wait up to three weeks for documents, training slots and fuel cards. We lose some of them to competitors before their first shift.',
    parts: [
      'New drivers wait ',
      { sealed: 'up to three weeks' },
      ' for documents, training slots and fuel cards. We lose ',
      { sealed: 'some of them to competitors' },
      ' before their first shift.',
    ],
    urgency: 'medium',
    created: '15 Sep',
    matches: 3,
    sealed: 2,
  },
];

export interface SellerMatch {
  id: string;
  problemId: string;
  seller: string;
  sellerLine: string;
  score: number;
  reasoning: string; // reasoning_public: no verbatim quotes from the problem
  compatibility: Compatibility;
  status: MatchStatus;
  stage: 'negotiating' | 'ready' | 'meeting' | 'waiting' | 'declined';
}

const OK: Compatibility = {
  budget: 'ok',
  timeline: 'ok',
  contract_formats: ['monthly_retainer', 'pilot_first'],
  missing_requirements: [],
  hard_fail: false,
};

export const MATCHES: SellerMatch[] = [
  {
    id: 'm4',
    problemId: 'p1',
    seller: 'Rebase OÜ',
    sellerLine: 'Back-office automation for logistics',
    score: 91,
    reasoning:
      'Has replaced paper filing for three multi-warehouse logistics clients and builds validation into the filing step itself.',
    compatibility: OK,
    status: 'accepted',
    stage: 'meeting',
  },
  {
    id: 'm7',
    problemId: 'p1',
    seller: 'Tollwise',
    sellerLine: 'Customs software, Baltic region',
    score: 86,
    reasoning:
      'Customs declaration software already certified for Estonian filings, sold on a monthly plan with a paid pilot.',
    compatibility: { ...OK, contract_formats: ['pilot_first'] },
    status: 'buyer_interested',
    stage: 'negotiating',
  },
  {
    id: 'm2',
    problemId: 'p2',
    seller: 'Onboard Studio',
    sellerLine: 'HR workflows for shift-based teams',
    score: 78,
    reasoning:
      'Runs document collection and training scheduling for transport companies with high seasonal hiring.',
    compatibility: { ...OK, contract_formats: ['fixed_price'] },
    status: 'proposed',
    stage: 'ready',
  },
  {
    id: 'm5',
    problemId: 'p1',
    seller: 'Paberivaba',
    sellerLine: 'Document digitisation',
    score: 64,
    reasoning:
      'Strong on scanning and archiving; customs-specific validation would be new work for them.',
    compatibility: {
      budget: 'gap',
      timeline: 'ok',
      contract_formats: ['fixed_price'],
      missing_requirements: ['estonian_language'],
      hard_fail: false,
    },
    status: 'proposed',
    stage: 'waiting',
  },
];

export const LIVE_NEGOTIATION: { with: string; lines: AgentDialogueLine[]; turn: number; of: number } = {
  with: 'Tollwise',
  turn: 5,
  of: 8,
  lines: [
    {
      speaker: 'buyer_agent',
      text: 'My client files across several sites. Does your certification cover all Estonian customs offices, or only Tallinn?',
    },
    {
      speaker: 'seller_agent',
      text: 'All of them. We file roughly four thousand declarations a month for clients today.',
    },
    {
      speaker: 'buyer_agent',
      text: 'They would start with a paid pilot. Monthly volumes stay with my client until a meeting is agreed.',
    },
  ],
};

/** The negotiation that finished with Rebase and led to the meeting. */
export const ENVELOPE: DealEnvelope = {
  verdict: 'proceed',
  agreed_format: 'monthly_retainer',
  budget_compatible: true,
  earliest_start: '2026-09-25',
  open_questions: [
    'Does Estonian coverage extend to written documentation?',
    'Does the first month count toward the retainer?',
  ],
  confidence: 84,
};

export const MEETING = {
  with: 'Rebase OÜ',
  person: 'Marten Kask, founder',
  when: 'Tue 23 Sep, 10:00',
  where: 'Video call',
  briefReady: true,
};

/** Nordkai as the seller: matches from buyers who stay anonymous. */
export const INCOMING: AnonymousMatchView[] = [
  {
    id: 'i1',
    score: 88,
    reasoning_public:
      'Needs cold-chain warehousing near Tallinn for seasonal peaks. Your sites and certifications match.',
    buyer_industry: 'Food distribution',
    buyer_size_hint: '50-200 people',
    budget_compatible: true,
    agreed_format: 'monthly_retainer',
    status: 'proposed',
  },
  {
    id: 'i2',
    score: 73,
    reasoning_public:
      'Looking for a Baltic partner for last-mile delivery of bulky goods, starting next quarter.',
    buyer_industry: 'Furniture retail',
    buyer_size_hint: '20-50 people',
    budget_compatible: false,
    agreed_format: null,
    status: 'proposed',
  },
];

export const ACTIVITY = [
  { when: '09:42', text: 'Agents reached turn 5 of 8 with Tollwise' },
  { when: '09:10', text: 'Meeting brief for Rebase OÜ is ready' },
  { when: 'Yesterday', text: 'Rebase OÜ accepted the meeting' },
  { when: 'Yesterday', text: 'New anonymous match from a food distributor' },
  { when: 'Mon', text: '3 matches found for driver onboarding' },
];

export const FORMAT_LABEL: Record<ContractFormat, string> = {
  pilot_first: 'Paid pilot',
  fixed_price: 'Fixed price',
  monthly_retainer: 'Monthly retainer',
  time_and_materials: 'Time & materials',
  outcome_based: 'Outcome based',
};

export const STAGE_LABEL: Record<SellerMatch['stage'], string> = {
  negotiating: 'Agents negotiating',
  ready: 'Ready to review',
  meeting: 'Meeting agreed',
  waiting: 'Waiting for seller',
  declined: 'Declined',
};

export const problemTitle = (id: string) => PROBLEMS.find((p) => p.id === id)?.title ?? '';

export const VARIANTS = [
  { slug: 'f', skill: 'high-end-visual-design', source: 'taste-skill', idea: 'Soft structuralism, double bezel (the pick)' },
  { slug: 'h', skill: 'emil-design-eng', source: 'emilkowalski/skills', idea: 'Interaction craft: hold to accept, tabs, springs' },
  { slug: 'i', skill: 'liquid-glass', source: 'Armitanemati', idea: 'Glass only on floating chrome, solid content' },
  { slug: 'j', skill: 'apple-design', source: 's1gmamale1/apple-design-skills', idea: 'Deference: light, one accent, inset lists' },
  { slug: 'k', skill: 'awwwards', source: 'tponscr-debug', idea: 'Fluid giant type, broken grid, scroll reveals' },
  { slug: 'l', skill: 'claude-design', source: 'jiji262', idea: 'Dieter Rams direction: dials and spec tables' },
  { slug: 'm', skill: 'gpt-taste', source: 'taste-skill', idea: 'Cinematic dark, gapless bento, stacking cards' },
] as const;
