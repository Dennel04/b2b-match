"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { myCredits } from "@/actions/credits";
import { Coin } from "@/components/ui";

/**
 * The balance, in the frame rather than on a screen — it is spent from the match list and
 * refilled on /credits, so it has to be true on both.
 *
 * It reads itself instead of being handed down: AppShell is rendered by two client screens
 * (the two interviews) and cannot be async, and threading a number through every screen to
 * show it in one place is plumbing nobody would maintain.
 */
export function Credits({ className = "" }: { className?: string }) {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    myCredits().then((n) => live && setCredits(n));
    // Spending publishes the new balance rather than making this read again.
    const onSpend = (e: Event) => setCredits((e as CustomEvent<number>).detail);
    window.addEventListener(BALANCE_EVENT, onSpend);
    return () => {
      live = false;
      window.removeEventListener(BALANCE_EVENT, onSpend);
    };
  }, []);

  if (credits === null) return null;

  return (
    <Link
      href="/credits"
      title="Your credits"
      className={`group inline-flex items-center gap-2 rounded-[9px] border border-line px-2.5 py-1.5 text-[13px] font-semibold tabular-nums transition-colors hover:bg-surface-alt ${className}`}
    >
      <Coin size={17} />
      {credits}
      <span className="text-ink-faint transition-colors group-hover:text-ink">+</span>
    </Link>
  );
}

export const BALANCE_EVENT = "crossdesk:credits";

/** Tell the pill what the balance is now, without a round trip of its own. */
export const publishBalance = (credits: number) =>
  window.dispatchEvent(new CustomEvent(BALANCE_EVENT, { detail: credits }));
