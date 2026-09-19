"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { draftCompanyProfile, draftCompanyProfileFromText, saveCompany } from "@/actions/company";
import { Bezel, Chips, Field, FieldGroup, PillButton, Segmented, TagInput, inputClass } from "@/components/premium";
import type { CompanyDraft, Requirement } from "@/types";
import { FORMATS, PERIODS, REQUIREMENTS, ROLES, SIZES, applyAutofill, sellerTermsFromDraft, sells, type Draft, type Period } from "./fields";

type Source = "site" | "text";
type Autofill =
  | { state: "idle" }
  | { state: "running"; source: Source; started: number }
  | { state: "done"; from: string }
  | { state: "error"; message: string };

const SOURCES = [
  { value: "site", label: "From website" },
  { value: "text", label: "Paste text" },
] as const;

/** Named steps instead of a spinner; each shows once its time has passed. */
const RUN_STEPS: Record<Source, { at: number; label: string }[]> = {
  site: [
    { at: 0, label: "Opening the site" },
    { at: 3, label: "Reading about and services pages" },
    { at: 8, label: "Drafting your profile" },
  ],
  text: [
    { at: 0, label: "Reading your text" },
    { at: 3, label: "Drafting your profile" },
  ],
};

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
  // Dates are fixed at first render, so the picks do not shift while the form is open.
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

/** Exactly what saveCompany() receives. */
function payload(d: Draft) {
  return {
    name: d.name.trim(),
    website: d.website.trim() || null,
    role: d.role ?? ("both" as const),
    profile_json: {
      name: d.name.trim(),
      industry: d.industry.trim(),
      size_hint: d.size,
      services: d.services,
      keywords: d.keywords,
      summary: d.summary.trim(),
    },
    seller_terms: sells(d.role) ? sellerTermsFromDraft(d) : null,
  };
}

/**
 * Company setup on one screen: autofill from the website or pasted text, check the draft, go.
 * `autoSite` is the domain behind a work email; with no saved company it is read on arrival.
 */
export function Wizard({ initial, autoSite, openTerms = false }: { initial: Draft; autoSite: string | null; openTerms?: boolean }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(() => ({ ...initial, website: initial.website || autoSite || "" }));
  const [source, setSource] = useState<Source>("site");
  const [pasted, setPasted] = useState("");
  const [fill, setFill] = useState<Autofill>({ state: "idle" });
  const [evidence, setEvidence] = useState<Partial<Record<Requirement, string>>>({});
  const [termsOpen, setTermsOpen] = useState(openTerms);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const termsRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const running = fill.state === "running";

  async function autofill(from: Source) {
    if (running) return;
    const site = d.website.trim();
    if (from === "site" && !site) return setFill({ state: "error", message: "Enter your website first." });
    setFill({ state: "running", source: from, started: Date.now() });
    try {
      const draft: CompanyDraft = from === "site" ? await draftCompanyProfile(site) : await draftCompanyProfileFromText(pasted);
      setD((prev) => applyAutofill(prev, draft));
      setEvidence(Object.fromEntries(draft.seller_terms.capabilities.map((c, i) => [c, draft.evidence[i] ?? ""])));
      setFill({ state: "done", from: from === "site" ? `${draft.pages_read.length} pages of ${site}` : "your text" });
    } catch (e) {
      setFill({ state: "error", message: e instanceof Error ? e.message : "Autofill failed." });
    }
  }

  // A work email with nothing saved yet: start reading the site right away, no click needed.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !autoSite || initial.name) return;
    started.current = true;
    void autofill("site");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on arrival
  }, []);

  // Ticks the named steps while autofill runs.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (openTerms) termsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openTerms]);

  async function finish() {
    const next = payload(d);
    if (!next.name) {
      setSaveNote("Add a company name, or use autofill above.");
      return;
    }
    setSaving(true);
    setSaveNote(null);
    try {
      await saveCompany(next);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setSaveNote(`Could not save: ${e instanceof Error ? e.message : "unknown error"}. Your answers are still here.`);
      setSaving(false);
    }
  }

  const elapsed = fill.state === "running" ? Math.max(0, (now - fill.started) / 1000) : 0;

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6 px-4 pb-32 pt-4 md:px-8">
      <header className="soft-in">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">Set up your company</h1>
        <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-ink-soft">
          Point us at your website or paste a description. We fill in the profile; you check it.
        </p>
      </header>

      {/* Autofill */}
      <Bezel className="soft-in" inner="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] font-bold">Autofill</p>
          <Segmented label="Autofill source" value={source} onChange={setSource} options={SOURCES} />
        </div>

        {source === "site" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              aria-label="Company website"
              value={d.website}
              onChange={(e) => set("website", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && autofill("site")}
              placeholder="nordkai.ee"
              className={`${inputClass} flex-1`}
            />
            <PillButton type="button" onClick={() => autofill("site")} disabled={running}>
              {running ? "Reading…" : "Autofill"}
            </PillButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              aria-label="Text about your company"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={5}
              placeholder="Paste an about-us page, a one-pager or pitch deck copied out of a PDF, or your LinkedIn company page."
              className={`${inputClass} h-auto resize-y py-3 leading-relaxed`}
            />
            <PillButton type="button" className="self-end" onClick={() => autofill("text")} disabled={running || pasted.trim().length < 80}>
              {running ? "Reading…" : "Autofill"}
            </PillButton>
          </div>
        )}

        {fill.state === "running" && (
          <ol aria-live="polite" className="flex flex-col gap-2 text-[13.5px]">
            {RUN_STEPS[fill.source].filter((s) => s.at <= elapsed).map((s, i, shown) => {
              const current = i === shown.length - 1;
              return (
                <li key={s.label} className={`flex items-center gap-2.5 ${current ? "font-semibold text-ink" : "text-ink-soft"}`}>
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${current ? "animate-pulse bg-ink" : "bg-accent"}`} />
                  {s.label}
                </li>
              );
            })}
          </ol>
        )}
        {fill.state === "done" && (
          <p role="status" className="text-[13.5px] text-ink-soft">
            Filled from {fill.from}. Check the profile below and correct anything that is wrong.
          </p>
        )}
        {fill.state === "error" && (
          <p role="alert" className="rounded-2xl bg-gold-soft px-4 py-3 text-[13.5px] text-ink">
            {fill.message} You can paste a description instead, or fill the profile by hand.
          </p>
        )}
      </Bezel>

      {/* Profile */}
      <Bezel className="soft-in" inner="flex flex-col gap-7 p-6 sm:p-8">
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
          <Field label="Industry">
            <input value={d.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Road freight logistics" className={inputClass} />
          </Field>
        </div>

        <FieldGroup label="Company size" help="People, roughly.">
          <Chips options={SIZES} value={d.size ? [d.size] : []} onChange={(v) => set("size", v[0] ?? "")} single />
        </FieldGroup>

        {sells(d.role) && (
          <>
            <Field label="What you do, in 2–3 sentences" help={<span className="flex flex-wrap items-center justify-between gap-2"><span>The matcher reads this against buyers&rsquo; problems.</span><LengthMeter length={d.summary.trim().length} min={40} /></span>}>
              <textarea
                value={d.summary}
                onChange={(e) => set("summary", e.target.value)}
                rows={3}
                placeholder="We replace paper back-office processes for logistics companies with 50–300 people."
                className={`${inputClass} h-auto resize-y py-3 leading-relaxed`}
              />
            </Field>
            <Field label="Services" help="Type one and press Enter.">
              <TagInput value={d.services} onChange={(v) => set("services", v)} placeholder="Customs automation" />
            </Field>
            <FieldGroup label="What you can offer" help="Buyers can require these. Tick what you meet.">
              <Chips options={REQUIREMENTS} value={d.capabilities} onChange={(v) => set("capabilities", v)} />
              {d.capabilities.some((c) => evidence[c]) && (
                <ul className="mt-1 flex flex-col gap-1 text-[12.5px] text-ink-soft">
                  {d.capabilities.filter((c) => evidence[c]).map((c) => (
                    <li key={c}>
                      <span className="font-semibold text-ink">{REQUIREMENTS.find((r) => r.value === c)?.label}</span> — from {evidence[c]}
                    </li>
                  ))}
                </ul>
              )}
            </FieldGroup>
          </>
        )}
      </Bezel>

      {/* Working terms: optional, asked again by a match when it needs them */}
      {sells(d.role) && (
        <div ref={termsRef} className="soft-in scroll-mt-6">
          <Bezel inner="flex flex-col gap-7 p-6 sm:p-8">
            <button
              type="button"
              aria-expanded={termsOpen}
              onClick={() => setTermsOpen((o) => !o)}
              className="-m-2 flex cursor-pointer items-center gap-3 rounded-2xl p-2 text-left"
            >
              <span className="flex-1">
                <span className="block text-[15px] font-bold">Working terms <span className="font-normal text-ink-faint">optional</span></span>
                <span className="mt-1 block text-[13px] text-ink-soft">Never shown. The platform compares them with a buyer&rsquo;s and says only whether they fit.</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden className={`shrink-0 transition-transform duration-300 ${termsOpen ? "rotate-180" : ""}`}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {termsOpen && (
              <>
                <Field label="Smallest deal you take" help="Buyers below this are filtered out. They never learn the number, and you never learn theirs.">
                  <Money label="Smallest deal you take" amount={d.floorAmount} period={d.floorPeriod} onAmount={(v) => set("floorAmount", v)} onPeriod={(v) => set("floorPeriod", v)} placeholder="5 000" />
                </Field>
                <FieldGroup label="Contract formats you accept">
                  <Chips options={FORMATS} value={d.sellerFormats} onChange={(v) => set("sellerFormats", v)} />
                </FieldGroup>
                <FieldGroup label="Free to start from">
                  <DatePick value={d.availableFrom} onChange={(v) => set("availableFrom", v)} />
                </FieldGroup>
              </>
            )}
          </Bezel>
        </div>
      )}

      {/* One action, always in reach */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[860px] flex-wrap items-center gap-3 px-4 py-3 md:px-8">
          {saveNote ? (
            <p role="status" className="min-w-0 flex-1 text-[13.5px] text-ink">{saveNote}</p>
          ) : (
            <p className="min-w-0 flex-1 text-[13px] text-ink-faint">Everything can be changed later.</p>
          )}
          <PillButton type="button" onClick={finish} disabled={saving || running}>
            {saving ? "Saving…" : "Go to dashboard"}
          </PillButton>
        </div>
      </div>
    </div>
  );
}
