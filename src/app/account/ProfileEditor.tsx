"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { draftCompanyProfile, saveCompany } from "@/actions/company";
import { Button, Card, Field, TagInput, inputClass } from "@/components/ui";
import type { CompanyProfile, CompanyRole } from "@/types";

interface Props {
  company: { name: string; website: string | null; role: CompanyRole; profile: Partial<CompanyProfile> };
}

/**
 * The quick details: who you are, where, how big, in which languages. Services, terms and deals
 * are edited elsewhere (Company, Offers); this saves the profile without touching them.
 */
export function ProfileEditor({ company }: Props) {
  const router = useRouter();
  const [name, setName] = useState(company.name);
  const [website, setWebsite] = useState(company.website ?? "");
  const [p, setP] = useState<Partial<CompanyProfile>>(company.profile);
  const [busy, setBusy] = useState<"save" | "read" | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  const set = <K extends keyof CompanyProfile>(k: K, v: CompanyProfile[K]) => setP((prev) => ({ ...prev, [k]: v }));

  /** Reads the website again and fills what it finds. Anything typed here is kept. */
  async function readSite() {
    if (!website.trim()) return setNote({ tone: "warn", text: "Enter your website first." });
    setBusy("read");
    setNote(null);
    try {
      const d = await draftCompanyProfile(website.trim());
      const f = d.profile;
      setP((prev) => ({
        ...f,
        ...Object.fromEntries(Object.entries(prev).filter(([, v]) => (Array.isArray(v) ? v.length : v !== null && v !== undefined && v !== ""))),
        logo_url: prev.logo_url || f.logo_url,
      }));
      setWebsite(d.website);
      setNote({ tone: "ok", text: `Read ${d.pages_read.length} pages. Empty fields were filled; check them, then save.` });
    } catch (e) {
      setNote({ tone: "warn", text: e instanceof Error ? e.message : "Could not read the site." });
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!name.trim()) return setNote({ tone: "warn", text: "Add a company name." });
    setBusy("save");
    setNote(null);
    try {
      const profile = { name: name.trim(), industry: "", size_hint: "", services: [], keywords: [], summary: "", ...p } as CompanyProfile;
      profile.name = name.trim();
      await saveCompany({ name: name.trim(), website: website.trim() || null, role: company.role, profile_json: profile });
      setNote({ tone: "ok", text: "Saved." });
      router.refresh();
    } catch (e) {
      setNote({ tone: "warn", text: `Could not save: ${e instanceof Error ? e.message : "unknown error"}` });
    } finally {
      setBusy(null);
    }
  }

  const num = (v: string) => (v.replace(/\D/g, "") ? Number(v.replace(/\D/g, "")) : null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="flex flex-col gap-6 p-5 md:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Company name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Website">
            <div className="flex gap-2">
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="nordkai.ee" className={inputClass} />
              <Button variant="ghost" onClick={readSite} disabled={busy !== null} className="flex-none">
                {busy === "read" ? "Reading…" : "Read site"}
              </Button>
            </div>
          </Field>
          <Field label="Industry">
            <input value={p.industry ?? ""} onChange={(e) => set("industry", e.target.value)} placeholder="Road freight logistics" className={inputClass} />
          </Field>
          <Field label="Logo URL" optional help="Found on your website by autofill. Shown only after both sides agree to meet.">
            <input value={p.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value || null)} placeholder="https://…/logo.png" className={inputClass} />
          </Field>
          <Field label="City" optional>
            <input value={p.city ?? ""} onChange={(e) => set("city", e.target.value || null)} placeholder="Tallinn" className={inputClass} />
          </Field>
          <Field label="Country" optional>
            <input value={p.country ?? ""} onChange={(e) => set("country", e.target.value || null)} placeholder="Estonia" className={inputClass} />
          </Field>
          <Field label="People" optional>
            <input inputMode="numeric" value={p.employees ?? ""} onChange={(e) => set("employees", num(e.target.value))} placeholder="45" className={`${inputClass} tabular-nums`} />
          </Field>
          <Field label="Founded" optional>
            <input inputMode="numeric" value={p.founded ?? ""} onChange={(e) => set("founded", num(e.target.value.slice(0, 4)))} placeholder="2014" className={`${inputClass} tabular-nums`} />
          </Field>
        </div>
        <Field label="Languages you work in" help="Type one and press Enter.">
          <TagInput value={p.languages ?? []} onChange={(v) => set("languages", v)} placeholder="Estonian" />
        </Field>
        <Field label="Industries you serve" help="Your clients' industries, not your own.">
          <TagInput value={p.industries_served ?? []} onChange={(v) => set("industries_served", v)} placeholder="Logistics" />
        </Field>
        <Field label="Certifications" optional help="As they are named: ISO 27001, SOC 2, AWS Partner.">
          <TagInput value={p.certifications ?? []} onChange={(v) => set("certifications", v)} placeholder="ISO 27001" />
        </Field>

        <div className="flex items-center justify-end gap-4 border-t border-line pt-5">
          {note && (
            <p role="status" className={`min-w-0 flex-1 text-[13.5px] ${note.tone === "ok" ? "text-ink-soft" : "text-danger"}`}>
              {note.text}
            </p>
          )}
          <Button onClick={save} disabled={busy !== null}>
            {busy === "save" ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Card>

      <aside className="flex flex-col gap-3">
        <Card muted className="p-5 text-[13px] leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">What is shown, and when</p>
          <p className="mt-2">Industry, size, city and languages are shown to the other side of a match from the start.</p>
          <p className="mt-2">Your name, logo and website stay withheld until both sides agree to meet.</p>
          <p className="mt-2">Services, terms and each deal are edited in Company and Offers.</p>
        </Card>
      </aside>
    </div>
  );
}
