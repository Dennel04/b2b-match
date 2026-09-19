import Link from "next/link";
import { redirect } from "next/navigation";
import { getCompanyStats, type CompanyStats } from "@/actions/company";
import { AppShell, initialsOf } from "@/components/layout";
import { Card, Chip } from "@/components/ui";
import { serverClient } from "@/lib/supabase";
import type { CompanyProfile, CompanyRole } from "@/types";
import { ProfileEditor } from "./ProfileEditor";

export const metadata = { title: "Your company — Crossdesk" };

/**
 * The company's own profile, opened from the brand in the sidebar: who you are, how matching is
 * going, and the details that are quick to change. Deals themselves live in Offers.
 * `?tab=settings` opens the settings: the quick details of the profile.
 */
export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const { tab } = await searchParams;
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  // Owner-only read (RLS companies_read_own).
  const { data: company } = await db
    .from("companies")
    .select("name, website, role, profile_json")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!company) redirect("/onboarding");

  const p: Partial<CompanyProfile> = company.profile_json ?? {};
  const editing = tab === "settings";
  const stats = editing ? null : await getCompanyStats();

  return (
    <AppShell active="account" initials={initialsOf(company.name)}>
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 pb-16 pt-6 md:px-9 md:pt-8">
        <Header name={company.name} website={company.website} p={p} email={user.email ?? ""} />

        <nav aria-label="Profile sections" className="-mt-2 flex gap-1 border-b border-line">
          <Tab href="/account" on={!editing}>Overview</Tab>
          <Tab href="/account?tab=settings" on={editing}>Settings</Tab>
        </nav>

        {editing ? (
          <ProfileEditor company={{ name: company.name, website: company.website, role: company.role, profile: p }} />
        ) : (
          <Overview stats={stats!} role={company.role} p={p} />
        )}
      </main>
    </AppShell>
  );
}

function Header({ name, website, p, email }: { name: string; website: string | null; p: Partial<CompanyProfile>; email: string }) {
  const place = [p.city, p.country].filter(Boolean).join(", ");
  const facts = [p.industry, place, p.employees ? `${p.employees.toLocaleString("en-US")} people` : p.size_hint && p.size_hint !== "unknown" ? p.size_hint : null].filter(Boolean);
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-center">
      <Logo name={name} url={p.logo_url} />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">{name}</h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[14px] text-ink-soft">
          {facts.map((f, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-ink-faint">·</span>}
              {f}
            </span>
          ))}
          {website && (
            <>
              {facts.length > 0 && <span aria-hidden className="text-ink-faint">·</span>}
              <a href={website} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-ink hover:underline">
                {website.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </>
          )}
        </p>
      </div>
      <p className="text-[12.5px] text-ink-faint md:text-right">Signed in as {email}</p>
    </header>
  );
}

/** The company's own logo when autofill found one, its initials otherwise. */
function Logo({ name, url }: { name: string; url?: string | null }) {
  return (
    <span className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-[14px] border border-line bg-surface">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- a remote logo from the company's own site
        <img src={url} alt="" className="h-full w-full object-contain p-2" />
      ) : (
        <span className="text-[20px] font-semibold text-ink-soft">{initialsOf(name)}</span>
      )}
    </span>
  );
}

function Tab({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`-mb-px border-b-2 px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
        on ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Overview({ stats, role, p }: { stats: CompanyStats; role: CompanyRole; p: Partial<CompanyProfile> }) {
  const s = stats.asSeller;
  const sells = role !== "buyer";
  const buys = role !== "seller";
  return (
    <div className="flex flex-col gap-8">
      {sells && (
        <Section title="As a vendor" fact="Buyers' problems your profile was matched to">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Times matched" value={s.matched} note={s.last30 ? `${s.last30} in the last 30 days` : "None in the last 30 days"} />
            <Stat label="Negotiations" value={s.negotiated} note={s.negotiated ? `${s.proceed} ended in "proceed"` : "Your agent has not negotiated yet"} />
            <Stat label="Buyers interested" value={s.interested} note="Asked to meet after reading the terms" />
            <Stat label="Meetings" value={s.meetings} note={s.meetings ? "Names shared on both sides" : "None confirmed yet"} state={s.meetings > 0} />
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <Card className="p-5">
              <h3 className="text-[13.5px] font-semibold">Matches per week</h3>
              <p className="mt-0.5 text-[12.5px] text-ink-soft">Last 8 weeks, both sides</p>
              <WeekBars weeks={stats.weekly} />
            </Card>
            <Card className="p-5">
              <h3 className="text-[13.5px] font-semibold">From match to meeting</h3>
              <p className="mt-0.5 text-[12.5px] text-ink-soft">
                {s.avgScore !== null ? `Average fit ${s.avgScore} of 100` : "No matches yet"}
              </p>
              <Funnel
                steps={[
                  ["Matched", s.matched],
                  ["Negotiated", s.negotiated],
                  ["Agents said proceed", s.proceed],
                  ["Buyer interested", s.interested],
                  ["Meeting", s.meetings],
                ]}
              />
            </Card>
          </div>
        </Section>
      )}

      {buys && (
        <Section title="As a buyer" fact="What your problems have found">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Problems written" value={stats.asBuyer.problems} note="Private to your company" />
            <Stat label="Vendors matched" value={stats.asBuyer.matched} note="Across all your problems" />
            <Stat label="Meetings" value={stats.asBuyer.meetings} note="Confirmed by both sides" state={stats.asBuyer.meetings > 0} />
          </div>
        </Section>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <Section title="Before a match" fact="What the other side sees">
          <Card className="p-5">
            <p className="flex items-center gap-2 text-[14.5px] font-semibold">
              <span className="rounded-[3px] bg-ink px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-bg">withheld</span>
              <span className="text-ink-soft">Company name</span>
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13.5px]">
              <Fact k="Industry" v={p.industry} />
              <Fact k="Size" v={p.employees ? `${p.employees.toLocaleString("en-US")} people` : p.size_hint} />
              <Fact k="Based in" v={[p.city, p.country].filter(Boolean).join(", ")} />
              <Fact k="Works in" v={p.languages?.join(", ")} />
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-relaxed text-ink-soft">
              Your name, logo and website are shared only when both sides agree to meet.
            </p>
          </Card>
        </Section>

        <Section title="About" fact={<Link href="/account?tab=settings" className="underline-offset-4 hover:text-ink hover:underline">Edit</Link>}>
          <Card className="flex flex-col gap-4 p-5">
            {p.summary ? <p className="text-[14px] leading-relaxed">{p.summary}</p> : <p className="text-[14px] text-ink-soft">No description yet. Autofill from your website in Settings.</p>}
            <Tags label="Services" items={p.services} />
            <Tags label="Industries served" items={p.industries_served} />
            <Tags label="Certifications" items={p.certifications} />
            {p.founded && <p className="text-[13px] text-ink-soft">Founded {p.founded}</p>}
          </Card>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, fact, children }: { title: string; fact?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        {fact && <span className="ml-auto text-right text-[12.5px] text-ink-soft">{fact}</span>}
      </div>
      {children}
    </section>
  );
}

/** A number is the whole message here, so it is a tile, not a chart. */
function Stat({ label, value, note, state = false }: { label: string; value: number; note: string; state?: boolean }) {
  return (
    <Card className="p-4 md:p-5">
      <p className="text-[12.5px] font-medium text-ink-soft">{label}</p>
      <p className="mt-1.5 flex items-center gap-2 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {value}
        {state && <Chip tone="accent">Confirmed</Chip>}
      </p>
      <p className="mt-2 text-[12px] leading-snug text-ink-faint">{note}</p>
    </Card>
  );
}

/** One series, one hue (ink). Each bar names its week and count on hover and to screen readers. */
function WeekBars({ weeks }: { weeks: CompanyStats["weekly"] }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const label = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <div className="mt-5">
      <ol className="flex h-36 items-end gap-2 border-b border-line" aria-label="Matches per week">
        {weeks.map((w) => (
          <li key={w.start} className="group relative flex h-full flex-1 flex-col justify-end" title={`Week of ${label(w.start)}: ${w.count}`}>
            <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full rounded-[6px] bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-bg opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {w.count}
            </span>
            <span
              className={`block rounded-t-[4px] transition-colors duration-150 ${w.count ? "bg-ink/80 group-hover:bg-ink" : "bg-line"}`}
              style={{ height: w.count ? `${Math.max(4, (w.count / max) * 100)}%` : "2px" }}
            />
            <span className="sr-only">
              Week of {label(w.start)}: {w.count} matches
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-2 flex justify-between text-[11px] text-ink-faint">
        <span>{label(weeks[0].start)}</span>
        <span>This week</span>
      </div>
    </div>
  );
}

/** Each step as a share of the first, with its count at the end of the row. */
function Funnel({ steps }: { steps: [string, number][] }) {
  const top = Math.max(1, steps[0][1]);
  return (
    <ol className="mt-5 flex flex-col gap-3">
      {steps.map(([label, n]) => (
        <li key={label} className="text-[12.5px]">
          <div className="mb-1 flex justify-between">
            <span className="text-ink-soft">{label}</span>
            <span className="font-semibold tabular-nums">{n}</span>
          </div>
          <span className="block h-1.5 overflow-hidden rounded-full bg-surface-alt">
            <span className="block h-full rounded-full bg-ink/80" style={{ width: `${(n / top) * 100}%` }} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function Fact({ k, v }: { k: string; v?: string | null }) {
  return (
    <div>
      <dt className="text-[12px] text-ink-faint">{k}</dt>
      <dd className="mt-0.5 font-medium">{v || <span className="font-normal text-ink-faint">Not set</span>}</dd>
    </div>
  );
}

function Tags({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-2 text-[12px] text-ink-faint">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <span key={t} className="rounded-[7px] border border-line-strong px-2.5 py-1 text-[12.5px]">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
