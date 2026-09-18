// ЕДИНСТВЕННЫЙ ИСТОЧНИК ПРАВДЫ ПО ТИПАМ.
// Менять только после объявления в общем чате команды — на этот файл завязаны все.

export type CompanyRole = 'seller' | 'buyer' | 'both';
export type MatchStatus = 'proposed' | 'buyer_interested' | 'accepted' | 'declined';
export type Urgency = 'low' | 'medium' | 'high';

/** Форма контракта. Пересечение множеств двух сторон — то, о чём вообще можно говорить. */
export type ContractFormat =
  | 'pilot_first'        // сначала пилот/тест на 2-4 недели
  | 'fixed_price'        // фикс за проект
  | 'monthly_retainer'   // помесячная подписка/ретейнер
  | 'time_and_materials' // почасовка
  | 'outcome_based';     // оплата за результат

/** Требования, которые проверяются машинно, без участия людей. */
export type Requirement =
  | 'gdpr_dpa'          // готовы подписать DPA
  | 'iso27001'
  | 'eu_data_residency' // данные не покидают ЕС
  | 'estonian_language'
  | 'english_language'
  | 'on_site'           // нужно присутствие на месте
  | 'industry_refs';    // референсы в той же отрасли

/**
 * Деньги. Покупатель называет ПОТОЛОК, продавец — ПОЛ.
 * Ни одна из сторон никогда не видит число другой: сравнение делает платформа.
 */
export interface MoneyRange {
  amount: number;
  currency: 'EUR';
  period: 'one_off' | 'monthly';
}

/** Коммерческая рамка, которую заявляет покупатель. Приватна целиком. */
export interface BuyerTerms {
  budget_ceiling: MoneyRange | null;
  contract_formats: ContractFormat[];   // что готовы рассматривать
  start_by: string | null;              // ISO-дата, «надо начать не позже»
  requirements: Requirement[];
  dealbreakers: string[];               // свободным текстом, проверяет агент
}

/** Коммерческая рамка продавца. */
export interface SellerTerms {
  budget_floor: MoneyRange | null;      // минимальный чек
  contract_formats: ContractFormat[];   // с чем работают
  available_from: string | null;        // ISO-дата, когда могут начать
  capabilities: Requirement[];
}

/** Результат машинной проверки. Показывает совместимость, НЕ показывает цифры. */
export interface Compatibility {
  budget: 'ok' | 'gap' | 'unknown';
  timeline: 'ok' | 'gap' | 'unknown';
  contract_formats: ContractFormat[];   // пересечение; пусто = говорить не о чем
  missing_requirements: Requirement[];
  hard_fail: boolean;                   // матч отсеян до вызова модели
}

/** Структурированная выжимка профиля компании. */
export interface CompanyProfile {
  name: string;
  industry: string;
  size_hint: string;
  services: string[];
  keywords: string[];
  summary: string;            // 2-3 предложения, можно показывать другой стороне
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

/** 🔒 Приватно. Никогда не уходит на клиент другой компании. */
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
}

/** Итог машинных переговоров: о чём агенты договорились, что осталось людям. */
export interface DealEnvelope {
  verdict: 'proceed' | 'reject';
  agreed_format: ContractFormat | null;
  budget_compatible: boolean;
  earliest_start: string | null;
  open_questions: string[];      // что агенты не смогли решить — в брифинг
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
  reasoning_public: string;            // БЕЗ цитат из problems.text
  compatibility_json: Compatibility | null;
  agent_dialogue_json: AgentDialogueLine[] | null;
  deal_envelope_json: DealEnvelope | null;
  status: MatchStatus;
  brief_md: string | null;
  created_at: string;
}

/** То, что видит продавец до принятия матча: анонимно, без цифр. */
export interface AnonymousMatchView {
  id: string;
  score: number;
  reasoning_public: string;
  buyer_industry: string;
  buyer_size_hint: string;
  budget_compatible: boolean;          // «сходится», без суммы
  agreed_format: ContractFormat | null;
  status: MatchStatus;
}

export type MatchAction = 'interested' | 'accept' | 'decline';
