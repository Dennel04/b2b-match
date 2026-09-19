"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
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

const subscribe = (onChange: () => void) => {
  window.addEventListener(BALANCE_EVENT, onChange);
  return () => window.removeEventListener(BALANCE_EVENT, onChange);
};

export function CreditsProvider({ initial, children }: { initial: number | null; children: React.ReactNode }) {
  // Read as an external store rather than in an effect, because of when the publishing happens.
  // Effects run child first, and this provider sits in the root layout above every page, so a
  // screen that publishes on mount — the new balance after a Stripe return — fires before an
  // effect here could have subscribed. A store has no such gap: the value is already there on
  // the next render, and the pill updates without waiting for a reload.
  const published = useSyncExternalStore(subscribe, () => lastPublished, () => null);

  // Whoever published did so after reading or changing the balance for real, which is newer
  // than the read this layout did for its own render.
  return <Balance.Provider value={published ?? initial}>{children}</Balance.Provider>;
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

/**
 * The last balance anyone published, kept outside React so it outlives the moment it was sent.
 * The event alone is not enough: a page that publishes on mount does so before the layout above
 * it has subscribed.
 */
let lastPublished: number | null = null;

/** Tell the pill what the balance is now, without a round trip of its own. */
export const publishBalance = (credits: number) => {
  lastPublished = credits;
  window.dispatchEvent(new CustomEvent(BALANCE_EVENT, { detail: credits }));
};

/** A screen that has just read the balance itself, handing it to the pill. */
export function SyncBalance({ credits }: { credits: number }) {
  useEffect(() => {
    publishBalance(credits);
  }, [credits]);
  return null;
}
