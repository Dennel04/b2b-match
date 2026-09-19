"use client";

import { createContext, useContext, useState } from "react";

/**
 * What the frame knows about the signed-in company: its initials and how many matches are open.
 *
 * Same reasoning as the credits pill next to it. Every screen used to read the count itself, so
 * a navigation re-read it on the server, the loading skeleton had nothing to show meanwhile, and
 * the badge blinked out and back on every click. Read once in the root layout — which a client
 * navigation does not re-run — and simply held here.
 */
export interface ShellState {
  initials: string;
  /** Open on either side. Null when nobody is signed in: no badge, no space held for one. */
  matches: number | null;
}

const Shell = createContext<ShellState>({ initials: "·", matches: null });

export function ShellProvider({ initial, children }: { initial: ShellState; children: React.ReactNode }) {
  const [state, setState] = useState(initial);
  const [fromServer, setFromServer] = useState(initial);

  // A hard load or a router.refresh() brings a new truth. Adjusted during render, not in an
  // effect, so the badge never shows yesterday's number for a frame.
  if (fromServer.matches !== initial.matches || fromServer.initials !== initial.initials) {
    setFromServer(initial);
    setState(initial);
  }

  return <Shell.Provider value={state}>{children}</Shell.Provider>;
}

export const useShell = () => useContext(Shell);
