/**
 * What the background matcher has left to do. Pure, and separated from `scripts/sweep.ts` for
 * that reason: these two decisions are the whole of the sweep's judgement, and getting either
 * wrong is invisible from the outside — one burns model calls on pairs already judged, the
 * other leaves a problem unmatched for ever.
 */
/**
 * The vendors the matcher can actually judge. `findMatches()` skips a company with no profile
 * — there is nothing to score its services against — and therefore never records it as a
 * candidate either. Counting one as work to do leaves every problem for ever stale: the
 * vendor can never appear in `match_candidates`, so the set difference below never empties,
 * and the cron redoes a full pass over every problem every ten minutes. One junk signup with
 * an empty profile was enough to do exactly that.
 */
export function matchableSellers<T extends { id: string; profile_json: unknown }>(sellers: T[]): string[] {
  return sellers.filter((s) => s.profile_json).map((s) => s.id);
}

/** A negotiation stamped more recently than this is another pass still working on it. */
export const RUNNING_MS = 5 * 60 * 1000;

/**
 * Which problems have vendors nobody has judged for them yet — a new problem, or a vendor that
 * registered since the last pass. `considered` is `match_candidates` grouped by problem: the
 * platform's memory of every pair it has already looked at, so "who is new" is a set
 * difference rather than a guess about whose fields look similar.
 */
export function staleProblems<T extends { id: string; company_id: string }>(
  problems: T[],
  sellerIds: string[],
  considered: Map<string, Set<string>>,
): T[] {
  return problems.filter((p) => {
    const seen = considered.get(p.id) ?? new Set<string>();
    // A company never matches itself, so its own absence is not work to do.
    return sellerIds.some((id) => id !== p.company_id && !seen.has(id));
  });
}

/**
 * Which matches still need their agents to talk. A match with an envelope is finished; one
 * stamped in the last few minutes is being negotiated right now by another pass and must be
 * left alone, or both copies would pay for the same eight model calls.
 */
export function needsNegotiation<T extends { deal_envelope_json: unknown; negotiation_started_at: string | null }>(
  matches: T[],
  now = Date.now(),
): T[] {
  return matches.filter(
    (m) =>
      !m.deal_envelope_json &&
      (!m.negotiation_started_at || now - new Date(m.negotiation_started_at).getTime() > RUNNING_MS),
  );
}
