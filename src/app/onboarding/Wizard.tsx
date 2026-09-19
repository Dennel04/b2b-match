"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { draftCompanyProfile, saveCompany } from "@/actions/company";
import { Bezel, Field, FieldGroup, PillButton, inputClass } from "@/components/premium";
import type { CompanyRole } from "@/types";
import { ROLES } from "./fields";

/** Named steps instead of a spinner; each shows once its time has passed. */
const READ_STEPS = [
  { at: 0, label: "Opening the site" },
  { at: 3, label: "Reading about and services pages" },
  { at: 8, label: "Drafting your company profile" },
  { at: 20, label: "Almost there" },
];

/**
 * Sign-up asks three things: which side you are on, your name, your website. The site is then
 * read once to draft the rest of the profile; everything else is filled in later, on /company.
 */
export function Wizard({ autoSite }: { autoSite: string | null }) {
  const router = useRouter();
  const [role, setRole] = useState<CompanyRole | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState(autoSite ?? "");
  const [reading, setReading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const left = useRef(false);

  useEffect(() => {
    if (!reading) return;
    const started = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - started) / 1000), 500);
    return () => clearInterval(t);
  }, [reading]);

  function done() {
    left.current = true;
    router.push("/dashboard");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Add your company name.");
    const base = { name: name.trim(), website: website.trim() || null, role: role ?? ("both" as const), profile_json: null };
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      await saveCompany(base);
    } catch (err) {
      setBusy(false);
      return setError(`Could not save: ${err instanceof Error ? err.message : "unknown error"}.`);
    }
    if (!base.website) return done();

    // One attempt at reading the site. Whatever happens, the company is already saved.
    setReading(base.website);
    try {
      const draft = await draftCompanyProfile(base.website);
      if (left.current) return;
      await saveCompany({
        ...base,
        website: draft.website,
        profile_json: { ...draft.profile, name: base.name },
        seller_terms: base.role === "buyer" ? null : draft.seller_terms,
      });
    } catch {
      // Unreadable site or model trouble: the dashboard lists what is still missing.
    }
    if (!left.current) done();
  }

  if (reading) {
    const steps = READ_STEPS.filter((s) => s.at <= elapsed);
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6 px-4 pb-24 pt-10">
        <Bezel className="soft-in" inner="flex flex-col gap-6 p-7 sm:p-9">
          <div>
            <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-[-0.03em]">Reading {reading}</h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
              We are drafting your profile from your website so you don&rsquo;t have to type it. About 15 seconds.
            </p>
          </div>
          <ol aria-live="polite" className="flex flex-col gap-2.5 text-[14px]">
            {steps.map((s, i) => {
              const current = i === steps.length - 1;
              return (
                <li key={s.label} className={`flex items-center gap-3 ${current ? "font-semibold text-ink" : "text-ink-soft"}`}>
                  <span aria-hidden className={`h-2 w-2 rounded-full ${current ? "animate-pulse bg-ink" : "bg-accent"}`} />
                  {s.label}
                </li>
              );
            })}
          </ol>
        </Bezel>
        <p className="text-center text-[13px] text-ink-faint">
          <button type="button" onClick={done} className="cursor-pointer underline-offset-4 hover:text-ink hover:underline">
            Skip and fill it in later
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pb-24 pt-4 md:px-8">
      <header className="soft-in">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">Set up your company</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">Three answers. We read the rest from your website.</p>
      </header>

      <Bezel className="soft-in" inner="flex flex-col gap-7 p-6 sm:p-8">
        <FieldGroup label="What brings you here?">
          <div className="grid gap-3 sm:grid-cols-3">
            {ROLES.map((r) => {
              const on = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setRole(on ? null : r.value)}
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
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nordkai Logistics OÜ" autoComplete="organization" className={inputClass} />
          </Field>
          <Field label="Company website" help="We read it once to fill in your profile.">
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="nordkai.ee" inputMode="url" autoComplete="url" className={inputClass} />
          </Field>
        </div>

        {error && <p role="alert" className="rounded-2xl bg-gold-soft px-4 py-3 text-[13.5px] text-ink">{error}</p>}

        <div className="flex justify-end border-t border-line pt-5">
          <PillButton type="submit" disabled={busy}>{busy ? "Saving…" : "Continue"}</PillButton>
        </div>
      </Bezel>
    </form>
  );
}
