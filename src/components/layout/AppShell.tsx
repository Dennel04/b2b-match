import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Credits } from "./Credits";
import { NavLink } from "./NavLink";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  count?: number;
  active?: boolean;
}

/**
 * The working-screen frame from drafts/design/problem-page.html: sidebar, top bar whose bottom
 * border lines up with the sidebar header's, content, and a one-row footer.
 */
export function AppShell({
  active,
  demo,
  matches,
  initials,
  bar,
  barRight,
  children,
}: {
  active?: "company" | "problems" | "services" | "matches" | "directory" | "dashboard";
  /** Signed-out demo browsing: the nav keeps `?demo`, or every link lands on the login screen. */
  demo?: boolean;
  /**
   * The badge on Matches: how many are open, on every screen alike. Required on purpose — a
   * screen that forgot it used to blank the badge, so the count seemed to come and go with
   * whichever section you were in.
   */
  matches: number | null;
  initials: string;
  /** Left side of the top bar: back link, case reference, status, the control acting on it. Leave it out for a bare screen that carries its own controls. */
  bar?: React.ReactNode;
  /** Page-level controls, placed before the privacy marker. */
  barRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  // Only the signed-in screens have fake data, so only their links carry the flag onwards.
  const keep = (href: string) => (demo && /^\/(problems|services|matches)/.test(href) ? `${href}?demo` : href);
  const nav: NavItem[] = [
    { href: "/company", label: "Company", icon: "building-2", active: active === "company" },
    { href: keep("/problems"), label: "Problems", icon: "file-text", active: active === "problems" },
    { href: keep("/services"), label: "Services", icon: "package", active: active === "services" },
    { href: keep("/matches"), label: "Matches", icon: "handshake", count: matches ?? undefined, active: active === "matches" },
    { href: "/directory", label: "Directory", icon: "globe", active: active === "directory" },
  ];

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
        {bar ? (
          <header className="flex h-16 items-center gap-3 border-b border-line bg-surface px-4 md:px-9">
            {bar}
            <div className="ml-auto flex items-center gap-4">
              {barRight}
              <span className="hidden items-center gap-1.5 text-[12.5px] text-ink-soft sm:flex">
                <Icon name="lock" size={13} />
                Private to you
              </span>
              <Avatar initials={initials} />
              <MobileSignOut />
            </div>
          </header>
        ) : (
          /* Bare screen: the sidebar is hidden on phones, so brand and log-out still need a row there. */
          <header className="flex h-14 items-center gap-2 border-b border-line bg-surface px-4 md:hidden">
            <Link href="/dashboard" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG mark, nothing to optimise */}
              <img src="/crossdesk-icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
              <span className="text-[15.5px] tracking-[-0.01em]"><span className="font-extrabold">Cross</span><span className="font-normal">desk</span></span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <Credits />
              <Avatar initials={initials} />
              <MobileSignOut />
            </div>
          </header>
        )}

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


/** First letters of the first two words: "Kaubamaja Logistics" → "KL". */
export function initialsOf(name: string | null | undefined) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return (words.slice(0, 2).map((w) => w[0]).join("") || "·").toUpperCase();
}
