"use client";

import { useEffect } from "react";
import { markMatchesSeen } from "@/actions/match";

/**
 * The rows above have now been on screen, so they stop counting towards the sidebar badge.
 *
 * It runs in an effect rather than in the server render on purpose: rendering happens when the
 * sidebar prefetches this route too, and a notification that clears itself because someone
 * hovered a link is worse than no notification at all.
 */
export function MarkSeen({ ids }: { ids: string[] }) {
  const key = ids.join(",");
  useEffect(() => {
    if (key) void markMatchesSeen(key.split(","));
  }, [key]);
  return null;
}
