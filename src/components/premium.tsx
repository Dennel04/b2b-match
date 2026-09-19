"use client";

import { useRef, useState } from "react";

/**
 * Building blocks in the high-end-visual-design language (the /lab/f direction), drawn with
 * the project's colour tokens so they follow the design tokens.
 * Double-bezel cards, pill buttons with a nested icon, eyebrow pills, soft inputs, chips.
 */

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Outer shell + inner core with concentric radii, like a glass plate in an aluminium tray. */
export function Bezel({
  className = "",
  inner = "",
  children,
}: {
  className?: string;
  inner?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[2rem] bg-ink/[0.035] p-1.5 ring-1 ring-ink/[0.05] ${className}`}
    >
      <div
        className={`h-full rounded-[calc(2rem-0.375rem)] bg-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_20px_40px_-24px_rgba(23,47,69,0.28)] ${inner}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-soft">
      {children}
    </span>
  );
}

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
      className={`transition-transform duration-500 ${EASE} group-hover:-rotate-45 motion-reduce:transition-none`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Pill button; the trailing arrow points right and turns 45° counter-clockwise on hover. */
export function PillButton({
  children,
  variant = "dark",
  icon = true,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "dark" | "soft";
  icon?: boolean;
}) {
  const dark = variant === "dark";
  return (
    <button
      {...rest}
      className={`group inline-flex cursor-pointer items-center justify-center gap-3 rounded-full py-2 text-[14.5px] font-semibold transition-[transform,background-color] duration-500 ${EASE} active:scale-[0.98] disabled:cursor-default disabled:opacity-50 ${
        icon ? "pl-5 pr-2" : "px-5"
      } ${dark ? "bg-brand text-surface hover:bg-brand-strong" : "bg-ink/[0.06] text-ink hover:bg-ink/[0.09]"} ${className}`}
    >
      <span className={icon ? "" : "py-1.5"}>{children}</span>
      {icon && (
        <span
          className={`grid h-8 w-8 place-items-center rounded-full ${
            dark ? "bg-surface/15" : "bg-surface"
          }`}
        >
          <Arrow />
        </span>
      )}
    </button>
  );
}

export const inputClass =
  "h-12 w-full rounded-2xl border border-transparent bg-surface-alt px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-faint focus:border-ink/20 focus:ring-4 focus:ring-ink/10";

/** Label above, help below; the label never hides inside the input. */
export function Field({
  label,
  help,
  optionalTag = false,
  children,
}: {
  label: string;
  help?: React.ReactNode;
  optionalTag?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline gap-2 text-[13px] font-semibold text-ink">
        {label}
        {optionalTag && (
          <span className="font-normal text-ink-faint">optional</span>
        )}
      </span>
      {children}
      {help && (
        <span className="text-[12.5px] leading-relaxed text-ink-soft">
          {help}
        </span>
      )}
    </label>
  );
}

/** A group heading for fields that are not a single <label> (chips, cards). */
export function FieldGroup({
  label,
  help,
  children,
}: {
  label: string;
  help?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-[13px] font-semibold text-ink">
        {label}
      </legend>
      {children}
      {help && (
        <p className="text-[12.5px] leading-relaxed text-ink-soft">{help}</p>
      )}
    </fieldset>
  );
}

/** Multi- or single-select chips. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  single = false,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  single?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(
                single
                  ? on
                    ? []
                    : [o.value]
                  : on
                    ? value.filter((v) => v !== o.value)
                    : [...value, o.value],
              )
            }
            className={`cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-medium transition-[background-color,color,transform] duration-200 active:scale-[0.97] ${
              on
                ? "bg-selected text-surface"
                : "bg-surface-alt text-ink-soft hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Free-text tags: type and press Enter or comma. */
export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim().replace(/,$/, "");
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-2xl bg-surface-alt px-3 py-2 focus-within:ring-4 focus-within:ring-accent/15">
      {value.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1.5 rounded-full bg-surface py-1 pl-3 pr-1.5 text-[13px] shadow-[0_1px_2px_rgba(23,47,69,0.08)]"
        >
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            onClick={() => onChange(value.filter((v) => v !== t))}
            className="grid h-5 w-5 cursor-pointer place-items-center rounded-full text-ink-faint hover:bg-surface-alt hover:text-ink"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={value.length ? "" : placeholder}
        className="h-8 min-w-[10ch] flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-faint"
      />
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      className={`shrink-0 text-ink-faint transition-transform duration-300 ${EASE} ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * Dropdown in place of a native <select>: a soft trigger, a floating list with a check on the
 * chosen option. Keyboard: arrows move, Enter or Space picks, Escape closes, a letter jumps.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Choose one",
  label,
  trigger = inputClass,
}: {
  value: T | "";
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  /** Accessible name, since the trigger is a button and not a labelled input. */
  label: string;
  /** The closed control's own shape. A screen that already draws a plate passes a bare one. */
  trigger?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const id = `select-${label.replace(/\W+/g, "-").toLowerCase()}`;

  function show() {
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    const box = root.current?.getBoundingClientRect();
    // Opens downwards unless the list would fall off the bottom of the window.
    if (box) setUp(window.innerHeight - box.bottom < 320 && box.top > 320);
    setOpen(true);
  }
  function pick(i: number) {
    onChange(options[i].value);
    setOpen(false);
  }
  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown")
      setActive((a) => Math.min(a + 1, options.length - 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(options.length - 1);
    else if (e.key === "Enter" || e.key === " ") pick(active);
    else if (e.key.length === 1) {
      const i = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(e.key.toLowerCase()),
      );
      if (i >= 0) setActive(i);
      return;
    } else return;
    e.preventDefault();
  }

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
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={`${trigger} flex cursor-pointer items-center justify-between gap-3 text-left`}
      >
        <span className={selected ? "" : "text-ink-faint"}>
          {selected?.label ?? placeholder}
        </span>
        <Chevron open={open} />
      </button>
      <ul
        id={id}
        role="listbox"
        aria-label={label}
        tabIndex={-1}
        data-open={open}
        data-up={up}
        inert={!open}
        style={{ ["--pop-origin" as string]: up ? "bottom left" : "top left" }}
        className={`popcard absolute inset-x-0 z-30 max-h-72 overflow-auto rounded-2xl bg-surface p-1.5 shadow-[0_24px_48px_-20px_rgba(23,47,69,0.35)] ring-1 ring-ink/[0.07] ${
          up ? "bottom-full mb-2" : "top-full mt-2"
        }`}
      >
        {options.map((o, i) => {
          const on = o.value === value;
          return (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={on}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-[14.5px] ${
                i === active ? "bg-surface-alt" : ""
              } ${on ? "font-semibold text-ink" : "text-ink-soft"}`}
            >
              {o.label}
              {on && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  aria-hidden
                  className="text-accent"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Two-way switch drawn as a pill: the indicator slides under the chosen side. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly [{ value: T; label: string }, { value: T; label: string }];
  label: string;
}) {
  const second = value === options[1].value;
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative grid shrink-0 grid-cols-2 rounded-full bg-surface-alt p-1"
    >
      <span
        aria-hidden
        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-[0_1px_3px_rgba(23,47,69,0.12)] transition-transform duration-300 ${EASE}`}
        style={{ transform: second ? "translateX(100%)" : "none" }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
            o.value === value ? "text-ink" : "text-ink-faint hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
