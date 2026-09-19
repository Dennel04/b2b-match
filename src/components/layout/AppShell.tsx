"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Credits } from "./Credits";
import { NavLink } from "./NavLink";
import { useShell } from "./Shell";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  count?: number;
  active?: boolean;
}

/** The sections that get the frame. Everything else — landing, auth, onboarding — is bare. */
const SECTIONS = ["/company", "/problems", "/services", "/matches", "/directory", "/dashboard", "/credits"];

/**
 * The working-screen frame from drafts/design/problem-page.html: sidebar, top bar whose bottom
 * border lines up with the sidebar header's, content, and a one-row footer.
 *
 * Rendered ONCE, in the root layout, around every screen. It used to be rendered by each screen
 * and again by each loading skeleton, so one click mounted three sidebars in a row: the brand
 * mark and the active item's blue rule animated in twice before the page arrived, and every
 * navigation paid for a frame nobody had asked to rebuild. A layout above the changing segment
 * is not re-run by a client navigation — so now it simply stays.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const frame = useShell();
  // Signed-out browsing is the demo, and only it needs `?demo` carried onwards. Read from the
  // frame rather than from the query: useSearchParams() would push this subtree — which is the
  // whole page — out of the server render, and the screen would arrive a beat later.
  const demo = frame.matches === null;
  const count = frame.matches;
  const mark = frame.initials;

  const section = SECTIONS.find((s) => pathname === s || pathname.startsWith(`${s}/`));
  const active = section?.slice(1);

  const keep = (href: string) => (demo && /^\/(problems|services|matches)/.test(href) ? `${href}?demo` : href);
  const nav: NavItem[] = [
    { href: "/company", label: "Company", icon: "building-2", active: active === "company" },
    { href: keep("/problems"), label: "Problems", icon: "file-text", active: active === "problems" },
    { href: keep("/services"), label: "Services", icon: "package", active: active === "services" },
    { href: keep("/matches"), label: "Matches", icon: "handshake", count: count ?? undefined, active: active === "matches" },
    { href: "/directory", label: "Directory", icon: "globe", active: active === "directory" },
  ];

  if (!section) return <>{children}</>;

  return (
    <div className="flex min-h-dvh bg-bg text-ink">
      {/*
        * Taken out of the flow, not stuck to it. A sticky sidebar still belongs to the document,
        * so a rubber-band scroll drags it along and the page ground shows above and below it.
        * Fixed, it never moves; the column beside it is inset by the same width.
        */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[224px] flex-col overflow-y-auto overscroll-contain border-r border-line bg-surface md:flex">
        {/* The brand opens the company dashboard: how matching is going. Company details live in Company. */}
        <div className="flex h-16 items-center gap-2 border-b border-line pl-4 pr-2.5">
          <Link href="/dashboard" aria-current={active === "dashboard" ? "page" : undefined} className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-70">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG mark, nothing to optimise */}
            <img src="/crossdesk-icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-[15.5px] tracking-[-0.01em]"><span className="font-extrabold">Cross</span><span className="font-normal">desk</span></span>
          </Link>
          {/* Beside the mark, on the one row that is on every screen: it is the account's, not a section's. */}
          <Credits className="ml-auto" />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 px-3 py-4">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-line px-3 py-4">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] px-3 py-2 text-[13.5px] text-ink-soft transition-colors hover:bg-surface-alt/60 hover:text-ink"
            >
              <Icon name="log-out" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-[224px]">
        {/* The sidebar is hidden on phones, so brand and log-out still need a row there. */}
        <header className="flex h-14 items-center gap-2 border-b border-line bg-surface px-4 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG mark, nothing to optimise */}
            <img src="/crossdesk-icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-[15.5px] tracking-[-0.01em]"><span className="font-extrabold">Cross</span><span className="font-normal">desk</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Credits />
            <Avatar initials={mark} />
            <MobileSignOut />
          </div>
        </header>

        {/*
          * The body enters, the frame does not. A skeleton and the screen that replaces it both
          * mount through here, so the swap is two short fades rather than one hard cut.
          */}
        <div className="flex flex-1 flex-col screen-in">{children}</div>

        <footer className="mt-auto border-t border-line bg-surface">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-5 px-4 py-[18px] text-[12px] md:px-9">
            <span className="text-ink-faint">Crossdesk — Tallinn</span>
            <span className="ml-auto flex gap-5 text-ink-soft">
              <Link href="/privacy" className="hover:text-ink">Privacy</Link>
              <Link href="/terms" className="hover:text-ink">Terms of service</Link>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[11.5px] font-semibold text-surface">
      {initials}
    </span>
  );
}

function MobileSignOut() {
  return (
    <form action="/auth/signout" method="post" className="md:hidden">
      <button type="submit" aria-label="Log out" className="grid h-8 w-8 cursor-pointer place-items-center rounded-[9px] text-ink-soft hover:bg-surface-alt hover:text-ink">
        <Icon name="log-out" />
      </button>
    </form>
  );
}
