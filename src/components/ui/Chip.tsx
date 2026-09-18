type Tone = "neutral" | "accent" | "seal" | "count" | "quiet";

const TONES: Record<Tone, string> = {
  neutral: "border border-line-strong text-ink",
  /** Compatibility and positive state. */
  accent: "bg-accent-soft text-accent-strong",
  /** Withheld detail, or a term the other side is willing to move. Nothing else. */
  seal: "bg-seal-soft text-seal",
  /** A count next to a group heading. */
  count: "bg-ink text-bg",
  quiet: "bg-ink-faint text-surface",
};

export function Chip({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  const pad = tone === "count" || tone === "quiet" ? "px-[7px] py-0.5 text-[11.5px]" : "px-2.5 py-1 text-[12px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[7px] font-semibold ${pad} ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** A term the buyer states about themselves. Their own figures are theirs to see. */
export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line-strong px-[11px] py-1.5 text-[12.5px] font-medium">
      {children}
    </span>
  );
}

/** A specific that never left this page. The owner still reads it; the mark means it stayed. */
export function Sealed({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[2px] border-b-2 border-seal bg-seal-soft px-[0.15em] py-[0.05em]">
      {children}
    </span>
  );
}
