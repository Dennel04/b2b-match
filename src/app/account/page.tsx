import Link from "next/link";
import { redirect } from "next/navigation";
import { getCompanyStats } from "@/actions/stats";
import { AppShell, initialsOf } from "@/components/layout";
import { Card, Chip } from "@/components/ui";
import { serverClient } from "@/lib/supabase";
import type { CompanyStats } from "@/types";

export const metadata = { title: "Dashboard — Crossdesk" };

/**
 * The company's dashboard, opened from the brand in the sidebar: how matching is going, and what
 * to change to be shown more often. Company details are edited in Company, deals in Matches.
 *
 * Counts only, never a list (docs/FRONTEND.md §4a): the rows behind these numbers say which buyer
 * considered which vendor, which is exactly what the product promises not to reveal.
 */
export default async function AccountPage() {
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  // Owner-only read (RLS companies_read_own).
  const { data: company } = await db
    .from("companies")
    .select("name, role")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!company) redirect("/onboarding");


  const stats = await getCompanyStats();
  const s = stats.seller;
  const b = stats.buyer;
  const showSeller = company.role !== "buyer" || s.considered > 0;
  const showBuyer = company.role !== "seller" || b.problems > 0;

  return (
    <AppShell active="account" initials={initialsOf(company.name)}>
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-9 px-4 pb-16 pt-6 md:px-9 md:pt-8">
        <Header />

        {showSeller && (
          <Section title="As a vendor">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Considered" value={s.considered} note="Buyers' problems checked against your profile" />
              <Stat label="Shown to buyers" value={s.shown} note={s.avg_score !== null ? `Average fit ${s.avg_score} of 100` : undefined} />
              <Stat label="Buyers interested" value={s.buyer_interested + s.accepted} note="Asked to meet after the agents talked" />
              <Stat label="Meetings" value={s.accepted} note={s.accepted ? "Names shared on both sides" : undefined} state={s.accepted > 0} />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <Card className="p-5">
                <h3 className="text-[13.5px] font-semibold">From considered to meeting</h3>
                <Funnel
                  steps={[
                    ["Considered", s.considered],
                    ["Cleared terms", s.cleared_terms],
                    ["Shown to buyers", s.shown],
                    ["Agents said proceed", s.proceed],
                    ["Buyer interested", s.buyer_interested + s.accepted],
                    ["Meeting", s.accepted],
                  ]}
                />
              </Card>
              <Blocked reasons={s.blocked_by} considered={s.considered} cleared={s.cleared_terms} />
            </div>
          </Section>
        )}

        {showBuyer && (
          <Section title="As a buyer">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Problems written" value={b.problems} note="Private to your company" />
              <Stat label="Vendors checked" value={b.candidates_evaluated} note={b.candidates_evaluated ? `${b.cleared_terms} cleared your terms` : undefined} />
              <Stat label="Matches" value={b.matches} note="Scored high enough to show you" />
              <Stat label="Meetings" value={b.accepted} note="Confirmed by both sides" state={b.accepted > 0} />
            </div>
          </Section>
        )}
      </main>
    </AppShell>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">Dashboard</h1>
        <p className="mt-2 text-[14px] text-ink-soft">How far you get behind the wall. Only you see these numbers.</p>
      </div>
      <Link
        href="/company"
        className="inline-flex flex-none items-center self-start rounded-[9px] border border-line-strong bg-surface px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-surface-alt md:self-auto"
      >
        Company details
      </Link>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
      {children}
    </section>
  );
}

/** A number is the whole message here, so it is a tile, not a chart. */
function Stat({ label, value, note, state = false }: { label: string; value: number; note?: string; state?: boolean }) {
  return (
    <Card className="p-4 md:p-5">
      <p className="text-[12.5px] font-medium text-ink-soft">{label}</p>
      <p className="mt-1.5 flex items-center gap-2 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {value}
        {state && <Chip tone="accent">Confirmed</Chip>}
      </p>
      {note && <p className="mt-2 text-[12px] leading-snug text-ink-faint">{note}</p>}
    </Card>
  );
}

/** One series in ink, scaled to the largest step, its count at the end of the row. */
function Funnel({ steps }: { steps: [string, number][] }) {
  const top = Math.max(1, ...steps.map(([, n]) => n));
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

/**
 * The actionable part: why this vendor was filtered out, in its own terms. The fix is always on
 * its own side of the wall, so every row points at Company, where terms are edited.
 */
function Blocked({ reasons, considered, cleared }: { reasons: CompanyStats["seller"]["blocked_by"]; considered: number; cleared: number }) {
  const top = Math.max(1, ...reasons.map((r) => r.count));
  return (
    <Card className="flex flex-col p-5">
      <h3 className="text-[13.5px] font-semibold">What kept you out</h3>
      {considered > 0 && (
        <p className="mt-0.5 text-[12.5px] text-ink-soft">{considered - cleared} of {considered} stopped at the terms check</p>
      )}
      {reasons.length ? (
        <>
          <ol className="mt-5 flex flex-col gap-3">
            {reasons.map((r) => (
              <li key={r.reason} className="text-[12.5px]">
                <div className="mb-1 flex justify-between gap-4">
                  <span className="text-ink">{r.reason}</span>
                  <span className="font-semibold tabular-nums">×{r.count}</span>
                </div>
                <span className="block h-1.5 overflow-hidden rounded-full bg-surface-alt">
                  <span className="block h-full rounded-full bg-seal" style={{ width: `${(r.count / top) * 100}%` }} />
                </span>
              </li>
            ))}
          </ol>
          <Link href="/company" className="mt-auto pt-5 text-[12.5px] font-semibold text-ink underline-offset-4 hover:underline">
            Change your terms in Company
          </Link>
        </>
      ) : (
        <p className="mt-5 text-[13px] leading-relaxed text-ink-soft">
          {considered ? "Your terms filtered out no one." : "This fills in once buyers start describing problems."}
        </p>
      )}
    </Card>
  );
}
