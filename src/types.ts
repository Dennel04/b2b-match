// ЕДИНСТВЕННЫЙ ИСТОЧНИК ПРАВДЫ ПО ТИПАМ.
// Менять только после объявления в общем чате команды — на этот файл завязаны все.

export type CompanyRole = 'seller' | 'buyer' | 'both';
export type MatchStatus = 'proposed' | 'buyer_interested' | 'accepted' | 'declined';
export type Urgency = 'low' | 'medium' | 'high';

/** Структурированная выжимка профиля компании, которую делает Claude по тексту сайта. */
export interface CompanyProfile {
  name: string;
  industry: string;
  size_hint: string;          // "1-10", "50+", "неизвестно"
  services: string[];         // что компания продаёт
  keywords: string[];
  summary: string;            // 2-3 предложения, можно показывать другой стороне
}

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  website: string | null;
  role: CompanyRole;
  raw_scraped_text: string | null;
  profile_json: CompanyProfile | null;
  created_at: string;
}

/** 🔒 Приватно. Никогда не уходит на клиент другой компании. */
export interface Problem {
  id: string;
  company_id: string;
  text: string;
  interview_json: InterviewTurn[] | null;
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
  urgency?: Urgency;
}

export interface AgentDialogueLine {
  speaker: 'buyer_agent' | 'seller_agent';
  text: string;
}

export interface Match {
  id: string;
  buyer_company_id: string;
  seller_company_id: string;
  problem_id: string;
  score: number;                       // 0..100
  reasoning_public: string;            // БЕЗ цитат из problems.text
  agent_dialogue_json: AgentDialogueLine[] | null;
  status: MatchStatus;
  brief_md: string | null;
  created_at: string;
}

/** То, что реально видит продавец до принятия матча: анонимно. */
export interface AnonymousMatchView {
  id: string;
  score: number;
  reasoning_public: string;
  buyer_industry: string;
  buyer_size_hint: string;
  status: MatchStatus;
}

export type MatchAction = 'interested' | 'accept' | 'decline';
