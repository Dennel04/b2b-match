import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, initialsOf } from "@/components/layout";
import { RemoteLogo } from "@/components/RemoteLogo";
import { Card, Icon } from "@/components/ui";
import { serverClient } from "@/lib/supabase";

export const metadata = { title: "Directory — Crossdesk" };

/** A row of `directory` (migration 0005): public facts read off the company's own website. */
interface Listed {
  domain: string;
  website: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  summary: string | null;
  city: string | null;
  country: string | null;
  employees: number | null;
  founded: number | null;
  languages: string[];
  industries_served: string[];
  certifications: string[];
}

/**
 * Companies read off their own public websites, so the product is not empty on day one and a
 * user can reach a vendor directly. These companies have not joined: no problems, no terms, no
 * matching. Filters live in the URL (`?q=`, `?country=`), so the page stays a Server Component.
 */
export default async function DirectoryPage({ searchParams }: PageProps<"/directory">) {
  const { q, country } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const place = typeof country === "string" ? country : "";

  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: mine } = await db.from("companies").select("name").eq("owner_id", user.id).limit(1).maybeSingle();

  const { data, error } = await db
    .from("directory")
    .select("domain, website, name, logo_url, industry, summary, city, country, employees, founded, languages, industries_served, certifications")
    .order("name");
  const all = (data ?? []) as Listed[];

  const countries = [...new Set(all.map((c) => c.country).filter((c): c is string => !!c))].sort();
  const needle = query.toLowerCase();
  const rows = all.filter(
    (c) =>
      (!place || c.country === place) &&
      (!needle ||
        [c.name, c.industry, c.summary, ...c.industries_served, ...c.certifications].some((t) => t?.toLowerCase().includes(needle))),
  );
  const href = (next: { q?: string; country?: string }) => {
    const params = new URLSearchParams();
    const nq = "q" in next ? next.q : query;
    const nc = "country" in next ? next.country : place;
    if (nq) params.set("q", nq);
    if (nc) params.set("country", nc);
    const s = params.toString();
    return s ? `/directory?${s}` : "/directory";
  };

  return (
    <AppShell active="directory" initials={initialsOf(mine?.name)}>
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pb-16 pt-6 md:px-9 md:pt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">Directory</h1>
            <p className="mt-2 max-w-[62ch] text-[14px] text-ink-soft">
              {all.length} companies, read from their own public websites. They have not joined Crossdesk yet — contact
              them directly, or describe a problem and let matching find who fits.
            </p>
          </div>
          <form className="flex w-full gap-2 md:w-[340px]" action="/directory">
            {place && <input type="hidden" name="country" value={place} />}
            <label className="relative flex-1">
              <span className="sr-only">Search the directory</span>
              <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Industry, service, certification"
                className="h-10 w-full rounded-[8px] border border-line-strong bg-surface pl-9 pr-3 text-[14px] outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-ink-soft focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--ink)_9%,transparent)]"
              />
            </label>
          </form>
        </div>

        {countries.length > 1 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-3">
            <span className="text-[12.5px] text-ink-faint">Based in</span>
            <div className="flex flex-wrap items-center gap-1">
              <Toggle href={href({ country: "" })} on={!place}>Anywhere</Toggle>
              {countries.map((c) => (
                <Toggle key={c} href={href({ country: c })} on={place === c}>
                  {c}
                </Toggle>
              ))}
            </div>
            {(query || place) && (
              <span className="ml-auto text-[12.5px] text-ink-soft">
                {rows.length} of {all.length}
              </span>
            )}
          </div>
        )}

        {error ? (
          <Empty title="The directory is not set up yet">
            Run migration <code>0005_directory.sql</code> in the Supabase SQL Editor, then <code>npm run directory</code>.
          </Empty>
        ) : !all.length ? (
          <Empty title="No companies yet">
            <code>npm run directory</code> reads the listed websites and fills this page.
          </Empty>
        ) : !rows.length ? (
          <Empty title="Nothing matches">
            Try a broader word, or <Link href="/directory" className="underline underline-offset-4">clear the filters</Link>.
          </Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((c, i) => (
              <li key={c.domain} className="soft-in" style={{ ["--i" as string]: Math.min(i, 8) }}>
                <Company c={c} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}

function Company({ c }: { c: Listed }) {
  const place = [c.city, c.country].filter(Boolean).join(", ");
  const facts = [c.employees ? `${c.employees.toLocaleString("en-US")} people` : null, c.founded ? `Since ${c.founded}` : null].filter(Boolean);
  const certs = c.certifications.slice(0, 3);
  return (
    <Card className="relative flex h-full flex-col gap-4 p-5 transition-colors hover:border-line-strong">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-[10px] border border-line bg-surface">
          <RemoteLogo url={c.logo_url} name={c.name} className="p-1.5" />
        </span>
        <div className="min-w-0">
          {/* The name stretches over the whole card, so the card opens the company page. */}
          <Link href={`/directory/${encodeURIComponent(c.domain)}`} className="block truncate text-[15px] font-semibold tracking-[-0.01em] after:absolute after:inset-0 after:rounded-[10px]">
            {c.name}
          </Link>
          <p className="truncate text-[12.5px] text-ink-soft">{[c.industry, place].filter(Boolean).join(" · ")}</p>
        </div>
      </div>

      {c.summary && <p className="line-clamp-3 text-[13.5px] leading-relaxed text-ink-soft">{c.summary}</p>}

      <div className="mt-auto flex flex-col gap-3">
        {(facts.length > 0 || c.languages.length > 0) && (
          <p className="text-[12.5px] text-ink-soft">
            {[...facts, c.languages.length ? c.languages.join(", ") : null].filter(Boolean).join(" · ")}
          </p>
        )}
        {certs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {certs.map((t) => (
              <span key={t} className="rounded-[7px] border border-line-strong px-2 py-0.5 text-[11.5px] font-medium">
                {t}
              </span>
            ))}
            {c.certifications.length > certs.length && (
              <span className="px-1 py-0.5 text-[11.5px] text-ink-faint">+{c.certifications.length - certs.length}</span>
            )}
          </div>
        )}
        <a
          href={c.website}
          target="_blank"
          rel="noreferrer"
          className="relative z-10 flex items-center justify-between border-t border-line pt-3 text-[13px] font-semibold transition-colors hover:text-ink-soft"
        >
          {c.domain}
          <Icon name="arrow-up-right" size={15} />
        </a>
      </div>
    </Card>
  );
}

function Toggle({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={on ? "true" : undefined}
      className={`whitespace-nowrap rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
        on ? "bg-selected text-surface" : "text-ink-soft hover:bg-surface-alt hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="mt-1.5 text-[13.5px] text-ink-soft">{children}</p>
    </Card>
  );
}
