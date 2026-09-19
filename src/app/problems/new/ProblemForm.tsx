"use client";

import { TagInput } from "@/components/ui";
import { Select } from "@/components/premium";
import { DateField } from "@/components/DateField";
import { PillButton } from "@/components/premium";
import {
  FORMATS,
  PERIODS,
  REQUIREMENTS,
  type Period,
} from "../../onboarding/fields";
import { DEPARTMENTS, type ProblemDraft } from "./fields";
import { Cloud, CloudSection as Section, Pills, bare } from "@/components/cloud";

/**
 * The form the interview fills, and the one a person can fill alone. It owns no state: the
 * draft and every write come from Compose, so the chat and the form are never out of step.
 */
export function ProblemForm({
  draft,
  filled = [],
  set,
  save,
  error,
  saving,
  ready,
}: {
  draft: ProblemDraft;
  /** Fields the interview has just written. They flash once so the change is not missed. */
  filled?: (keyof ProblemDraft)[];
  set: <K extends keyof ProblemDraft>(k: K, v: ProblemDraft[K]) => void;
  save: () => void;
  error: string | null;
  saving: boolean;
  ready: boolean;
}) {
  return (
    <div className="flex flex-col gap-14">
      <Section title="Problem" note="Nobody but the platform reads this.">
        <Cloud label="Title" flash={filled.includes("title")}>
          <input
            value={draft.title}
            onChange={(e) => set("title", e.target.value.slice(0, 90))}
            placeholder="Warehouse picking errors"
            className={bare}
          />
        </Cloud>

        <Cloud
          group
          label="Part of the business"
          flash={filled.includes("department")}
        >
          <Select
            label="Part of the business"
            placeholder="Not set"
            trigger="bg-transparent text-[16px] text-ink outline-none w-full"
            options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            value={draft.department}
            onChange={(v) => set("department", v)}
          />
        </Cloud>

        <Cloud
          span
          label="What is happening"
          flash={filled.includes("description")}
        >
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            rows={6}
            placeholder="Order picking is manual and we ship the wrong item about twice a week…"
            className={`${bare} resize-y leading-relaxed`}
          />
        </Cloud>
      </Section>

      <Section
        title="Terms"
        note="What you can live with. Your figures stay on your side."
      >
        <Cloud
          group
          label="Budget ceiling"
          flash={filled.includes("ceilingAmount")}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="text-[16px] font-semibold text-ink-faint"
            >
              €
            </span>
            <input
              aria-label="Budget ceiling"
              inputMode="numeric"
              value={
                draft.ceilingAmount
                  ? Number(draft.ceilingAmount)
                      .toLocaleString("en-US")
                      .replace(/,/g, " ")
                  : ""
              }
              onChange={(e) =>
                set(
                  "ceilingAmount",
                  e.target.value.replace(/[^\d]/g, "").slice(0, 9),
                )
              }
              placeholder="25 000"
              className={`${bare} tabular-nums`}
            />
            {/* Equal columns: "per month" must not come out narrower than "per project". */}
            <div className="grid flex-none auto-cols-fr grid-flow-col gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={draft.ceilingPeriod === p.value}
                  onClick={() => set("ceilingPeriod", p.value as Period)}
                  className={`inline-flex h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-4 text-center text-[13px] font-medium transition-colors ${
                    draft.ceilingPeriod === p.value
                      ? "bg-ink text-surface"
                      : "text-ink-soft ring-1 ring-ink/10 hover:text-ink"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </Cloud>

        <Cloud group label="Must start by" flash={filled.includes("startBy")}>
          <DateField
            label="Must start by"
            value={draft.startBy}
            onChange={(v) => set("startBy", v)}
          />
        </Cloud>

        <Cloud
          group
          span
          plain
          label="Contract formats"
          flash={filled.includes("formats")}
        >
          <Pills
            options={FORMATS}
            value={draft.formats}
            onChange={(v) => set("formats", v)}
          />
        </Cloud>
      </Section>

      <Section title="Filters" note="Fail one and a company never reaches you.">
        <Cloud
          group
          span
          plain
          label="Hard requirements"
          flash={filled.includes("requirements")}
        >
          <Pills
            options={REQUIREMENTS}
            value={draft.requirements}
            onChange={(v) => set("requirements", v)}
          />
        </Cloud>

        <Cloud
          span
          label="Dealbreakers"
          flash={filled.includes("dealbreakers")}
        >
          <TagInput
            shape=""
            value={draft.dealbreakers}
            onChange={(v) => set("dealbreakers", v)}
            placeholder="No offshore support"
          />
        </Cloud>
      </Section>

      {error && <p className="px-1 text-[13px] text-danger">{error}</p>}

      <div className="px-1">
        <PillButton onClick={save} disabled={!ready || saving}>
          {saving ? "Saving…" : "Start"}
        </PillButton>
      </div>
    </div>
  );
}
