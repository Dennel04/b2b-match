import Link from "next/link";
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
  logo?: string;
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
  return (
    <div className="flex items-center gap-4 border-b border-surface-alt px-4 py-[18px] last:border-0 md:px-5">
      <span className="grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-[11px] border border-line bg-surface">
        {p.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.logo} alt="" width={26} height={26} className="block object-contain" />
        ) : (
          <Icon name="building-2" className="text-ink-faint" />
        )}
      </span>
      <div className="min-w-0 flex-1">
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
        primary ? "bg-ink text-surface hover:bg-ink-soft" : "border border-line-strong bg-surface text-ink hover:bg-surface-alt"
      }`}
    >
      {children}
    </Link>
  );
}

/** Declined never names a company: one line, one button, never a list. */
export function DeclinedRow({ href = "#" }: { href?: string }) {
  return (
    <div className="flex items-center gap-4 bg-bg/50 px-4 py-[18px] md:px-5">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-surface-alt text-ink-faint">
        <Icon name="circle-x" />
      </span>
      <p className="min-w-0 flex-1 text-[14px] font-semibold">Could help if you moved a term</p>
      <RowButton href={href}>Review</RowButton>
    </div>
  );
}
