"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  draftCompanyProfile,
  draftCompanyProfileFromText,
  saveCompany,
} from "@/actions/company";
import { Button, Icon, TagInput } from "@/components/ui";
import { Cloud, Pills, Swap, bare } from "@/components/cloud";
import { RemoteLogo } from "@/components/RemoteLogo";
import type { CompanyDraft, Requirement } from "@/types";
import {
  REQUIREMENTS,
  ROLES,
  SIZES,
  applyAutofill,
  profileFromDraft,
  sellerTermsFromDraft,
  sells,
  type Draft,
} from "../onboarding/fields";

type Source = "site" | "text";
type Panel = "head" | "about" | "offer";
type Autofill =
  | { state: "idle" }
  | { state: "running"; source: Source; started: number }
  | { state: "done"; from: string }
  | { state: "error"; message: string };

/**
 * Starting points for "what you offer". The list is deliberately across industries — this
 * product is for a drone startup, a print shop and a telco alike — and a company adds its own
 * whenever none of these is what it sells.
 */
const SUGGESTED = [
  "Custom software",
  "Mobile apps",
  "Websites & e-commerce",
  "Data & analytics",
  "AI & automation",
  "IT support",
  "Cloud & hosting",
  "Cybersecurity",
  "Telecoms",
  "Hardware & devices",
  "Manufacturing",
  "Logistics & delivery",
  "Warehousing",
  "Printing",
  "Construction & fit-out",
  "Design & branding",
  "Marketing & PR",
  "Sales & lead generation",
  "Recruitment",
  "Training",
  "Accounting & payroll",
  "Legal",
  "Consulting",
  "Facilities & cleaning",
  "Equipment rental",
  "Wholesale & retail",
];

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

/** Exactly what saveCompany() receives. */
function payload(d: Draft) {
  return {
    name: d.name.trim(),
    website: d.website.trim() || null,
    role: d.role ?? ("both" as const),
    // Every profile field, laid over what was stored: saving one block never wipes another.
    profile_json: profileFromDraft(d),
    seller_terms: sells(d.role) ? sellerTermsFromDraft(d) : null,
  };
}

const monogram = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "CD";

/**
 * The company profile, read as a profile: what a counterparty would see, laid out as facts.
 * Each block is edited in place behind its own pencil, so the page is never a form until asked.
 */
export function CompanyForm({
  initial,
  demo = false,
}: {
  initial: Draft;
  /** Straight from sign-up: lead with what is still missing. */
  /** Filled with a made-up company for looking at the screen. Nothing is stored. */
  demo?: boolean;
}) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(initial);
  const [kept, setKept] = useState<Draft>(initial);
  const [editing, setEditing] = useState<Panel | null>(null);
  const [source, setSource] = useState<Source>(
    initial.website ? "site" : "text",
  );
  const [pasted, setPasted] = useState("");
  /**
   * Services in this company's own words, kept apart from the standard list. Held in state so
   * that switching one off does not delete the option — otherwise a wrong-looking line read off
   * the site could be turned off once and never turned back on.
   */
  const [ownOptions, setOwnOptions] = useState<string[]>(
    initial.services.filter((x) => !SUGGESTED.includes(x)),
  );
  const [ownFromSite, setOwnFromSite] = useState(false);
  const [fill, setFill] = useState<Autofill>({ state: "idle" });
  const [evidence, setEvidence] = useState<
    Partial<Record<Requirement, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((prev) => ({ ...prev, [k]: v }));
  const running = fill.state === "running";

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [running]);

  // Straight from sign-up the profile is empty and the website is the only thing known, so the
  // read starts itself here rather than behind a button nobody was told to press. Everything it
  // can do next — the steps, the filled profile, the reason it failed — is already on this page.
  const started = useRef(false);
  useEffect(() => {
    const blank =
      !initial.industry && !initial.summary && !initial.services.length;
    if (demo || started.current || !blank || !initial.website.trim()) return;
    started.current = true;
    void autofill("site");
    // Runs once, on the first render after sign-up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function autofill(from: Source) {
    if (running) return;
    const site = d.website.trim();
    if (from === "site" && !site)
      return setFill({ state: "error", message: "Add your website first." });
    setFill({ state: "running", source: from, started: Date.now() });
    try {
      // Expected failures come back as data: a Server Action's thrown message is stripped in
      // production, so an unreadable site would otherwise surface as a React error code.
      const result =
        from === "site"
          ? await draftCompanyProfile(site)
          : await draftCompanyProfileFromText(pasted);
      if (!result.ok)
        return setFill({ state: "error", message: result.message });
      const draft: CompanyDraft = result.data;
      // The name the person typed stays theirs; the draft fills everything else.
      setD((prev) => ({
        ...applyAutofill(prev, draft),
        name: prev.name || draft.profile.name,
      }));
      setEvidence(
        Object.fromEntries(
          draft.seller_terms.capabilities.map((c, i) => [
            c,
            draft.evidence[i] ?? "",
          ]),
        ),
      );
      // Whatever the draft called its services in the company's own words stays its own group,
      // so the person checks those rather than hunting for them among 26 stock categories.
      const drafted = draft.profile.services.filter((x) => !SUGGESTED.includes(x));
      if (drafted.length) {
        setOwnOptions((prev) => [...new Set([...prev, ...drafted])]);
        setOwnFromSite(from === "site");
      }
      setFill({
        state: "done",
        from:
          from === "site"
            ? `${draft.pages_read.length} pages of ${site}`
            : "your text",
      });
    } catch (e) {
      setFill({
        state: "error",
        message: e instanceof Error ? e.message : "Autofill failed.",
      });
    }
  }

  async function save() {
    const next = payload(d);
    if (!next.name) return setNote("Add a company name.");
    if (demo) {
      setKept(d);
      setEditing(null);
      return setNote("Nothing is stored in the demo.");
    }
    setSaving(true);
    setNote(null);
    try {
      await saveCompany(next);
      setKept(d);
      setEditing(null);
      if (!running) setFill({ state: "idle" });
      router.refresh();
    } catch (e) {
      setNote(
        `Could not save: ${
          e instanceof Error ? e.message : "unknown error"
        }. Your changes are still here.`,
      );
    } finally {
      setSaving(false);
    }
  }

  const cancel = () => {
    setD(kept);
    setEditing(null);
    setNote(null);
    if (!running) setFill({ state: "idle" });
  };

  // Options keep every own-words service ever seen, selected or not, so one can be switched
  // back on after being switched off.
  const ownServices = [
    ...new Set([...ownOptions, ...d.services.filter((x) => !SUGGESTED.includes(x))]),
  ];

  const elapsed =
    fill.state === "running" ? Math.max(0, (now - fill.started) / 1000) : 0;
  const role = ROLES.find((r) => r.value === d.role);

  // Without a website there is nothing to read: the button opens the field to add one.
  const readSite = () => {
    if (!d.website.trim()) return setEditing("head");
    setSource("site");
    void autofill("site");
  };

  // Named steps while it runs, then what it read or why it failed. Shown under the header, and
  // inside About when that block is open, so the result is visible wherever the read started.
  const progress = (
    <>
      {fill.state === "running" && (
        <ol aria-live="polite" className="flex flex-col gap-2 text-[13.5px]">
          {RUN_STEPS[fill.source]
            .filter((s) => s.at <= elapsed)
            .map((s, i, shown) => {
              const current = i === shown.length - 1;
              return (
                <li
                  key={s.label}
                  className={`flex items-center gap-2.5 ${
                    current ? "font-semibold text-ink" : "text-ink-soft"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${
                      current ? "animate-pulse bg-ink" : "bg-accent"
                    }`}
                  />
                  {s.label}
                </li>
              );
            })}
        </ol>
      )}
      {fill.state === "done" && (
        <p role="status" className="text-[13.5px] text-ink-soft">
          Filled from {fill.from}. Check it before you save.
        </p>
      )}
      {fill.state === "error" && (
        <p
          role="alert"
          className="rounded-[18px] bg-danger/10 px-4 py-3 text-[13.5px] text-danger"
        >
          {fill.message} Paste a description instead, or write it yourself.
        </p>
      )}
    </>
  );

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col px-4 pb-16 pt-6 md:px-9 md:pt-8">
      <Swap token={editing === "head" ? "head-edit" : "head-read"}>
        {editing === "head" ? (
          <section className="flex flex-col gap-5 pb-9">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Cloud label="Company name">
                <input
                  value={d.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Nordkai Logistics OÜ"
                  className={bare}
                />
              </Cloud>
              <Cloud label="Industry">
                <input
                  value={d.industry}
                  onChange={(e) => set("industry", e.target.value)}
                  placeholder="Road freight logistics"
                  className={bare}
                />
              </Cloud>
              <Cloud label="Website">
                <input
                  value={d.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="nordkai.ee"
                  className={bare}
                />
              </Cloud>
            </div>
            <Group label="Company size">
              <Pills
                options={SIZES}
                value={d.size ? [d.size] : []}
                onChange={(v) => set("size", v.find((x) => x !== d.size) ?? "")}
              />
            </Group>
            <Group label="What brings you here?">
              <Pills
                options={ROLES.map((r) => ({ value: r.value, label: r.title }))}
                value={d.role ? [d.role] : []}
                onChange={(v) =>
                  set(
                    "role",
                    (v.find((x) => x !== d.role) ?? null) as Draft["role"],
                  )
                }
              />
            </Group>
            <Buttons onSave={save} onCancel={cancel} saving={saving} />
          </section>
        ) : (
          <div className="flex flex-col gap-6 pb-9">
            <section className="flex items-start gap-5">
              {d.logoUrl ? (
                <span className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-[14px] bg-surface ring-1 ring-ink/[0.08]">
                  <RemoteLogo url={d.logoUrl} name={d.name} className="p-2" />
                </span>
              ) : (
                <span
                  aria-hidden
                  className="grid h-16 w-16 flex-none place-items-center rounded-[14px] bg-ink text-[20px] font-semibold text-surface"
                >
                  {monogram(d.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">
                  {d.name || "Your company"}
                </h1>
                {d.industry && (
                  <p className="mt-2 max-w-[60ch] text-[16px] leading-snug text-ink-soft">
                    {d.industry}
                  </p>
                )}
                {!d.industry && !d.size && !d.website && (
                  <p className="mt-2 text-[15px] text-ink-faint">
                    Nothing filled in yet
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={readSite}
                disabled={running}
                aria-label="Read my website"
                className="flex-none"
              >
                <Icon name="globe" size={15} />
                <span className="hidden sm:inline">
                  {running ? "Reading…" : "Read my website"}
                </span>
              </Button>
              <Pencil
                label="Edit company details"
                onClick={() => setEditing("head")}
              />
            </section>
            {(d.industry || d.size || d.website) && (
              <dl className="grid gap-x-8 gap-y-6 border-t border-line pt-6 sm:grid-cols-3">
                {d.size && (
                  <Spec label="Company size" icon="users">
                    {headcount(d.size)}
                  </Spec>
                )}
                {role && <Spec label="What brings you here?">{role.title}</Spec>}
                {d.website && (
                  <Spec
                    label="Website"
                    icon="globe"
                    href={`https://${d.website.replace(/^https?:\/\//, "")}`}
                  >
                    {d.website.replace(/^https?:\/\//, "")}
                  </Spec>
                )}
              </dl>
            )}
          </div>
        )}
      </Swap>

      {/* A read started from the header: its steps, then Save or Cancel for what it filled. */}
      {fill.state !== "idle" && editing !== "about" && (
        <section className="-mt-3 flex flex-col gap-3 pb-9">
          {progress}
          {fill.state === "done" && (
            <Buttons onSave={save} onCancel={cancel} saving={saving} />
          )}
        </section>
      )}

      <Block
        title="About"
        editing={editing === "about"}
        onEdit={() => setEditing("about")}
      >
        {editing === "about" ? (
          <div className="flex flex-col gap-5">
            <Cloud span label="About">
              <textarea
                value={d.summary}
                onChange={(e) => set("summary", e.target.value)}
                rows={4}
                placeholder="We move palletised freight between the Baltics and the Nordics."
                className={`${bare} resize-y leading-relaxed`}
              />
            </Cloud>

            <div className="flex flex-col gap-3 px-1">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => autofill(source)}
                  disabled={running}
                >
                  {running
                    ? "Reading…"
                    : source === "site"
                      ? "Read my website"
                      : "Read the text"}
                </Button>
                <button
                  type="button"
                  onClick={() => setSource(source === "site" ? "text" : "site")}
                  className="cursor-pointer text-[13px] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {source === "site"
                    ? "Paste a description instead"
                    : "Use my website instead"}
                </button>
              </div>
              {source === "text" && (
                <textarea
                  aria-label="Text about your company"
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  rows={4}
                  placeholder="Paste an about-us page, a one-pager, or your LinkedIn company page."
                  className={`${bare} rounded-[20px] bg-surface px-4 py-3 leading-relaxed ring-1 ring-ink/[0.08]`}
                />
              )}
              {progress}
            </div>
            <Buttons onSave={save} onCancel={cancel} saving={saving} />
          </div>
        ) : (
          <div className="flex max-w-[68ch] flex-col gap-4">
            {d.summary ? (
              paragraphs(d.summary).map((para, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-ink">
                  {para}
                </p>
              ))
            ) : (
              <Empty>Add a description</Empty>
            )}
          </div>
        )}
      </Block>

      {sells(d.role) && (
        <Block
          title="Services"
          editing={editing === "offer"}
          onEdit={() => setEditing("offer")}
        >
          {editing === "offer" ? (
            <div className="flex flex-col gap-6">
              {/* Read from the site, in the company's own words: a different altitude from the
                  stock categories, so it reads as a separate thing to confirm. */}
              {ownServices.length > 0 && (
                <Cloud
                  span
                  label={ownFromSite ? "From your website — check these" : "In your own words"}
                >
                  <Pills
                    options={ownServices.map((x) => ({ value: x, label: x }))}
                    value={d.services}
                    onChange={(v) => set("services", v)}
                  />
                </Cloud>
              )}
              <Cloud span label="Categories buyers search by">
                <Pills
                  options={SUGGESTED.map((x) => ({ value: x, label: x }))}
                  value={d.services}
                  onChange={(v) => set("services", v)}
                />
              </Cloud>
              <Cloud span label="Something else">
                <TagInput
                  shape=""
                  value={d.services.filter((x) => !SUGGESTED.includes(x))}
                  onChange={(own) =>
                    set("services", [
                      ...d.services.filter((x) => SUGGESTED.includes(x)),
                      ...own,
                    ])
                  }
                  placeholder="Drone surveying"
                />
              </Cloud>
              {d.capabilities.some((c) => evidence[c]) && (
                <ul className="flex flex-col gap-1 px-1 text-[12.5px] text-ink-soft">
                  {d.capabilities
                    .filter((c) => evidence[c])
                    .map((c) => (
                      <li key={c}>
                        <span className="font-semibold text-ink">
                          {REQUIREMENTS.find((r) => r.value === c)?.label}
                        </span>{" "}
                        — from {evidence[c]}
                      </li>
                    ))}
                </ul>
              )}
              <Buttons onSave={save} onCancel={cancel} saving={saving} />
            </div>
          ) : d.services.length ? (
            <Tags items={d.services} />
          ) : (
            <Empty>Add categories</Empty>
          )}
        </Block>
      )}

      {note && (
        <p role="status" className="px-1 text-[13.5px] text-ink-soft">
          {note}
        </p>
      )}
    </main>
  );
}

/**
 * One labelled fact. A value with no label — "on-demand mobility and delivery platform" on its
 * own — leaves the reader guessing what it answers, so every cell says what it is.
 */
function Spec({
  label,
  icon,
  href,
  children,
}: {
  label: string;
  icon?: "users" | "globe";
  href?: string;
  children: React.ReactNode;
}) {
  const value = (
    <>
      {icon && <Icon name={icon} size={15} />}
      <span className="min-w-0">{children}</span>
    </>
  );
  return (
    <div className="min-w-0 sm:border-l sm:border-line sm:pl-5 sm:first:border-l-0 sm:first:pl-0 lg:border-l lg:pl-5 lg:first:border-l-0 lg:first:pl-0">
      <dt className="text-[12.5px] font-medium uppercase tracking-[0.06em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1.5">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-0 items-center gap-2 text-[15px] text-ink underline-offset-4 transition-colors hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="inline-flex min-w-0 items-start gap-2 text-[15px] leading-snug text-ink">
            {value}
          </span>
        )}
      </dd>
    </div>
  );
}

/**
 * The description, in paragraphs. New profiles come back as blank-line paragraphs; one written
 * before that, or pasted as a single block, is cut after every second sentence so it is read
 * rather than skipped.
 */
function paragraphs(text: string): string[] {
  const written = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (written.length > 1) return written;

  const sentences = text.trim().match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text.trim()];
  if (sentences.length < 3) return [text.trim()];
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += 2)
    out.push(
      sentences
        .slice(i, i + 2)
        .join("")
        .trim(),
    );
  return out;
}

/** "51–200" is a bucket and needs the word; anything a site said in its own words does not. */
function headcount(size: string) {
  return /^[\d\s–\-+]+$/.test(size) ? `${size} people` : size;
}

/** One block of the profile: a heading, its pencil, and whatever it is showing. */
function Block({
  id,
  title,
  note,
  editing,
  onEdit,
  children,
}: {
  id?: string;
  title: string;
  note?: string;
  editing: boolean;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id ? `block-${id}` : undefined}
      className="grid scroll-mt-6 gap-x-10 gap-y-5 border-t border-line py-9 md:grid-cols-[minmax(200px,260px)_minmax(0,1fr)_auto]"
    >
      <div className="min-w-0">
        <h2 className="text-[19px] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {note && (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
            {note}
          </p>
        )}
      </div>
      <div className={`min-w-0 ${editing ? "md:col-span-2" : ""}`}>
        <Swap token={editing ? "edit" : "read"}>{children}</Swap>
      </div>
      <div>
        {!editing && (
          <Pencil label={`Edit ${title.toLowerCase()}`} onClick={onEdit} />
        )}
      </div>
    </section>
  );
}

/** The only way into edit mode. Quiet until you go near it. */
function Pencil({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 flex-none cursor-pointer place-items-center rounded-full text-ink-faint transition-colors hover:bg-ink/[0.06] hover:text-ink"
    >
      <Icon name="pencil" size={17} />
    </button>
  );
}

function Buttons({
  onSave,
  onCancel,
  saving,
}: {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-1">
      <Button onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
      <Button variant="quiet" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2.5">
      <span className="px-1 text-[14px] font-semibold tracking-[-0.01em] text-ink">
        {label}
      </span>
      {children}
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((t) => (
        <li
          key={t}
          className="rounded-full bg-ink/[0.05] px-3.5 py-1.5 text-[13px] font-medium text-ink"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <span className="text-[15px] text-ink-faint">{children}</span>;
}
