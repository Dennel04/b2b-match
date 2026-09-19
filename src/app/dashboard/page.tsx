import Link from "next/link";
import { redirect } from "next/navigation";
import { getCompanyStats } from "@/actions/stats";
import { AppShell, initialsOf } from "@/components/layout";
import { Card, Icon } from "@/components/ui";
import { serverClient } from "@/lib/supabase";
import type { BlockedReason, SellerTerms } from "@/types";
import { FORMATS, REQUIREMENTS } from "../onboarding/fields";

export const metadata = { title: "Dashboard — Crossdesk" };

/**
 * The company's dashboard, opened from the brand in the sidebar: how matching is going, and what
 * to change to be shown more often. Company details are edited in Company, deals in Matches.
 *
 * Counts only, never a list (docs/FRONTEND.md §4a): the rows behind these numbers say which buyer
 * considered which vendor, which is exactly what the product promises not to reveal. No drill-down
 * into which problems, and no dates fine enough to show who is shopping this week.
 */
export default async function DashboardPage() {
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  // Owner-only read (RLS companies_read_own). Oldest first, because one owner can own several
  // companies — the demo account owns every seeded one — and getCompanyStats() orders the same
  // way, so both halves of this screen describe the same company.
  const { data: company } = await db
    .from("companies")
    .select("name, role, seller_terms")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!company) redirect("/onboarding");

  const initials = initialsOf(company.name);
  const stats = await getCompanyStats();

  // An expected failure comes back as a message, never as a thrown string: Next.js strips those
  // in production and the screen would show "Minified React error #441" instead (CLAUDE.md).
  if (!stats.ok) {
    return (
      <AppShell active="dashboard" initials={initials}>
        <Page>
          <Header />
          <Card className="p-6 text-[14px] text-ink-soft">{stats.message}</Card>
        </Page>
      </AppShell>
    );
  }

  const s = stats.data.seller;
  const b = stats.data.buyer;
  const sells = company.role !== "buyer";
  const buys = company.role !== "seller";
  const selling = s.considered > 0;   // a buyer's problem has been checked against this company
  const buying = b.problems > 0;

  return (
    <AppShell active="dashboard" initials={initials}>
      <Page>
        <Header />

        {/* Every count is zero and neither side has started. Six empty bars say nothing; this does. */}
        {!selling && !buying ? (
          buys ? (
            <Blank
              title="Nothing has run yet"
              lead="Describe a problem and every vendor is checked against it, without a word of it leaving you."
              href="/problems/new"
              action="Describe a problem"
            />
          ) : (
            <Blank
              title="Nothing has run yet"
              lead="List what you sell and buyers' problems are checked against it, on the terms you set."
              href="/services/new"
              action="List a service"
            />
          )
        ) : (
          <>
            {(sells || selling) && (
              <Section title="As a vendor" note="Buyers whose problems were checked against what you sell.">
                {selling ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <Stat label="Considered" value={s.considered} note="Problems checked against what you sell" />
                      <Stat label="Cleared your terms" value={s.cleared_terms} note="Passed the mechanical check" />
                      <Stat label="Shown to buyers" value={s.shown} note="Scored high enough to become a match" />
                      <Stat label="Meetings" value={s.accepted} note="Both sides confirmed" />
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <Card className="flex flex-col p-5">
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
                          done={s.accepted > 0}
                        />
                        {(s.avg_score !== null || s.declined > 0) && (
                          <p className="mt-auto pt-5 text-[12px] leading-relaxed text-ink-faint">
                            {s.avg_score !== null && <>Average fit {s.avg_score} of 100 across everything the model scored. </>}
                            {s.declined > 0 && <>{s.declined} closed as declined.</>}
                          </p>
                        )}
                      </Card>
                      <Blocked reasons={s.blocked_by} considered={s.considered} cleared={s.cleared_terms} terms={company.seller_terms as SellerTerms | null} />
                    </div>
                  </>
                ) : (
                  <Blank
                    compact
                    title="No problem has been checked against you yet"
                    lead="A service is what a buyer's problem is read against, and its terms are what the check compares."
                    href="/services/new"
                    action="List a service"
                  />
                )}
              </Section>
            )}

            {(buys || buying) && (
              <Section title="As a buyer" note="Vendors checked against the problems you wrote down.">
                {buying ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <Stat label="Problems described" value={b.problems} note="Private to your company" />
                      <Stat label="Vendors checked" value={b.candidates_evaluated} note="Compared on terms before anything was read" />
                      <Stat label="Matches" value={b.matches} note="Scored high enough to show you" />
                      <Stat label="Meetings" value={b.accepted} note="Both sides confirmed" />
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <Card className="flex flex-col p-5">
                        <h3 className="text-[13.5px] font-semibold">From vendor to meeting</h3>
                        <Funnel
                          steps={[
                            ["Vendors checked", b.candidates_evaluated],
                            ["Cleared your terms", b.cleared_terms],
                            ["Matched", b.matches],
                            ["Meeting", b.accepted],
                          ]}
                          done={b.accepted > 0}
                        />
                      </Card>
                      <Card className="flex flex-col p-5">
                        <h3 className="text-[13.5px] font-semibold">What your terms filtered out</h3>
                        <p className="mt-0.5 text-[12.5px] text-ink-soft">
                          {b.candidates_evaluated > b.cleared_terms
                            ? `${b.candidates_evaluated - b.cleared_terms} of ${b.candidates_evaluated} never reached the model`
                            : "Every vendor checked cleared your terms"}
                        </p>
                        <p className="mt-5 text-[13px] leading-relaxed text-ink-soft">
                          Budget ceiling, start date, contract format and hard requirements are
                          compared mechanically, before a single line is read. None of those vendors
                          was told anything — not why, not that your problem exists.
                        </p>
                        <Link href="/problems" className="mt-auto flex items-center gap-1.5 pt-5 text-[12.5px] font-semibold text-ink underline-offset-4 hover:underline">
                          Review the terms on a problem
                          <Icon name="chevron-right" size={14} />
                        </Link>
                      </Card>
                    </div>
                  </>
                ) : (
                  <Blank
                    compact
                    title="You haven't described a problem yet"
                    lead="Describe one and every vendor is checked against it; a vendor is only ever told why it might fit."
                    href="/problems/new"
                    action="Describe a problem"
                  />
                )}
              </Section>
            )}
          </>
        )}
      </Page>
    </AppShell>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-9 px-4 pb-16 pt-6 md:px-9 md:pt-8">
      {children}
    </main>
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
        className="inline-flex flex-none items-center self-start rounded-[8px] border border-line-strong bg-surface px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-surface-alt md:self-auto"
      >
        Company details
      </Link>
    </header>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="text-[12.5px] text-ink-faint">{note}</p>
      </div>
      {children}
    </section>
  );
}

/** A number is the whole message here, so it is a tile, not a chart. */
function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <Card className="p-4 md:p-5">
      <p className="text-[12.5px] font-medium text-ink-soft">{label}</p>
      <p className="mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{value}</p>
      {note && <p className="mt-2 text-[12px] leading-snug text-ink-faint">{note}</p>}
    </Card>
  );
}

/**
 * One series in ink, scaled to the largest step, its count at the end of the row. The last step
 * turns green only when it happened: a confirmed meeting is a state, not a decoration.
 */
function Funnel({ steps, done }: { steps: [string, number][]; done: boolean }) {
  const top = Math.max(1, ...steps.map(([, n]) => n));
  return (
    <ol className="mt-5 flex flex-col gap-3">
      {steps.map(([label, n], i) => {
        const last = i === steps.length - 1;
        return (
          <li key={label} className="text-[12.5px]">
            <div className="mb-1 flex justify-between gap-4">
              <span className={last && done ? "font-semibold text-accent-strong" : "text-ink-soft"}>{label}</span>
              <span className="font-semibold tabular-nums">{n}</span>
            </div>
            <span className="block h-1.5 overflow-hidden rounded-full bg-surface-alt">
              <span
                className={`block h-full rounded-full ${last && done ? "bg-accent" : "bg-ink/80"}`}
                style={{ width: `${(n / top) * 100}%` }}
              />
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The actionable part of the screen: why this vendor was filtered out, in its own terms, next to
 * the terms themselves — a reason is only actionable beside the figure it is about. Everything
 * here is the vendor's own side of the wall; no buyer, problem or figure of theirs appears.
 */
function Blocked({
  reasons,
  considered,
  cleared,
  terms,
}: {
  reasons: BlockedReason[];
  considered: number;
  cleared: number;
  terms: SellerTerms | null;
}) {
  const blocked = considered - cleared;
  const top = Math.max(1, ...reasons.map((r) => r.count));
  // One buyer can fail on price and on the start date at once, so the counts are occurrences and
  // can add up to more than the number of buyers behind them. Say so rather than let it puzzle.
  const overlaps = reasons.reduce((n, r) => n + r.count, 0) > blocked;

  return (
    <Card className="flex flex-col p-5">
      <h3 className="text-[13.5px] font-semibold">What kept you out</h3>
      <p className="mt-0.5 text-[12.5px] text-ink-soft">
        {blocked > 0
          ? `${blocked} of ${considered} stopped at the terms check`
          : "Nobody was stopped at the terms check"}
      </p>

      {reasons.length > 0 && (
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
          {overlaps && (
            <p className="mt-3 text-[12px] text-ink-faint">One buyer can be stopped by more than one term.</p>
          )}
        </>
      )}

      <Terms terms={terms} />

      <Link href="/services" className="mt-auto flex items-center gap-1.5 pt-5 text-[12.5px] font-semibold text-ink underline-offset-4 hover:underline">
        Review your terms
        <Icon name="chevron-right" size={14} />
      </Link>
    </Card>
  );
}

/**
 * The vendor's own working terms, the four the mechanical check compares. They are its own
 * figures, so they are its to see — and a reason above is only actionable beside them: "your
 * minimum deal size was above their ceiling" means nothing without the minimum next to it.
 *
 * These are `companies.seller_terms`, which is what `findMatches()` compares today and the
 * fallback for a company that has listed no service (docs/FRONTEND.md §1a). A listed service
 * carries its own, which is why the link out of this card goes to Services.
 */
function Terms({ terms }: { terms: SellerTerms | null }) {
  const money = terms?.budget_floor;
  const rows: [string, string | null][] = [
    [
      "Smallest deal",
      money ? `€${money.amount.toLocaleString("en-US")} ${money.period === "monthly" ? "per month" : "per project"}` : null,
    ],
    [
      "Contract formats",
      terms?.contract_formats.length
        ? terms.contract_formats.map((f) => FORMATS.find((x) => x.value === f)?.label ?? f).join(", ")
        : null,
    ],
    [
      "Free from",
      terms?.available_from
        ? new Date(terms.available_from).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null,
    ],
    [
      "You can offer",
      terms?.capabilities.length
        ? terms.capabilities.map((c) => REQUIREMENTS.find((x) => x.value === c)?.label ?? c).join(", ")
        : null,
    ],
  ];

  return (
    <div className="mt-5 border-t border-line pt-4 text-[12.5px]">
      <p className="font-semibold">Your terms</p>
      <dl className="mt-2 flex flex-col gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="flex-none text-ink-soft">{label}</dt>
            <dd className={`text-right ${value ? "text-ink" : "text-ink-faint"}`}>{value ?? "Not set"}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[12px] text-ink-faint">Your figures. A buyer is told that they fit, never what they are.</p>
    </div>
  );
}

/**
 * Nothing has happened on this side yet. The same invitation the problems and services lists
 * use — one line that says what would change it, and the one button that does it. Never two:
 * a screen makes one invitation at a time, so this appears for one half or for the page, not both.
 */
function Blank({
  title,
  lead,
  href,
  action,
  compact = false,
}: {
  title: string;
  lead: string;
  href: string;
  action: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-start gap-5 rounded-[10px] border border-line bg-surface px-6 md:items-center md:px-8 md:text-center ${
        compact ? "py-10 md:py-12" : "mt-2 py-12 md:py-16"
      }`}
    >
      <div className="flex flex-col gap-2 md:items-center">
        <h2 className={`font-semibold tracking-[-0.02em] ${compact ? "text-[18px]" : "text-[22px]"}`}>{title}</h2>
        <p className="max-w-[52ch] text-[14.5px] leading-relaxed text-ink-soft">{lead}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-[9px] bg-ink px-4 py-2.5 text-[13px] font-semibold text-surface transition-colors hover:bg-ink-soft"
      >
        <Icon name="plus" size={15} />
        {action}
      </Link>
    </div>
  );
}
