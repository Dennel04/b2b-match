"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { draftCompanyProfile, draftCompanyProfileFromText, saveCompany } from "@/actions/company";
import { Button, Card, Chips, Field, FieldGroup, TagInput, inputClass } from "@/components/ui";
import type { CompanyDraft, Requirement } from "@/types";
import { FORMATS, PERIODS, REQUIREMENTS, ROLES, SIZES, applyAutofill, sellerTermsFromDraft, sells, type Draft } from "../onboarding/fields";

type Source = "site" | "text";
type Autofill =
  | { state: "idle" }
  | { state: "running"; source: Source; started: number }
  | { state: "done"; from: string }
  | { state: "error"; message: string };

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

/** Exactly what saveCompany() receives. Compared as JSON to know whether anything changed. */
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

function Toggle<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`cursor-pointer whitespace-nowrap rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
            value === o.value ? "bg-ink text-surface" : "text-ink-soft hover:bg-surface-alt hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Quick picks next to a date: most answers are "now" or "in a few weeks". */
function DatePick({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [picks] = useState(() => {
    const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
    return [
      { value: inDays(0), label: "Right away" },
      { value: inDays(14), label: "In 2 weeks" },
      { value: inDays(30), label: "In a month" },
    ];
  });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chips options={picks} value={value ? [value] : []} onChange={(v) => onChange(v[0] ?? "")} single />
      <input type="date" aria-label="Exact date" value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} h-10 w-auto`} />
    </div>
  );
}

function Section({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        {lead && <p className="mt-0.5 text-[13px] text-ink-soft">{lead}</p>}
      </div>
      <Card className="flex flex-col gap-6 p-5 md:p-6">{children}</Card>
    </section>
  );
}

/** The company profile after sign-up: autofill, the public profile, the private working terms. */
export function CompanyForm({ initial, openTerms = false }: { initial: Draft; openTerms?: boolean }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(payload(initial)));
  const [source, setSource] = useState<Source>(initial.website ? "site" : "text");
  const [pasted, setPasted] = useState("");
  const [fill, setFill] = useState<Autofill>({ state: "idle" });
  const [evidence, setEvidence] = useState<Partial<Record<Requirement, string>>>({});
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const termsRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const running = fill.state === "running";
  const dirty = JSON.stringify(payload(d)) !== saved;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (openTerms) termsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openTerms]);

  async function autofill(from: Source) {
    if (running) return;
    const site = d.website.trim();
    if (from === "site" && !site) return setFill({ state: "error", message: "Enter your website first." });
    setFill({ state: "running", source: from, started: Date.now() });
    try {
      const draft: CompanyDraft = from === "site" ? await draftCompanyProfile(site) : await draftCompanyProfileFromText(pasted);
      // The name the person typed stays theirs; the draft fills everything else.
      setD((prev) => ({ ...applyAutofill(prev, draft), name: prev.name || draft.profile.name }));
      setEvidence(Object.fromEntries(draft.seller_terms.capabilities.map((c, i) => [c, draft.evidence[i] ?? ""])));
      setFill({ state: "done", from: from === "site" ? `${draft.pages_read.length} pages of ${site}` : "your text" });
    } catch (e) {
      setFill({ state: "error", message: e instanceof Error ? e.message : "Autofill failed." });
    }
  }

  async function save() {
    const next = payload(d);
    if (!next.name) return setNote("Add a company name.");
    setSaving(true);
    setNote(null);
    try {
      await saveCompany(next);
      setSaved(JSON.stringify(next));
      setNote("Saved.");
      router.refresh();
    } catch (e) {
      setNote(`Could not save: ${e instanceof Error ? e.message : "unknown error"}. Your changes are still here.`);
    } finally {
      setSaving(false);
    }
  }

  const elapsed = fill.state === "running" ? Math.max(0, (now - fill.started) / 1000) : 0;
  const saveButton = (
    <Button onClick={save} disabled={saving || running || !dirty}>
      {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
    </Button>
  );

  return (
    <main className="mx-auto flex w-full max-w-[880px] flex-col gap-9 px-4 pb-16 pt-6 md:px-9 md:pt-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">Company</h1>
          <p className="mt-2 text-[14px] text-ink-soft">What the matcher knows about you. Your name stays withheld until both sides agree to meet.</p>
        </div>
        <div className="flex-none md:mt-1.5">{saveButton}</div>
      </div>

      <Section title="Autofill" lead="Read your website or pasted text, then check what it filled in below.">
        <Toggle
          label="Autofill source"
          value={source}
          onChange={setSource}
          options={[{ value: "site", label: "From website" }, { value: "text", label: "Paste text" }] as const}
        />
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
            <Button variant="ghost" onClick={() => autofill("site")} disabled={running}>
              {running ? "Reading…" : "Autofill"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              aria-label="Text about your company"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={4}
              placeholder="Paste an about-us page, a one-pager or pitch deck copied out of a PDF, or your LinkedIn company page."
              className={`${inputClass} h-auto resize-y py-3 leading-relaxed`}
            />
            <Button variant="ghost" className="self-end" onClick={() => autofill("text")} disabled={running || pasted.trim().length < 80}>
              {running ? "Reading…" : "Autofill"}
            </Button>
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
          <p role="status" className="text-[13.5px] text-ink-soft">Filled from {fill.from}. Check it below, then save.</p>
        )}
        {fill.state === "error" && (
          <p role="alert" className="rounded-[8px] bg-gold-soft px-4 py-3 text-[13.5px] text-ink">
            {fill.message} Try pasting a description instead, or fill the fields by hand.
          </p>
        )}
      </Section>

      <Section title="Profile" lead="Shown to a company you match with: industry and size first, your name only after both agree.">
        <FieldGroup label="What brings you here?">
          <Chips options={ROLES.map((r) => ({ value: r.value, label: r.title }))} value={d.role ? [d.role] : []} onChange={(v) => set("role", v[0] ?? null)} single />
        </FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Company name">
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
            <Field label="What you do, in 2–3 sentences" help="The matcher reads this against buyers' problems. 40 characters at least.">
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
                <ul className="flex flex-col gap-1 text-[12.5px] text-ink-soft">
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
      </Section>

      {sells(d.role) && (
        <div ref={termsRef} className="scroll-mt-6">
          <Section title="Working terms" lead="Withheld from everyone. The platform compares them with a buyer's and says only whether they fit. Empty means you are not filtered on it.">
            <Field label="Smallest deal you take" optional>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[180px] flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-ink-faint">€</span>
                  <input
                    inputMode="numeric"
                    value={d.floorAmount ? Number(d.floorAmount).toLocaleString("en-US").replace(/,/g, " ") : ""}
                    onChange={(e) => set("floorAmount", e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
                    placeholder="5 000"
                    className={`${inputClass} pl-8 tabular-nums`}
                  />
                </div>
                <Toggle label="Period" value={d.floorPeriod} onChange={(v) => set("floorPeriod", v)} options={PERIODS} />
              </div>
            </Field>
            <FieldGroup label="Contract formats you accept">
              <Chips options={FORMATS} value={d.sellerFormats} onChange={(v) => set("sellerFormats", v)} />
            </FieldGroup>
            <FieldGroup label="Free to start from">
              <DatePick value={d.availableFrom} onChange={(v) => set("availableFrom", v)} />
            </FieldGroup>
          </Section>
        </div>
      )}

      <div className="flex items-center justify-end gap-4 border-t border-line pt-5">
        {note && <p role="status" className="min-w-0 flex-1 text-[13.5px] text-ink-soft">{note}</p>}
        {saveButton}
      </div>
    </main>
  );
}
