"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { Coin } from "@/components/ui";

/**
 * The balance, in the frame rather than on a screen — it is spent from the match list and
 * refilled on /credits, so it has to be true on both.
 *
 * Read once on the server, in the root layout, and held here. Fetching it from the component
 * instead meant every navigation remounted the pill, found nothing, and drew the number a
 * moment later: a balance that blinks looks like a balance that is unsure of itself. A layout
 * above the changing segment is not re-run by a client navigation, so this state simply stays.
 */

const Balance = createContext<number | null>(null);

export function CreditsProvider({ initial, children }: { initial: number | null; children: React.ReactNode }) {
  const [credits, setCredits] = useState(initial);
  const [fromServer, setFromServer] = useState(initial);

  // A hard load or a router.refresh() re-runs the layout with a new number: take it as the
  // truth. Adjusted during render rather than in an effect — React re-renders before painting,
  // so the pill never shows the old balance for a frame.
  if (fromServer !== initial) {
    setFromServer(initial);
    setCredits(initial);
  }

  useEffect(() => {
    const onSpend = (e: Event) => setCredits((e as CustomEvent<number>).detail);
    window.addEventListener(BALANCE_EVENT, onSpend);
    return () => window.removeEventListener(BALANCE_EVENT, onSpend);
  }, []);

  return <Balance.Provider value={credits}>{children}</Balance.Provider>;
}

/** Null means nobody is signed in, and the coin is not drawn at all. */
export function Credits({ className = "" }: { className?: string }) {
  const credits = useContext(Balance);
  if (credits === null) return null;

  return (
    <Link
      href="/credits"
      title="Your credits"
      className={`inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2 py-1 text-[12.5px] font-semibold tabular-nums text-ink-soft transition-colors hover:text-ink ${className}`}
    >
      <Coin size={14} />
      {credits}
    </Link>
  );
}

export const BALANCE_EVENT = "crossdesk:credits";

/** Tell the pill what the balance is now, without a round trip of its own. */
export const publishBalance = (credits: number) =>
  window.dispatchEvent(new CustomEvent(BALANCE_EVENT, { detail: credits }));

/** A screen that has just read the balance itself, handing it to the pill. */
export function SyncBalance({ credits }: { credits: number }) {
  useEffect(() => {
    publishBalance(credits);
  }, [credits]);
  return null;
}
