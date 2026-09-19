import Link from "next/link";
import { RemoteLogo } from "@/components/RemoteLogo";
import { Icon } from "@/components/ui";

/**
 * The shared vocabulary for every list of counterparties: Matched, Awaiting, Declined, and
 * nothing else. The problem screen shows it for one problem, the match screen for all of them,
 * and both read the same way on purpose.
 */

/** A counterparty as the server projected it. The name is null-free here: anonymity is decided server-side. */
export interface Party {
  id: string;
  name: string;
  place: string;
  logo?: string | null;
  /** Still anonymous: `name` is what they do, not who they are, so it carries no initials. */
  anon?: boolean;
  /** Paid for, not yet: the row is drawn out of focus until a credit is spent on it. */
  blurred?: boolean;
}

/** A titled section of a working screen: label, count, and a short right-aligned fact. */
export function Group({
  label,
  count,
  fact,
  note,
  muted,
  children,
}: {
  label: string;
  count: number;
  fact: string;
  note?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={label} className="mx-auto w-full max-w-[1200px] px-4 pb-7 last:pb-12 md:px-9">
      <div className="flex items-baseline gap-2.5 pb-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{label}</h2>
        <span
          className={`rounded-full px-2 py-px text-[11.5px] font-semibold tabular-nums ${
            muted ? "bg-surface-alt text-ink-faint" : "bg-ink text-surface"
          }`}
        >
          {count}
        </span>
        <span className="ml-auto text-right text-[12.5px] text-ink-soft">{fact}</span>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-line bg-surface">{children}</div>
      {note && <p className="mt-2.5 text-[12px] text-ink-faint">{note}</p>}
    </section>
  );
}

/** One counterparty row: mark, what they are, where. Everything else the row says goes in `children`. */
export function PartyRow({ p, children }: { p: Party; children: React.ReactNode }) {
  const blur = p.blurred ? "select-none blur-[5px] [user-select:none]" : "";
  return (
    <div className="flex items-center gap-4 border-b border-surface-alt px-4 py-[18px] last:border-0 md:px-5">
      {/* Blurred, not replaced: what is behind the credit is this row, and it stays this row. */}
      <span
        className={`grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-[11px] border border-line bg-surface ${blur}`}
      >
        {p.anon ? <Icon name="building-2" className="text-ink-faint" /> : <RemoteLogo url={p.logo} name={p.name} className="p-1.5" />}
      </span>
      <div className={`min-w-0 flex-1 ${blur}`}>
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{p.name}</p>
        <p className="mt-1 truncate text-[13px] text-ink-soft">{p.place}</p>
      </div>
      {children}
    </div>
  );
}

/** The one action a row carries. Primary means the next move is the viewer's. */
export function RowButton({ href, primary, children }: { href: string; primary?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex-none rounded-[8px] px-4 py-2 text-[13px] font-semibold transition-colors ${
        primary ? "bg-brand text-surface hover:bg-brand-strong" : "border border-line-strong bg-surface text-ink hover:bg-surface-alt"
      }`}
    >
      {children}
    </Link>
  );
}

/**
 * Declined never names a company: one line, never a list. It is the quietest row on the screen
 * on purpose — it reports something the owner is not being asked to act on, so it carries no
 * mark and no filled button. A cross in a 40px tile pulled the eye first, which is backwards.
 */
export function DeclinedRow({ href = "#" }: { href?: string }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 md:px-5">
      <p className="min-w-0 flex-1 text-[13px] text-ink-soft">Could help if you moved a term</p>
      <Link
        href={href}
        className="flex-none rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
      >
        Review
      </Link>
    </div>
  );
}
