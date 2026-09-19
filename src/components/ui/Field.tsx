"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export const inputClass =
  "h-11 w-full rounded-[8px] border border-line-strong bg-surface px-3.5 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-ink-soft focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--ink)_9%,transparent)]";

/** Label above, help below. The label never hides inside the input. */
export function Field({
  label,
  help,
  optional = false,
  children,
}: {
  label: string;
  help?: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline gap-2 text-[13px] font-semibold text-ink">
        {label}
        {optional && (
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

/** A heading for a group of controls that is not a single <label> — chips, cards, radios. */
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
            className={`cursor-pointer rounded-[7px] border px-3.5 py-2 text-[13px] font-medium transition-colors ${
              on
                ? "border-selected bg-selected text-bg"
                : "border-line-strong bg-surface text-ink-soft hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Free-text tags: type, then Enter or comma. */
export function TagInput({
  value,
  onChange,
  placeholder,
  shape = "min-h-11 rounded-[8px] border border-line-strong bg-surface px-2.5 py-2 transition-[border-color,box-shadow] focus-within:border-ink-soft focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--ink)_9%,transparent)]",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** The box around the tags. A soft plate already draws one, so it passes an empty shape. */
  shape?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim().replace(/,$/, "");
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${shape}`}>
      {value.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-[7px] bg-surface-alt py-1 pl-2.5 pr-1.5 text-[13px]"
        >
          {t}
          {/*
            * The chip is already the shape; the remove control is a mark on it, not a second box
            * inside it. The 20px square is hit area only — it darkens the mark, it does not draw
            * a plate. The glyph is the icon set's `x`, not the "×" character: that one is centred
            * on the maths axis, which sits above the middle of a line, so it always read high.
            */}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            onClick={() => onChange(value.filter((v) => v !== t))}
            className="grid h-5 w-5 cursor-pointer place-items-center rounded-[5px] text-ink-faint transition-colors duration-200 ease-out hover:text-ink"
          >
            <Icon name="x" size={12} />
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
        className="h-7 min-w-[10ch] flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-faint"
      />
    </div>
  );
}
