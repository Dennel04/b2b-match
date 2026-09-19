"use client";

import { Select, PillButton } from "@/components/premium";
import { DateField } from "@/components/DateField";
import { Cloud, CloudSection as Section, Pills, bare } from "@/components/cloud";
import { FORMATS, PERIODS, type Period } from "../../onboarding/fields";
import { AREAS, CAPABILITIES, type ServiceDraft } from "./fields";

/**
 * The form the interview fills, and the one a person can fill alone — the selling mirror of
 * ProblemForm. It owns no state: the draft and every write come from Compose, so the chat and
 * the form are never out of step.
 */
export function ServiceForm({
  draft,
  filled = [],
  set,
  save,
  error,
  saving,
  ready,
}: {
  draft: ServiceDraft;
  /** Fields the interview has just written. They flash once so the change is not missed. */
  filled?: (keyof ServiceDraft)[];
  set: <K extends keyof ServiceDraft>(k: K, v: ServiceDraft[K]) => void;
  save: () => void;
  error: string | null;
  saving: boolean;
  ready: boolean;
}) {
  return (
    <div className="flex flex-col gap-14">
      <Section title="Service" note="This is the half buyers are matched against.">
        <Cloud label="Title" flash={filled.includes("title")}>
          <input
            value={draft.title}
            onChange={(e) => set("title", e.target.value.slice(0, 90))}
            placeholder="Business call centre"
            className={bare}
          />
        </Cloud>

        <Cloud group label="Part of the business it fixes" flash={filled.includes("area")}>
          <Select
            label="Part of the business it fixes"
            placeholder="Not set"
            trigger="bg-transparent text-[16px] text-ink outline-none w-full"
            options={AREAS.map((a) => ({ value: a, label: a }))}
            value={draft.area}
            onChange={(v) => set("area", v)}
          />
        </Cloud>

        <Cloud span label="What you ship" flash={filled.includes("description")}>
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            rows={6}
            placeholder="Twelve agents in Tallinn, Estonian and English, inbound and outbound…"
            className={`${bare} resize-y leading-relaxed`}
          />
        </Cloud>
      </Section>

      <Section title="Terms" note="What you can live with. Your figures stay on your side.">
        <Cloud group label="Smallest deal" flash={filled.includes("floorAmount")}>
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-[16px] font-semibold text-ink-faint">
              €
            </span>
            <input
              aria-label="Smallest deal"
              inputMode="numeric"
              value={draft.floorAmount ? Number(draft.floorAmount).toLocaleString("en-US").replace(/,/g, " ") : ""}
              onChange={(e) => set("floorAmount", e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
              placeholder="2 400"
              className={`${bare} tabular-nums`}
            />
            {/* Equal columns: "per month" must not come out narrower than "per project". */}
            <div className="grid flex-none auto-cols-fr grid-flow-col gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={draft.floorPeriod === p.value}
                  onClick={() => set("floorPeriod", p.value as Period)}
                  className={`inline-flex h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-4 text-center text-[13px] font-medium transition-colors ${
                    draft.floorPeriod === p.value
                      ? "bg-selected text-surface"
                      : "text-ink-soft ring-1 ring-ink/10 hover:text-ink"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </Cloud>

        <Cloud group label="Can start from" flash={filled.includes("availableFrom")}>
          <DateField label="Can start from" value={draft.availableFrom} onChange={(v) => set("availableFrom", v)} />
        </Cloud>

        <Cloud group span plain label="Contract formats" flash={filled.includes("formats")}>
          <Pills options={FORMATS} value={draft.formats} onChange={(v) => set("formats", v)} />
        </Cloud>
      </Section>

      <Section title="Filters" note="Miss one a buyer requires and you never reach them.">
        <Cloud group span plain label="What you can satisfy" flash={filled.includes("capabilities")}>
          <Pills options={CAPABILITIES} value={draft.capabilities} onChange={(v) => set("capabilities", v)} />
        </Cloud>
      </Section>

      {error && <p className="px-1 text-[13px] text-danger">{error}</p>}

      <div className="px-1">
        <PillButton onClick={save} disabled={!ready || saving}>
          {saving ? "Publishing…" : "Publish"}
        </PillButton>
      </div>
    </div>
  );
}
