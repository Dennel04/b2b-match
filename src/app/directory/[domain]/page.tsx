import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RemoteLogo } from "@/components/RemoteLogo";
import { AppShell, initialsOf } from "@/components/layout";
import { Card, Icon } from "@/components/ui";
import { serverClient } from "@/lib/supabase";
import type { CompanyProfile } from "@/types";

/** One `directory` row in full: everything the scraper read off the company's own website. */
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
  services: string[];
  certifications: string[];
  profile_json: Partial<CompanyProfile> | null;
  pages_read: string[];
  scraped_at: string;
}

export async function generateMetadata({ params }: PageProps<"/directory/[domain]">) {
  const { domain } = await params;
  return { title: `${decodeURIComponent(domain)} — Directory — Crossdesk` };
}

/**
 * A directory company in detail. Public facts only, all read from its own website, with the
 * pages they came from, so a reader can check any line at the source.
 */
export default async function DirectoryCompanyPage({ params }: PageProps<"/directory/[domain]">) {
  const { domain } = await params;
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: mine } = await db.from("companies").select("name").eq("owner_id", user.id).limit(1).maybeSingle();

  const { data } = await db.from("directory").select("*").eq("domain", decodeURIComponent(domain)).maybeSingle();
  if (!data) notFound();
  const c = data as Listed;
  const p = c.profile_json ?? {};
  const place = [c.city, c.country].filter(Boolean).join(", ");
  const size = c.employees ? `${c.employees.toLocaleString("en-US")} people` : p.size_hint && p.size_hint !== "unknown" ? p.size_hint : null;

  return (
    <AppShell active="directory" initials={initialsOf(mine?.name)}>
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-7 px-4 pb-16 pt-6 md:px-9 md:pt-8">
        <Link href="/directory" className="-ml-1.5 flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-[13px] text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink">
          <Icon name="chevron-left" size={15} />
          Directory
        </Link>

        <header className="flex flex-col gap-5 md:flex-row md:items-center">
          <span className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-[14px] border border-line bg-surface">
            <RemoteLogo url={c.logo_url} name={c.name} className="p-2" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">{c.name}</h1>
            <p className="mt-2 text-[14px] text-ink-soft">{[c.industry, place, size].filter(Boolean).join(" · ")}</p>
          </div>
          <a
            href={c.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-none items-center gap-2 self-start rounded-[8px] bg-brand px-4 py-2.5 text-[13px] font-semibold text-surface transition-colors hover:bg-brand-strong md:self-auto"
          >
            Visit {c.domain}
            <Icon name="arrow-up-right" size={15} />
          </a>
        </header>

        <p className="rounded-[10px] border border-line bg-surface-alt px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          A public profile read from {c.domain}. {c.name} has not joined Crossdesk: reach them through their website,
          or describe your problem and let matching find who fits.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            <Block title="About">
              {c.summary ? <p className="text-[15px] leading-relaxed">{c.summary}</p> : <Faint>The site did not say.</Faint>}
            </Block>
            <Block title="Services">
              <Tags items={c.services} empty="No services listed on the site." />
            </Block>
            <Block title="Industries they serve">
              <Tags items={c.industries_served} empty="No client industries named on the site." />
            </Block>
            {p.keywords && p.keywords.length > 0 && (
              <Block title="Keywords">
                <Tags items={p.keywords} quiet />
              </Block>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <Block title="Facts">
              <dl className="flex flex-col divide-y divide-line">
                <Fact k="Based in" v={place} />
                <Fact k="Company size" v={c.employees ? c.employees.toLocaleString("en-US") : p.size_hint && p.size_hint !== "unknown" ? p.size_hint : null} />
                <Fact k="Founded" v={c.founded ? String(c.founded) : null} />
                <Fact k="Languages" v={c.languages.join(", ")} />
                <Fact k="Website" v={c.domain} />
              </dl>
            </Block>
            <Block title="Certifications">
              <Tags items={c.certifications} empty="None named on the site." />
            </Block>
            <Block title="Where this came from">
              <ul className="flex flex-col gap-1.5 text-[12.5px]">
                {c.pages_read.map((u) => (
                  <li key={u}>
                    <a href={u} target="_blank" rel="noreferrer" className="break-all text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                      {u.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-ink-faint">
                Read {new Date(c.scraped_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </Block>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]">{title}</h2>
      <Card className="p-5">{children}</Card>
    </section>
  );
}

function Fact({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0 text-[13.5px]">
      <dt className="text-ink-soft">{k}</dt>
      <dd className="text-right font-medium">{v || <span className="font-normal text-ink-faint">—</span>}</dd>
    </div>
  );
}

function Tags({ items, empty, quiet = false }: { items: string[]; empty?: string; quiet?: boolean }) {
  if (!items.length) return <Faint>{empty}</Faint>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className={`rounded-[7px] px-2.5 py-1 text-[12.5px] ${quiet ? "bg-surface-alt text-ink-soft" : "border border-line-strong"}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

function Faint({ children }: { children: React.ReactNode }) {
  return <p className="text-[13.5px] text-ink-faint">{children}</p>;
}
