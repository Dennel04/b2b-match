"use client";

import { useEffect, useState } from "react";

type Line = { who: "buyer" | "seller"; text: string; withheld?: boolean };

/** Invented, and written the way the real agents talk: the problem in general words, never a figure. */
const LINES: Line[] = [
  { who: "buyer", text: "A logistics company, 60 people, needs stock counted in real time across two warehouses. It must start in October." },
  { who: "seller", text: "We fit RFID counting to mid-size warehouses. Fixed project or monthly retainer." },
  { who: "buyer", text: "A fixed project. The budget clears your minimum; the figure stays with me.", withheld: true },
  { who: "seller", text: "Then 1 October works. Linking it to their warehouse system is left for the people." },
];

const STEP_MS = 1700;
/** One step per line, one for the verdict, then a pause on the finished page before it starts over. */
const LAST = LINES.length + 3;

/**
 * The landing page's picture of the product: two agents negotiating, one line at a time, ending
 * in "Terms fit". Every line is always in the layout, only hidden, so the card never changes height.
 */
export function Negotiation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(LINES.length + 1);
      return;
    }
    const t = setInterval(() => setStep((s) => (s >= LAST ? 0 : s + 1)), STEP_MS);
    return () => clearInterval(t);
  }, []);

  const done = step > LINES.length;

  return (
    <figure aria-label="Two AI agents negotiate a deal; the buyer's agent withholds the budget, and the terms fit" className="flex flex-col gap-4 p-5 sm:p-6">
      <header className="flex items-center gap-2.5 border-b border-line pb-4">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-alt text-ink-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold">Two agents negotiating</p>
          <p className="text-[12px] text-ink-faint">Neither side sees the other&rsquo;s figures.</p>
        </div>
      </header>

      <ol className="flex flex-col gap-3">
        {LINES.map((l, i) => {
          const shown = step > i;
          const mine = l.who === "buyer";
          return (
            <li
              key={i}
              className={`flex flex-col gap-1 transition-[opacity,transform,filter] duration-500 ease-[var(--ease-out)] ${mine ? "items-end" : "items-start"} ${
                shown ? "opacity-100" : "translate-y-2 opacity-0 blur-[2px]"
              }`}
            >
              <span className="px-1 text-[11px] font-semibold text-ink-faint">{mine ? "Your agent" : "Vendor’s agent"}</span>
              <p
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug ${
                  mine ? "rounded-tr-md bg-ink text-surface" : "rounded-tl-md bg-surface-alt text-ink"
                }`}
              >
                {l.text}
              </p>
              {l.withheld && (
                <span className="rounded-[7px] bg-gold-soft px-2 py-0.5 text-[11.5px] font-semibold text-gold">Budget withheld</span>
              )}
            </li>
          );
        })}
      </ol>

      <p
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-4 text-[13px] font-semibold transition-opacity duration-500 ${
          done ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-soft text-accent">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="whitespace-nowrap">Terms fit.</span>
        <span className="font-normal text-ink-soft">Names are shared once both agree.</span>
      </p>
    </figure>
  );
}
