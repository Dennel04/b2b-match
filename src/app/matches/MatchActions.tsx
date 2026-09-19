"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateBrief, setMatchStatus } from "@/actions/match";
import { Button } from "@/components/ui";
import type { MatchAction, MatchStatus, MatchView } from "@/types";

/**
 * The double opt-in, from this viewer's side only: the buyer signals interest first, the seller
 * answers. setMatchStatus() enforces the order — this only offers the move that is theirs.
 */
export function MatchActions({
  id,
  status,
  viewer,
  hasBrief,
}: {
  id: string;
  status: MatchStatus;
  viewer: MatchView["viewer"];
  hasBrief: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.message ?? "That did not go through. Try again.");
      else router.refresh();
    });

  const move = (action: MatchAction) => run(() => setMatchStatus(id, action));

  // The seller acts once the buyer has; before that the buying side is the only one with a move.
  const buying = viewer !== "seller";
  const buttons: [label: string, action: MatchAction, primary: boolean][] =
    buying && status === "proposed"
      ? [["Interested", "interested", true], ["Not now", "decline", false]]
      : !buying && status === "buyer_interested"
        ? [["Accept meeting", "accept", true], ["Decline", "decline", false]]
        : [];

  const canGenerate = status === "accepted" && !hasBrief;
  if (!buttons.length && !canGenerate) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2.5">
      {buttons.map(([label, action, primary]) => (
        <Button key={action} variant={primary ? "solid" : "ghost"} disabled={pending} onClick={() => move(action)}>
          {label}
        </Button>
      ))}
      {canGenerate && (
        <Button disabled={pending} onClick={() => run(() => generateBrief(id))}>
          {pending ? "Writing the briefing…" : "Write the briefing"}
        </Button>
      )}
      {error && <p className="text-[13px] text-ink-soft">{error}</p>}
    </div>
  );
}
