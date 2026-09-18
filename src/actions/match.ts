'use server';

import { ask, askText } from '@/lib/claude';
import { adminClient, serverClient } from '@/lib/supabase';
import { DialogueSchema, dialoguePrompt } from '@/prompts/dialogue';
import { MatchScoresSchema, matchPrompt } from '@/prompts/match';
import { briefPrompt } from '@/prompts/brief';
import type { CompanyProfile, Match, MatchAction } from '@/types';

const SCORE_THRESHOLD = 70;

/** Работает через service-role: проблема читается на сервере и наружу не уходит. */
export async function findMatches(problemId: string): Promise<Match[]> {
  const admin = adminClient();

  const { data: problem, error: pErr } = await admin
    .from('problems').select('*').eq('id', problemId).single();
  if (pErr || !problem) throw pErr ?? new Error('Проблема не найдена');

  const { data: sellers } = await admin
    .from('companies')
    .select('id, profile_json')
    .in('role', ['seller', 'both'])
    .neq('id', problem.company_id);

  const candidates = (sellers ?? [])
    .filter((s) => s.profile_json)
    .map((s) => {
      const p = s.profile_json as CompanyProfile;
      return { id: s.id, summary: p.summary, services: p.services };
    });
  if (!candidates.length) return [];

  const { results } = await ask(
    MatchScoresSchema,
    matchPrompt(problem.text, candidates),
    { effort: 'high' },
  );

  const rows = results
    .filter((r) => r.score >= SCORE_THRESHOLD)
    .map((r) => ({
      buyer_company_id: problem.company_id,
      seller_company_id: r.seller_company_id,
      problem_id: problemId,
      score: Math.round(r.score),
      reasoning_public: r.reasoning_public,
      status: 'proposed' as const,
    }));
  if (!rows.length) return [];

  const { data, error } = await admin.from('matches').insert(rows).select();
  if (error) throw error;
  return data as Match[];
}

export async function setMatchStatus(matchId: string, action: MatchAction): Promise<Match> {
  const status =
    action === 'interested' ? 'buyer_interested' : action === 'accept' ? 'accepted' : 'declined';

  const db = await serverClient();
  const { data, error } = await db
    .from('matches').update({ status }).eq('id', matchId).select().single();
  if (error) throw error;
  return data as Match;
}

/** Wow-фича демо. Кешируем в базе: на сцене ничего не должно висеть. */
export async function generateDialogue(matchId: string) {
  const admin = adminClient();
  const { data: m } = await admin
    .from('matches')
    .select('*, problems(text), seller:companies!matches_seller_company_id_fkey(profile_json)')
    .eq('id', matchId)
    .single();
  if (!m) throw new Error('Матч не найден');
  if (m.agent_dialogue_json) return m.agent_dialogue_json;

  const seller = m.seller.profile_json as CompanyProfile;
  const { lines } = await ask(DialogueSchema, dialoguePrompt(m.problems.text, seller.summary));

  await admin.from('matches').update({ agent_dialogue_json: lines }).eq('id', matchId);
  return lines;
}

export async function generateBrief(matchId: string): Promise<string> {
  const admin = adminClient();
  const { data: m } = await admin
    .from('matches')
    .select(`*, problems(text),
             buyer:companies!matches_buyer_company_id_fkey(name),
             seller:companies!matches_seller_company_id_fkey(name, profile_json)`)
    .eq('id', matchId)
    .single();
  if (!m) throw new Error('Матч не найден');
  if (m.brief_md) return m.brief_md;
  if (m.status !== 'accepted') throw new Error('Брифинг только после согласия обеих сторон');

  const seller = m.seller.profile_json as CompanyProfile;
  const brief = await askText(
    briefPrompt({
      buyerName: m.buyer.name,
      sellerName: m.seller.name,
      problemText: m.problems.text,
      sellerSummary: seller.summary,
      score: m.score,
    }),
  );

  await admin.from('matches').update({ brief_md: brief }).eq('id', matchId);
  return brief;
}
