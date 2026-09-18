"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCompany } from "@/actions/company";
import { Bezel, Chips, Eyebrow, Field, FieldGroup, PillButton, Segmented, Select, TagInput, inputClass } from "@/components/premium";
import {
  EXTRAS_STORAGE_KEY, EXTRA_KEYS, FORMATS, INDUSTRIES, PERIODS, REQUIREMENTS, ROLES, SIZES,
  buys, readiness, sellerTermsFromDraft, sells, type Draft, type Period,
} from "./fields";

export type StepId = "company" | "offer" | "terms" | "buying" | "ready";

const STEPS: { id: StepId; title: string; visibility: "public" | "private" | null; lead: string }[] = [
  { id: "company", title: "Your company", visibility: "public", lead: "The basics. Buyers and sellers see your industry and size first; your name only after both agree to meet." },
  { id: "offer", title: "What you offer", visibility: "public", lead: "The matcher reads this against buyers' problems. Plain words work better than marketing." },
  { id: "terms", title: "Your working terms", visibility: "private", lead: "Never shown to anyone. The platform compares these with a buyer's terms and reports only whether they fit." },
  { id: "buying", title: "When you buy", visibility: "private", lead: "Defaults for your problems. You can change them per problem in the AI interview." },
  { id: "ready", title: "Ready check", visibility: null, lead: "What the matcher still needs from you. Everything else can wait." },
];

function Visibility({ kind }: { kind: "public" | "private" }) {
  return kind === "public" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[12px] font-medium text-accent">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
      Shown to companies you match with
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-[12px] font-medium text-gold">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      Private. Compared by the platform, never shown
    </span>
  );
}

function Money({
  amount, period, onAmount, onPeriod, placeholder, label,
}: { amount: string; period: Period; onAmount: (v: string) => void; onPeriod: (v: Period) => void; placeholder: string; label: string }) {
  const shown = amount ? Number(amount).toLocaleString("en-US").replace(/,/g, " ") : "";
  return (
    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-ink-faint">€</span>
        <input
          aria-label={label}
          inputMode="numeric"
          value={shown}
          onChange={(e) => onAmount(e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
          placeholder={placeholder}
          className={`${inputClass} pl-9 text-[17px] font-semibold tabular-nums tracking-[-0.01em]`}
        />
      </div>
      <Segmented label="Period" value={period} onChange={onPeriod} options={PERIODS} />
    </div>
  );
}

/** Quick picks next to a date: most answers are "now" or "in a few weeks". */
function DatePick({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Dates are fixed at first render, so the picks do not shift while the step is open.
  const [picks] = useState(() => {
    const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
    return [
      { label: "Right away", value: inDays(0) },
      { label: "In 2 weeks", value: inDays(14) },
      { label: "In a month", value: inDays(30) },
    ];
  });
  return (
    <div className="flex flex-wrap items-center gap-2">
      {picks.map((p) => (
        <button
          key={p.label}
          type="button"
          aria-pressed={value === p.value}
          onClick={() => onChange(value === p.value ? "" : p.value)}
          className={`cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors ${
            value === p.value ? "bg-ink text-surface" : "bg-surface-alt text-ink-soft hover:text-ink"
          }`}
        >
          {p.label}
        </button>
      ))}
      <input
        type="date"
        aria-label="Exact date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} h-10 w-auto cursor-pointer rounded-full px-4 text-[13.5px]`}
      />
    </div>
  );
}

/** The 40-character floor the readiness check uses, shown while typing instead of after. */
function LengthMeter({ length, min }: { length: number; min: number }) {
  const ok = length >= min;
  return (
    <span className="flex items-center gap-2 text-[12px] font-medium">
      <span className="h-1 w-16 overflow-hidden rounded-full bg-ink/10" aria-hidden>
        <span className={`block h-full rounded-full transition-[width] duration-300 ${ok ? "bg-accent" : "bg-gold"}`} style={{ width: `${Math.min(100, (length / min) * 100)}%` }} />
      </span>
      <span className={ok ? "text-accent" : "text-ink-faint"}>{ok ? "Enough to match on" : `${min - length} more characters`}</span>
    </span>
  );
}

/** Exactly what saveCompany() receives. Compared as JSON to know whether anything changed. */
function payload(d: Draft) {
  return {
    name: d.name.trim(),
    website: d.website.trim() || null,
    role: d.role ?? ("both" as const),
    profile_json: {
      name: d.name.trim(),
      industry: d.industry,
      size_hint: d.size,
      services: d.services,
      keywords: d.keywords,
      summary: d.summary.trim(),
    },
    seller_terms: sells(d.role) ? sellerTermsFromDraft(d) : null,
  };
}

export function Wizard({ initial, email, initialStep = "company" }: { initial: Draft; email: string; initialStep?: StepId }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(initial);
  const [step, setStep] = useState<StepId>(initialStep);
  const [visited, setVisited] = useState<Set<StepId>>(() => new Set([initialStep]));
  const [saved, setSaved] = useState(() => JSON.stringify(payload(initial)));
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));

  // Extras have no server column yet: restore and keep them in this browser.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(EXTRAS_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage
      if (raw) setD((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(EXTRAS_STORAGE_KEY, JSON.stringify(Object.fromEntries(EXTRA_KEYS.map((k) => [k, d[k]]))));
    } catch {}
  }, [d]);

  const steps = useMemo(
    () => STEPS.filter((s) => (s.id === "offer" || s.id === "terms" ? sells(d.role) : s.id === "buying" ? buys(d.role) : true)),
    [d.role],
  );
  // A role change can remove the open step; fall back to the first one rather than index -1.
  const current = steps.find((s) => s.id === step) ?? steps[0];
  const index = steps.indexOf(current);
  const checklist = readiness(d);
  const missing = checklist.filter((i) => !i.done);

  /**
   * A step's mark in the rail comes from its answers, not its position: done when every required
   * answer in it is given, "left" when the user has been there and something is still missing.
   * Steps with only optional fields count as done once seen.
   */
  function stepState(id: StepId): "done" | "left" | "open" {
    if (id === "ready") return missing.length ? "open" : "done";
    const items = checklist.filter((c) => c.step === id);
    const left = items.filter((c) => !c.done).length;
    if (items.length ? left === 0 : visited.has(id)) return "done";
    return visited.has(id) && left ? "left" : "open";
  }
  const leftIn = (id: StepId) => checklist.filter((c) => c.step === id && !c.done).length;
  const stepsDone = steps.filter((s) => stepState(s.id) === "done").length;

  /** Saves only when something changed, so moving between steps costs nothing otherwise. */
  async function persist() {
    const next = payload(d);
    const key = JSON.stringify(next);
    if (key === saved) return;
    if (!next.name) {
      setSaveNote("Add a company name to save to your account. Until then, answers stay in this browser.");
      return;
    }
    setSaving(true);
    setSaveNote(null);
    try {
      await saveCompany(next);
      setSaved(key);
    } catch (e) {
      setSaveNote(`Could not save to your account: ${e instanceof Error ? e.message : "unknown error"}. Your answers are kept here.`);
    } finally {
      setSaving(false);
    }
  }

  /** Every way of leaving a step (rail, Back, Skip, Continue) saves first and marks it seen. */
  async function goTo(id: StepId) {
    if (saving) return;
    await persist();
    setVisited((v) => new Set(v).add(current.id).add(id));
    setStep(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const go = (delta: 1 | -1) => goTo(steps[Math.min(Math.max(index + delta, 0), steps.length - 1)].id);

  async function leave() {
    await persist();
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-4 pb-24 pt-4 md:px-8 lg:grid-cols-[280px_1fr]">
      {/* Rail: steps and readiness */}
      <aside className="soft-in lg:sticky lg:top-8 lg:h-max">
        <Eyebrow>Company setup</Eyebrow>
        <p className="mt-4 text-[13.5px] text-ink-soft">Signed in as {email}</p>
        <ol className="mt-6 flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {steps.map((s, i) => {
            const state = stepState(s.id);
            const here = s.id === current.id;
            return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => goTo(s.id)}
                aria-current={s.id === current.id ? "step" : undefined}
                className={`flex w-full cursor-pointer items-center gap-3 whitespace-nowrap rounded-full py-2 pl-2 pr-4 text-left text-[14px] transition-colors duration-200 ${
                  s.id === current.id ? "bg-surface font-semibold shadow-[0_1px_3px_rgba(22,50,58,0.1)]" : "text-ink-soft hover:text-ink"
                }`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
                  here ? "bg-ink text-surface" : state === "done" ? "bg-accent text-surface" : state === "left" ? "bg-gold-soft text-gold" : "bg-ink/[0.06]"
                }`}>
                  {state === "done" && !here ? "✓" : i + 1}
                </span>
                {s.title}
                {state === "left" && !here && <span className="ml-auto pl-2 text-[12px] font-medium text-gold">{leftIn(s.id)} left</span>}
              </button>
            </li>
            );
          })}
        </ol>
        <div className="mt-8 hidden rounded-3xl bg-surface/70 p-5 ring-1 ring-ink/[0.05] lg:block">
          <p className="text-[13px] font-semibold">Setup progress</p>
          <p className="mt-1 text-[28px] font-extrabold tracking-[-0.04em]">{stepsDone}<span className="text-[16px] font-semibold text-ink-faint"> / {steps.length} steps</span></p>
          <div className="mt-2 flex gap-1" aria-hidden>
            {steps.map((st) => {
              const state = stepState(st.id);
              return <span key={st.id} className={`h-1.5 flex-1 rounded-full ${state === "done" ? "bg-accent" : state === "left" ? "bg-gold" : "bg-ink/10"}`} />;
            })}
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
            {stepsDone === steps.length ? "Everything the matcher needs is in." : "A step turns green when its answers are in. Every step can be skipped for now."}
          </p>
        </div>
      </aside>

      {/* Step card */}
      <section key={current.id} className="soft-in min-w-0">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">{current.title}</h1>
          {current.visibility && <Visibility kind={current.visibility} />}
        </div>
        <p className="mb-8 max-w-[60ch] text-[16px] leading-relaxed text-ink-soft">{current.lead}</p>

        <Bezel inner="flex flex-col gap-7 p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-3 border-b border-line pb-5">
            {index > 0 && (
              <PillButton type="button" variant="soft" icon={false} onClick={() => go(-1)}>
                Back
              </PillButton>
            )}
            <span className="text-[12.5px] font-medium text-ink-faint">Step {index + 1} of {steps.length}</span>
            <div className="ml-auto flex items-center gap-1">
              {current.id !== "ready" && (
                <button type="button" onClick={() => go(1)} className="cursor-pointer px-3 text-[14px] font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                  Skip for now
                </button>
              )}
              {current.id === "ready" ? (
                <PillButton type="button" onClick={leave} disabled={saving}>
                  {saving ? "Saving…" : "Go to dashboard"}
                </PillButton>
              ) : (
                <PillButton type="button" onClick={() => go(1)} disabled={saving}>
                  {saving ? "Saving…" : "Continue"}
                </PillButton>
              )}
            </div>
          </div>
          {saveNote && <p role="status" className="rounded-2xl bg-gold-soft px-4 py-3 text-[13.5px] text-ink">{saveNote}</p>}
          {current.id === "company" && (
            <>
              <FieldGroup label="What brings you here?">
                <div className="grid gap-3 sm:grid-cols-3">
                  {ROLES.map((r) => {
                    const on = d.role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set("role", on ? null : r.value)}
                        className={`cursor-pointer rounded-3xl p-5 text-left transition-[background-color,box-shadow,transform] duration-300 active:scale-[0.98] ${
                          on ? "bg-ink text-surface shadow-[0_12px_30px_-16px_rgba(22,50,58,0.6)]" : "bg-surface-alt hover:bg-ink/[0.06]"
                        }`}
                      >
                        <p className="text-[15px] font-bold">{r.title}</p>
                        <p className={`mt-1 text-[13px] leading-relaxed ${on ? "text-surface/70" : "text-ink-soft"}`}>{r.text}</p>
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Company name" help="Shown only after both sides agree to meet.">
                  <input value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Nordkai Logistics OÜ" className={inputClass} />
                </Field>
                <Field label="Website" optionalTag>
                  <input value={d.website} onChange={(e) => set("website", e.target.value)} placeholder="nordkai.ee" className={inputClass} />
                </Field>
                <FieldGroup label="Industry">
                  <Select label="Industry" value={d.industry} onChange={(v) => set("industry", v)} options={INDUSTRIES.map((i) => ({ value: i, label: i }))} />
                </FieldGroup>
                <Field label="City or region" optionalTag>
                  <input value={d.location} onChange={(e) => set("location", e.target.value)} placeholder="Tallinn" className={inputClass} />
                </Field>
              </div>
              <FieldGroup label="Company size" help="People, roughly.">
                <Chips options={SIZES} value={d.size ? [d.size] : []} onChange={(v) => set("size", v[0] ?? "")} single />
              </FieldGroup>
            </>
          )}

          {current.id === "offer" && (
            <>
              <Field label="What you do, in 2–3 sentences" help={<span className="flex flex-wrap items-center justify-between gap-2"><span>Shown to a buyer after you both agree. Say who you help and with what.</span><LengthMeter length={d.summary.trim().length} min={40} /></span>}>
                <textarea
                  value={d.summary}
                  onChange={(e) => set("summary", e.target.value)}
                  rows={4}
                  placeholder="We replace paper back-office processes for logistics companies with 50–300 people. Most projects cut manual handling by 70% in the first quarter."
                  className={`${inputClass} h-auto resize-y py-3 leading-relaxed`}
                />
              </Field>
              <Field label="Services" help="Type one and press Enter.">
                <TagInput value={d.services} onChange={(v) => set("services", v)} placeholder="Customs automation" />
              </Field>
              <Field label="Keywords" optionalTag help="Words a buyer might use for their problem.">
                <TagInput value={d.keywords} onChange={(v) => set("keywords", v)} placeholder="paperwork, filings, ERP" />
              </Field>
              <Field label="Industries you know best" optionalTag>
                <TagInput value={d.industriesServed} onChange={(v) => set("industriesServed", v)} placeholder="Logistics" />
              </Field>
              <FieldGroup label="What you can offer" help="Buyers can require these. If you meet one, tick it.">
                <Chips options={REQUIREMENTS} value={d.capabilities} onChange={(v) => set("capabilities", v)} />
              </FieldGroup>
            </>
          )}

          {current.id === "terms" && (
            <>
              <Field label="Smallest deal you take" help="Buyers below this are filtered out. They never learn the number, and neither do you learn theirs.">
                <Money label="Smallest deal you take" amount={d.floorAmount} period={d.floorPeriod} onAmount={(v) => set("floorAmount", v)} onPeriod={(v) => set("floorPeriod", v)} placeholder="5 000" />
              </Field>
              <FieldGroup label="Contract formats you accept" help="A deal needs at least one format both sides accept.">
                <Chips options={FORMATS} value={d.sellerFormats} onChange={(v) => set("sellerFormats", v)} />
              </FieldGroup>
              <FieldGroup label="Free to start from">
                <DatePick value={d.availableFrom} onChange={(v) => set("availableFrom", v)} />
              </FieldGroup>
            </>
          )}

          {current.id === "buying" && (
            <>
              <Field label="Typical budget ceiling" optionalTag help="The most you would usually spend on one problem. Sellers never see it.">
                <Money label="Typical budget ceiling" amount={d.ceilingAmount} period={d.ceilingPeriod} onAmount={(v) => set("ceilingAmount", v)} onPeriod={(v) => set("ceilingPeriod", v)} placeholder="20 000" />
              </Field>
              <FieldGroup label="Contract formats you would consider">
                <Chips options={FORMATS} value={d.buyerFormats} onChange={(v) => set("buyerFormats", v)} />
              </FieldGroup>
              <FieldGroup label="Always required from a supplier">
                <Chips options={REQUIREMENTS} value={d.mustHaves} onChange={(v) => set("mustHaves", v)} />
              </FieldGroup>
              <Field label="Dealbreakers" optionalTag help="Anything that rules a supplier out. Your agent checks these in the negotiation.">
                <TagInput value={d.dealbreakers} onChange={(v) => set("dealbreakers", v)} placeholder="No offshore subcontracting" />
              </Field>
            </>
          )}

          {current.id === "ready" && (
            <ul className="divide-y divide-line">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${c.done ? "bg-accent text-surface" : "bg-ink/[0.06] text-ink-faint"}`}>
                    {c.done ? "✓" : ""}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[15px] font-semibold ${c.done ? "text-ink-soft line-through decoration-ink-faint/60" : ""}`}>{c.label}</p>
                    <p className="text-[13px] text-ink-soft">{c.why}</p>
                  </div>
                  {!c.done && (
                    <button type="button" onClick={() => goTo(c.step)} className="shrink-0 cursor-pointer rounded-full bg-ink/[0.05] px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-ink/[0.09]">
                      Fill in
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

        </Bezel>

        <p className="mt-6 text-center text-[13px] text-ink-faint">
          <button type="button" onClick={leave} disabled={saving} className="cursor-pointer underline-offset-4 hover:text-ink hover:underline">Finish later</button>. Your progress is kept.
        </p>
      </section>
    </div>
  );
}
