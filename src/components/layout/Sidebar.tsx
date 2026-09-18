import Link from "next/link";

type Item = { href: string; label: string; count?: number };

const MAIN: Item[] = [
  { href: "/company", label: "Company" },
  { href: "/problems", label: "Problems" },
  { href: "/offers", label: "Offers", count: 2 },
];

const UTILITY: Item[] = [{ href: "/settings", label: "Settings" }];

function NavItem({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13.5px] ${
        active ? "bg-surface-alt font-semibold text-ink" : "text-ink-soft hover:text-ink"
      }`}
    >
      {item.label}
      {item.count !== undefined && (
        <span className="ml-auto rounded-[5px] bg-ink px-1.5 py-px text-[11px] font-semibold text-bg">
          {item.count}
        </span>
      )}
    </Link>
  );
}

/** Fixed rail. Its header is 60px so its bottom rule continues the top bar's. */
export function Sidebar({ current }: { current?: string }) {
  return (
    <aside className="hidden w-[216px] flex-none flex-col border-r border-line bg-surface md:flex">
      <div className="flex h-[60px] items-center border-b border-line px-3.5 font-semibold">
        B2B Match
      </div>

      <nav className="flex flex-col gap-0.5 p-2.5">
        {MAIN.map((i) => (
          <NavItem key={i.href} item={i} active={i.href === current} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-line p-2.5">
        {UTILITY.map((i) => (
          <NavItem key={i.href} item={i} active={i.href === current} />
        ))}
      </div>
    </aside>
  );
}
