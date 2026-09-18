/** A flat panel: one hairline rule, one radius. No bezels, no drop shadows. */
export function Card({
  className = "",
  muted = false,
  children,
}: {
  className?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[10px] border border-line ${muted ? "bg-surface-alt" : "bg-surface"} ${className}`}
    >
      {children}
    </div>
  );
}

/** One row inside a Card list. Rows divide with a hairline, the last one does not. */
export function Row({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-4 last:border-b-0 ${className}`}
    >
      {children}
    </div>
  );
}
