import Link from "next/link";
import type { ReadinessItem } from "../onboarding/fields";

/**
 * Shown on the dashboard while company setup is incomplete: which answers the matcher still
 * needs, each linked to the setup step that asks for it. Renders nothing once all are given.
 */
export function SetupCard({ items }: { items: ReadinessItem[] }) {
  const missing = items.filter((i) => !i.done);
  if (!missing.length) return null;

  return (
    <section aria-label="Company setup" className="mx-auto w-full max-w-[1200px] px-4 pt-9 md:px-9">
      <div className="flex items-baseline gap-2.5 pb-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Finish company setup</h2>
        <span className="rounded-full bg-seal-soft px-2 py-px text-[11.5px] font-semibold tabular-nums text-seal">
          {items.length - missing.length} / {items.length}
        </span>
        <span className="ml-auto text-right text-[12.5px] text-ink-soft">The matcher skips you until these are in</span>
      </div>
      <div className="mb-3 flex gap-1" aria-hidden>
        {items.map((i) => (
          <span key={i.label} className={`h-1 flex-1 rounded-full ${i.done ? "bg-accent" : "bg-line-strong"}`} />
        ))}
      </div>
      <ul className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgb(19_48_58/0.04)]">
        {missing.map((i) => (
          <li key={i.label} className="flex items-center gap-4 border-b border-surface-alt px-4 py-[14px] last:border-0 md:px-[22px]">
            <span aria-hidden className="h-2 w-2 flex-none rounded-full bg-seal" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-semibold">{i.label}</p>
              <p className="mt-0.5 truncate text-[13px] text-ink-soft">{i.why}</p>
            </div>
            <Link
              href={`/onboarding?step=${i.step}`}
              className="flex-none rounded-[9px] border border-line-strong bg-surface px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-surface-alt"
            >
              Fill in
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
