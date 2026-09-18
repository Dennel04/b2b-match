"use client";

import { useState } from "react";

/**
 * Building blocks in the high-end-visual-design language (the /lab/f direction), drawn with
 * the project's colour tokens so they follow light and dark themes.
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
    <div className={`rounded-[2rem] bg-ink/[0.035] p-1.5 ring-1 ring-ink/[0.05] ${className}`}>
      <div
        className={`h-full rounded-[calc(2rem-0.375rem)] bg-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_20px_40px_-24px_rgba(22,50,58,0.28)] ${inner}`}
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

/** Pill button; the trailing icon sits in its own circle and moves on hover. */
export function PillButton({
  children,
  variant = "dark",
  icon = true,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "soft"; icon?: boolean }) {
  const dark = variant === "dark";
  return (
    <button
      {...rest}
      className={`group inline-flex cursor-pointer items-center justify-center gap-3 rounded-full py-2 text-[14.5px] font-semibold transition-transform duration-500 ${EASE} active:scale-[0.98] disabled:cursor-default disabled:opacity-50 ${
        icon ? "pl-5 pr-2" : "px-5"
      } ${dark ? "bg-ink text-surface" : "bg-ink/[0.06] text-ink hover:bg-ink/[0.09]"} ${className}`}
    >
      <span className={icon ? "" : "py-1.5"}>{children}</span>
      {icon && (
        <span
          className={`grid h-8 w-8 place-items-center rounded-full transition-transform duration-500 ${EASE} group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105 ${
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
  "h-12 w-full rounded-2xl border border-transparent bg-surface-alt px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-faint focus:border-accent/50 focus:ring-4 focus:ring-accent/15";

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
        {optionalTag && <span className="font-normal text-ink-faint">optional</span>}
      </span>
      {children}
      {help && <span className="text-[12.5px] leading-relaxed text-ink-soft">{help}</span>}
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
      <legend className="mb-2.5 text-[13px] font-semibold text-ink">{label}</legend>
      {children}
      {help && <p className="text-[12.5px] leading-relaxed text-ink-soft">{help}</p>}
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
              onChange(single ? (on ? [] : [o.value]) : on ? value.filter((v) => v !== o.value) : [...value, o.value])
            }
            className={`cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-medium transition-[background-color,color,transform] duration-200 active:scale-[0.97] ${
              on ? "bg-ink text-surface" : "bg-surface-alt text-ink-soft hover:text-ink"
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
        <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-surface py-1 pl-3 pr-1.5 text-[13px] shadow-[0_1px_2px_rgba(22,50,58,0.08)]">
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
