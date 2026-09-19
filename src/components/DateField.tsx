"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A date field in the product's own shape. The native control only opens on its little icon and
 * paints selected segments blue, neither of which belongs on a soft plate.
 *
 * The grid follows the usual accessible calendar: one roving tab stop, arrows by day, Page
 * Up/Down by month, Escape closes, and the month is announced on the heading.
 */
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString("en-GB", { month: "short" }),
);

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : null;
const monthName = (d: Date) =>
  d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const long = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Monday-first, six weeks, so the popover never changes height between months. */
function weeks(view: Date) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function DateField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const picked = parse(value);
  const [cursor, setCursor] = useState(() => picked ?? new Date());
  const grid = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState(false);
  const [months, setMonths] = useState(false);
  const today = iso(new Date());

  // Opens downwards unless the calendar would fall off the bottom of the window.
  useEffect(() => {
    if (!open || !root.current) return;
    const box = root.current.getBoundingClientRect();
    setUp(window.innerHeight - box.bottom < 400 && box.top > 400);
  }, [open]);

  // The focused day moves with the arrow keys, so it has to take focus when it changes.
  useEffect(() => {
    if (!open) return;
    grid.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
  }, [open, cursor]);

  const shift = (days: number) => {
    const d = new Date(cursor);
    d.setDate(d.getDate() + days);
    setCursor(d);
  };
  const shiftMonth = (months: number) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + months);
    setCursor(d);
  };

  function onKey(e: React.KeyboardEvent) {
    const by: Record<string, () => void> = {
      ArrowLeft: () => shift(-1),
      ArrowRight: () => shift(1),
      ArrowUp: () => shift(-7),
      ArrowDown: () => shift(7),
      PageUp: () => shiftMonth(-1),
      PageDown: () => shiftMonth(1),
      Home: () => shift(-((cursor.getDay() + 6) % 7)),
      End: () => shift(6 - ((cursor.getDay() + 6) % 7)),
      Escape: () => setOpen(false),
      Enter: () => pick(cursor),
      " ": () => pick(cursor),
    };
    const run = by[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  }

  const pick = (d: Date) => {
    onChange(iso(d));
    setOpen(false);
  };

  return (
    <div
      ref={root}
      className="relative"
      onBlur={(e) =>
        !e.currentTarget.contains(e.relatedTarget) && setOpen(false)
      }
    >
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 bg-transparent text-left text-[16px] text-ink outline-none"
      >
        <span className={picked ? "" : "text-ink-faint"}>
          {picked ? long(picked) : "Any date"}
        </span>
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          aria-hidden
          className="text-ink-faint"
        >
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>

      <div
        role="dialog"
        aria-label={label}
        data-open={open}
        data-up={up}
        inert={!open}
        style={{ ["--pop-origin" as string]: up ? "bottom left" : "top left" }}
        className={`popcard absolute left-0 z-30 w-[304px] rounded-[26px] bg-surface p-4 shadow-[0_28px_56px_-22px_rgba(22,50,58,0.38)] ring-1 ring-ink/[0.07] ${
          up ? "bottom-full mb-3" : "top-full mt-3"
        }`}
      >
        <div className="flex items-center justify-between px-1 pb-3">
          <Step
            label={months ? "Previous year" : "Previous month"}
            onClick={() => (months ? shiftMonth(-12) : shiftMonth(-1))}
            d="M15 18l-6-6 6-6"
          />
          <button
            type="button"
            aria-live="polite"
            aria-expanded={months}
            onClick={() => setMonths((m) => !m)}
            className="cursor-pointer rounded-full px-3 py-1 text-[14px] font-semibold tracking-[-0.01em] transition-colors hover:bg-surface-alt"
          >
            {months ? cursor.getFullYear() : monthName(cursor)}
          </button>
          <Step
            label={months ? "Next year" : "Next month"}
            onClick={() => (months ? shiftMonth(12) : shiftMonth(1))}
            d="M9 6l6 6-6 6"
          />
        </div>

        {months ? (
          <div
            role="grid"
            aria-label="Month"
            className="grid grid-cols-3 gap-1 pb-1"
          >
            {MONTHS.map((m, i) => {
              const on = i === cursor.getMonth();
              return (
                <button
                  key={m}
                  type="button"
                  role="gridcell"
                  aria-selected={on}
                  onClick={() => {
                    const d = new Date(cursor);
                    d.setMonth(i);
                    setCursor(d);
                    setMonths(false);
                  }}
                  className={`h-11 rounded-2xl text-[13.5px] transition-colors ${
                    on
                      ? "bg-ink font-semibold text-surface"
                      : "text-ink hover:bg-surface-alt"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 pb-1 text-center text-[11.5px] font-medium text-ink-faint">
              {DAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div
              ref={grid}
              role="grid"
              onKeyDown={onKey}
              className="grid grid-cols-7 gap-0.5"
            >
              {weeks(cursor).map((d) => {
                const day = iso(d);
                const outside = d.getMonth() !== cursor.getMonth();
                const on = day === value;
                return (
                  <button
                    key={day}
                    type="button"
                    role="gridcell"
                    aria-selected={on}
                    aria-current={day === today ? "date" : undefined}
                    tabIndex={day === iso(cursor) ? 0 : -1}
                    onClick={() => pick(d)}
                    className={`h-9 rounded-full text-[13.5px] tabular-nums transition-colors ${
                      on
                        ? "bg-ink font-semibold text-surface"
                        : `${outside ? "text-ink-faint/60" : "text-ink"} hover:bg-surface-alt ${day === today ? "font-semibold ring-1 ring-ink/15" : ""}`
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="flex items-center gap-2 border-t border-line pt-3">
          <Quiet onClick={() => pick(new Date())}>Today</Quiet>
          {value && (
            <Quiet
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Quiet>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  label,
  onClick,
  d,
}: {
  label: string;
  onClick: () => void;
  d: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        aria-hidden
      >
        <path d={d} />
      </svg>
    </button>
  );
}

function Quiet({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
    >
      {children}
    </button>
  );
}
