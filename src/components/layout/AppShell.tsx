import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";

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
  offers,
  initials,
  bar,
  barRight,
  children,
}: {
  active: "company" | "problems" | "offers";
  offers?: number;
  initials: string;
  /** Left side of the top bar: back link, case reference, status, the control acting on it. Leave it out for a bare screen that carries its own controls. */
  bar?: React.ReactNode;
  /** Page-level controls, placed before the privacy marker. */
  barRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const nav: NavItem[] = [
    { href: "/company", label: "Company", icon: "building-2", active: active === "company" },
    { href: "/dashboard", label: "Problems", icon: "file-text", active: active === "problems" },
    { href: "/offers", label: "Offers", icon: "handshake", count: offers, active: active === "offers" },
  ];

  return (
    <div className="flex min-h-dvh bg-bg text-ink">
      <aside className="hidden w-[224px] flex-none flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-line px-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG mark, nothing to optimise */}
          <img src="/crossdesk-icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="text-[15.5px] tracking-[-0.01em]"><span className="font-extrabold">Cross</span><span className="font-normal">desk</span></span>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 px-3 py-4">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-line px-3 py-4">
          <NavLink item={{ href: "/settings", label: "Settings", icon: "settings" }} />
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

      <div className="flex min-w-0 flex-1 flex-col">
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
            {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG mark, nothing to optimise */}
          <img src="/crossdesk-icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-[15.5px] tracking-[-0.01em]"><span className="font-extrabold">Cross</span><span className="font-normal">desk</span></span>
            <div className="ml-auto flex items-center gap-3">
              <Avatar initials={initials} />
              <MobileSignOut />
            </div>
          </header>
        )}

        {children}

        <footer className="mt-auto border-t border-line bg-surface">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-5 px-4 py-[18px] text-[12px] md:px-9">
            <span className="text-ink-faint">Crossdesk — Tallinn</span>
            <span className="ml-auto flex gap-5 text-ink-soft">
              <Link href="/privacy" className="hover:text-accent">Privacy</Link>
              <Link href="/security" className="hover:text-accent">Security</Link>
              <Link href="/help" className="hover:text-accent">Help</Link>
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

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      className={`relative flex items-center gap-2.5 rounded-[9px] px-3 py-2 text-[13.5px] transition-colors ${
        item.active
          ? "bg-surface-alt font-semibold text-ink before:absolute before:inset-y-2 before:-left-3 before:w-[3px] before:rounded-r before:bg-accent"
          : "text-ink-soft hover:bg-surface-alt/60 hover:text-ink"
      }`}
    >
      <Icon name={item.icon} />
      {item.label}
      {item.count ? (
        <span className="ml-auto rounded-full bg-ink px-2 py-px text-[11px] font-semibold text-surface">{item.count}</span>
      ) : null}
    </Link>
  );
}

/** First letters of the first two words: "Kaubamaja Logistics" → "KL". */
export function initialsOf(name: string | null | undefined) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return (words.slice(0, 2).map((w) => w[0]).join("") || "·").toUpperCase();
}
