"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { unlockMatch } from "@/actions/credits";
import { publishBalance } from "@/components/layout";
import { Coin } from "@/components/ui";
import { UNLOCK_COST } from "@/lib/credits";

/**
 * Spend a credit on one counterparty. The row is already there and already scored; this buys
 * the match screen behind it — the negotiation, the brief, and the name once both sides accept.
 */
export function Unlock({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex flex-none flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await unlockMatch(id);
            if (!r.ok) return setError(r.message);
            setError(null);
            publishBalance(r.data);
            router.refresh();
          })
        }
        className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-line-strong bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink transition-[background-color,opacity] hover:bg-surface-alt disabled:cursor-default disabled:opacity-60"
      >
        <Coin size={16} />
        {pending ? "Opening…" : `Unlock ${UNLOCK_COST}`}
      </button>
      {error && (
        <span className="text-[11.5px] text-danger">
          {error}
          {error === "Not enough credits" && (
            <>
              {" — "}
              <a href="/credits" className="underline underline-offset-2">
                top up
              </a>
            </>
          )}
        </span>
      )}
    </span>
  );
}
