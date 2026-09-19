"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * The soft language both writing screens are built from: a plate with a generous radius, a label
 * that sits above it in the page, and choices drawn as pills of the same material.
 *
 * Extracted from the describe-a-problem screen so the company profile is the same product and
 * not a second visual language. The dense controls in `@/components/ui` stay as they are — they
 * belong to the working screens, this belongs to the ones a person fills in.
 */

/** Borderless: the plate around the control is the shape, so the control draws nothing itself. */
export const bare =
  "bare w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-faint";

/** A choice is a small cloud: the plate's own shape, at pill scale. Same ecosystem, same weight. */
export const plate =
  "bg-surface/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_20px_44px_-30px_rgba(22,50,58,0.32)] ring-1 ring-ink/[0.06] backdrop-blur-xl";
export const pill =
  "inline-flex h-11 items-center rounded-full px-5 text-[14px] font-medium transition-shadow duration-300";

/** Multi-select choices, drawn as clouds. The shared Chips are sized for the dense work screens.
 * The interview asks the closed questions with the same control, so both sides look alike. */
export function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(
                on ? value.filter((v) => v !== o.value) : [...value, o.value],
              )
            }
            className={`${pill} cursor-pointer ${
              on
                ? "bg-ink text-surface shadow-[0_18px_36px_-22px_rgba(22,50,58,0.6)]"
                : `${plate} text-ink hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_24px_50px_-28px_rgba(22,50,58,0.42)]`
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * One field: its name and help sit above, in the page, and the plate below holds nothing but the
 * control. The plate lights up as a whole on focus — the same box the hero types into.
 */
export function Cloud({
  label,
  span = false,
  plain = false,
  group = false,
  flash = false,
  children,
}: {
  label: string;
  /** The interview just wrote this field. */
  flash?: boolean;
  span?: boolean;
  /** Chips are their own pills; a plate around them is a second box for nothing. */
  plain?: boolean;
  /**
   * The control is made of buttons, not an input. A <label> would forward a click on its own
   * text to the first button — opening a calendar because you read its name.
   */
  group?: boolean;
  children: React.ReactNode;
}) {
  const Outer = group ? "div" : "label";
  // Every plate is at least 72px, so a one-line field never comes out shorter than its neighbour.
  const height = "min-h-[72px]";
  return (
    <Outer
      className={`relative z-0 flex flex-col gap-2.5 focus-within:z-30 ${span ? "sm:col-span-2" : ""}`}
      {...(group ? { role: "group", "aria-label": label } : {})}
    >
      <span className="px-1 text-[14px] font-semibold tracking-[-0.01em] text-ink">
        {label}
      </span>
      {plain ? (
        <div className={`px-1 pt-1 ${flash ? "fill-flash" : ""}`}>
          {children}
        </div>
      ) : (
        <div
          className={`flex flex-1 flex-col justify-center rounded-[26px] px-5 py-4 ${height} ${plate} transition-shadow duration-300 focus-within:shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_26px_56px_-26px_rgba(22,50,58,0.4)] focus-within:ring-ink/15`}
        >
          {children}
        </div>
      )}
    </Outer>
  );
}




/** A band of fields under one name. No box of its own — the clouds carry the shape. */
export function CloudSection({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative z-0 flex flex-col gap-5 focus-within:z-30">
      <div className="px-1">
        <h2 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] md:text-[34px]">
          {title}
        </h2>
        {note && (
          <p className="mt-2 max-w-[48ch] text-[16px] leading-snug text-ink-soft">
            {note}
          </p>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/**
 * Swaps one view for another without the page jumping: the box travels between the two heights
 * while the incoming content fades up. `token` names what is showing — change it and the swap
 * plays. Height is the one layout-costing property the accordion case is allowed, so it is kept
 * short and the content itself moves on transform and opacity only.
 */
export function Swap({ token, children }: { token: string; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  const shown = useRef(token);

  useLayoutEffect(() => {
    const outer = box.current;
    const inner = body.current;
    if (!outer || !inner) return;
    const to = inner.getBoundingClientRect().height;

    if (shown.current !== token && last.current) {
      shown.current = token;
      outer.style.height = `${last.current}px`;
      void outer.getBoundingClientRect().height; // flush, so the next value transitions
      outer.style.height = `${to}px`;
      const done = () => {
        outer.style.height = "";
        outer.removeEventListener("transitionend", done);
      };
      outer.addEventListener("transitionend", done);
    }
    last.current = to;
  }, [token]);

  return (
    <div
      ref={box}
      className="overflow-hidden transition-[height] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
    >
      <div ref={body} key={token} className="swap-in">
        {children}
      </div>
    </div>
  );
}
