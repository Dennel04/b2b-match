"use client";

import Link, { useLinkStatus } from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { NavItem } from "./AppShell";

/**
 * A sidebar item. Client-side only so it can read `useLinkStatus()`: on a slow connection the
 * route's prefetched skeleton may not have arrived yet, and the sidebar would sit still after
 * the click. The item takes the active fill the moment it is pressed, so the answer to a click
 * is never "nothing happened".
 */
export function NavLink({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      className={`relative isolate flex items-center gap-2.5 rounded-[9px] px-3 py-2 text-[13.5px] transition-colors duration-200 ease-out ${
        item.active
          ? "nav-mark bg-surface-alt font-semibold text-ink before:absolute before:inset-y-2 before:-left-3 before:w-[3px] before:rounded-r before:bg-accent"
          : "text-ink-soft hover:bg-surface-alt/60 hover:text-ink"
      }`}
    >
      <Pending />
      <Icon name={item.icon} />
      {item.label}
      {item.count ? (
        <span className="ml-auto rounded-full bg-ink px-2 py-px text-[11.5px] font-semibold text-surface">{item.count}</span>
      ) : null}
    </Link>
  );
}

/**
 * The pressed state, behind the label. It fades in over 200ms after a 100ms delay, so a
 * navigation that resolves immediately never flashes a state the eye can catch.
 */
function Pending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 rounded-[9px] bg-surface-alt transition-opacity delay-100 duration-200 ease-out ${
        pending ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
