"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCompany } from "@/actions/company";
import { Bezel, Field, FieldGroup, PillButton, inputClass } from "@/components/premium";
import type { CompanyRole } from "@/types";
import { ROLES } from "./fields";

/**
 * Sign-up asks three things: which side you are on, your name, your website. It does not wait
 * for the site to be read — that happens on /company, where the profile itself shows whether it
 * is still reading, already filled, or could not be read and why. A screen that only waits has
 * nowhere to put that last case.
 */
export function Wizard({ autoSite }: { autoSite: string | null }) {
  const router = useRouter();
  const [role, setRole] = useState<CompanyRole | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState(autoSite ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    // Land on the profile: it reads the site, and lists what the site did not say.
    router.push("/company?welcome");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pb-24 pt-4 md:px-8">
      <header className="soft-in">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">Set up your company</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">Three answers. We read the rest from your website on the next screen.</p>
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
                  className={`flex h-full cursor-pointer flex-col justify-start rounded-3xl px-5 py-4 text-left transition-[background-color,box-shadow,transform] duration-300 active:scale-[0.98] ${
                    on ? "bg-selected text-surface shadow-[0_12px_30px_-16px_rgba(23,47,69,0.6)]" : "bg-surface-alt hover:bg-ink/[0.06]"
                  }`}
                >
                  <p className="text-[15px] font-semibold tracking-[-0.01em]">{r.title}</p>
                  <p className={`mt-0.5 text-pretty text-[13px] ${on ? "text-surface/70" : "text-ink-soft"}`}>{r.text}</p>
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

        {error && <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-[13.5px] text-danger">{error}</p>}

        <div className="flex justify-end border-t border-line pt-5">
          <PillButton type="submit" disabled={busy}>{busy ? "Saving…" : "Continue"}</PillButton>
        </div>
      </Bezel>
    </form>
  );
}
