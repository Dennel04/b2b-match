/**
 * The product in one picture, played once: a buyer's problem and a vendor's offer, two agents
 * walking towards a lock from either side, and the terms meeting in the middle. Pure CSS
 * (see "Login" in globals.css); it rests on its final state and never loops.
 */
export function MatchDiagram() {
  return (
    <figure aria-label="Two AI agents negotiate behind a lock; the terms fit and both sides agree" className="mt-10 max-w-[520px]">
      <div className="flex items-center gap-3">
        <Party label="Your problem" lines={["w-[82%]", "w-[64%]"]} redacted />
        <div className="relative flex h-10 flex-1 items-center">
          <span aria-hidden className="absolute inset-x-0 top-1/2 border-t border-dashed border-line-strong" />
          <Track side="left" />
          <Track side="right" />
          <span className="relative mx-auto grid h-10 w-10 place-items-center rounded-full bg-surface ring-1 ring-line">
            <svg className="meet-out absolute text-ink-soft" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <svg className="meet-in absolute text-ink" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
        </div>
        <Party label="A vendor" lines={["w-[70%]", "w-[88%]"]} />
      </div>
      <figcaption className="relative mt-3 h-5 text-center text-[12.5px] font-medium">
        <span className="meet-out absolute inset-0 text-ink-faint">Two agents negotiating. Neither side sees the other&rsquo;s figures.</span>
        <span className="meet-in absolute inset-0 text-ink">Terms fit. Names are shared once both agree.</span>
      </figcaption>
    </figure>
  );
}

function Party({ label, lines, redacted = false }: { label: string; lines: string[]; redacted?: boolean }) {
  return (
    <div className="relative w-[34%] flex-none rounded-2xl bg-surface p-3 ring-1 ring-ink/[0.06]">
      <span aria-hidden className="meet-ring pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-ink/50" />
      <p className="text-[11.5px] font-semibold text-ink-soft">{label}</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {lines.map((w) => (
          <span key={w} aria-hidden className={`h-1.5 rounded-full ${w} ${redacted ? "bg-ink" : "bg-line-strong"}`} />
        ))}
      </div>
    </div>
  );
}

/** Half the track; the dot at its inner end is carried from the outside to the lock. */
function Track({ side }: { side: "left" | "right" }) {
  return (
    <span aria-hidden className={`absolute inset-y-0 w-1/2 overflow-hidden ${side === "left" ? "left-0" : "right-0"}`}>
      <span className={`absolute inset-0 ${side === "left" ? "agent-left" : "agent-right"}`}>
        <span className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-ink ${side === "left" ? "right-6" : "left-6"}`} />
      </span>
    </span>
  );
}
