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
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgb(19_48_58/0.04)]">{children}</div>
      {note && <p className="mt-2.5 text-[12px] text-ink-faint">{note}</p>}
    </section>
  );
}
