import Link from "next/link";
import { currentUser } from "@/lib/supabase";
import { Eyebrow, PillLink } from "./premium";
import { SiteHeader } from "./SiteHeader";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

const DOCS = [
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
] as const;

/**
 * The layout /terms and /privacy share: a sticky contents list on the left, numbered sections on
 * the right. Opened signed in (from the app footer) or signed out (from the landing page), so the
 * header offers whichever way back fits.
 */
export async function LegalPage({
  doc,
  title,
  lead,
  updated,
  sections,
}: {
  doc: (typeof DOCS)[number]["href"];
  title: string;
  lead: string;
  updated: string;
  sections: LegalSection[];
}) {
  const user = await currentUser();
  const current = DOCS.find((d) => d.href === doc)!;
  const other = DOCS.find((d) => d.href !== doc)!;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <SiteHeader>
        {user ? (
          <PillLink href="/dashboard" variant="soft">
            Dashboard
          </PillLink>
        ) : (
          <PillLink href="/login" variant="soft" icon={false}>
            Log in
          </PillLink>
        )}
      </SiteHeader>

      <main className="mx-auto grid w-full max-w-[1200px] flex-1 gap-10 px-4 pb-16 pt-6 md:px-8 lg:grid-cols-[240px_1fr] lg:gap-16">
        <aside className="soft-in lg:sticky lg:top-8 lg:self-start">
          <Eyebrow>{current.label}</Eyebrow>
          <p className="mt-4 text-[12.5px] text-ink-faint">Last updated {updated}</p>
          <nav aria-label="Sections" className="mt-6 max-lg:hidden">
            <ol className="flex flex-col gap-0.5 border-l border-line">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-4 text-[13px] text-ink-soft transition-colors duration-200 hover:border-ink hover:text-ink"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <Link
            href={other.href}
            className="mt-6 inline-block text-[13px] font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            {other.label} →
          </Link>
        </aside>

        <article className="soft-in max-w-[720px]" style={{ ["--i" as string]: 1 }}>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.04em]">{title}</h1>
          <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">{lead}</p>

          <div className="mt-12 flex flex-col gap-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-8">
                <h2 id={`${s.id}-h`} className="flex items-baseline gap-3 text-[20px] font-bold tracking-[-0.02em]">
                  <span className="text-[12px] font-semibold tabular-nums text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <div className="legal-body mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-ink-soft">{s.body}</div>
              </section>
            ))}
          </div>

          <p className="mt-16 border-t border-line pt-6 text-[13px] text-ink-faint">
            A draft for a prototype. It is read by a lawyer before Crossdesk is offered to companies for real.
          </p>
        </article>
      </main>
    </div>
  );
}
