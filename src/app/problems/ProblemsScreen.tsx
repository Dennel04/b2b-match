import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Chip, Icon } from "@/components/ui";

/** One problem as its owner sees it in the list. Figures here are the owner's own. */
export interface ProblemRow {
  id: string;
  title: string;
  /** The part of the business the problem sits in — "Operations", "Finance". Null until it is set. */
  area: string | null;
  state: "searching" | "matching" | "ready" | "closed";
  matched: number;
  awaiting: number;
  /** ISO date the work must start by, from the owner's own terms. */
  startBy: string | null;
  /** The owner's leading term, in their own figures. */
  terms: string;
}

export interface ProblemsScreenData {
  initials: string;
  matches: number;
  rows: ProblemRow[];
}

/** What the controls read out of the URL, so the screen stays a Server Component. */
export interface ProblemsFilter {
  by?: string;
  closed?: string;
  demo?: boolean;
}

/**
 * The list of problems a company wrote down. Nothing here has left the company.
 *
 * The list is short by nature — a company has a handful of real problems — so it carries two
 * controls, not a filter rail: how it is cut (deadline or part of the business), and whether
 * closed ones are in. State needs no filter: every row already says it.
 */
export function ProblemsScreen({ d, f }: { d: ProblemsScreenData; f: ProblemsFilter}) {
  const byPart = f.by === "part" && d.rows.some((r) => r.area);
  const withClosed = f.closed !== undefined;

  const rows = d.rows.filter((r) => withClosed || r.state !== "closed");
  const open = d.rows.filter((r) => r.state !== "closed").length;
  const ready = d.rows.filter((r) => r.state === "ready").length;
  const closed = d.rows.length - open;

  const href = (next: Partial<ProblemsFilter>) => {
    const by = "by" in next ? next.by : byPart ? "part" : undefined;
    const withC = "closed" in next ? next.closed !== undefined : withClosed;
    const parts = [f.demo && "demo", by === "part" && "by=part", withC && "closed"].filter(Boolean);
    return parts.length ? `/problems?${parts.join("&")}` : "/problems";
  };

  return (
    <AppShell active="problems" demo={f.demo} matches={d.matches} initials={d.initials}>
      <main className="flex flex-col">

        <section className="mx-auto w-full max-w-[1200px] px-4 pt-6 md:px-9 md:pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-12">
            <div className="min-w-0">
              <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">Problems</h1>
              <p className="mt-2 text-[14px] text-ink-soft">
                {open} open
                {ready > 0 && (
                  <>
                    <span className="ml-3 font-semibold text-accent-strong">
                      <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle -translate-y-[0.09em]" />
                      {ready} ready to meet
                    </span>
                  </>
                )}
              </p>
            </div>
            <Link
              href="/problems/new"
              className="inline-flex flex-none items-center gap-2 rounded-[9px] bg-ink px-4 py-2.5 text-[13px] font-semibold text-surface transition-colors hover:bg-ink-soft md:mt-1.5"
            >
              <Icon name="plus" size={15} />
              Describe a problem
            </Link>
          </div>

          {/* Two controls, both in the URL: how the list is cut, and whether closed ones are in. */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-3">
            <span className="text-[12.5px] text-ink-faint">Grouped by</span>
            <div className="flex items-center gap-1">
              <Toggle href={href({ by: undefined })} on={!byPart}>
                Start date
              </Toggle>
              {d.rows.some((r) => r.area) && (
                <Toggle href={href({ by: "part" })} on={byPart}>
                  Part of the business
                </Toggle>
              )}
            </div>
            {closed > 0 && (
              <Link
                href={href({ closed: withClosed ? undefined : "" })}
                className="ml-auto text-[12.5px] text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                {withClosed ? "Hide closed" : `Show closed (${closed})`}
              </Link>
            )}
          </div>
        </section>

        {/* Sections breathe, the list keeps one edge: air above each heading, never a box per group. */}
        <section className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-4 md:px-9">
          {rows.length === 0 ? (
            <p className="text-[14px] text-ink-soft">No problems described yet.</p>
          ) : (
            (byPart ? byArea(rows) : byDeadline(rows)).map(([label, list], i) => (
              <div key={label} className={i > 0 ? "mt-8" : "mt-2"}>
                {/*
                  * Label left, count on the right edge of the card. The count is inventory, not
                  * a notification: plain figures, no filled badge — nothing here is unread.
                  */}
                <div className="flex items-baseline gap-2.5 pb-2.5">
                  <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-ink-soft">{label}</h2>
                  <span className="text-[12.5px] text-ink-faint">
                    {list.length} {list.length === 1 ? "problem" : "problems"}
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-line bg-surface">
                  {list.map((r) => (
                    <ProblemLine key={r.id} r={r} demo={f.demo} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

      </main>
    </AppShell>
  );
}

type Section = [label: string, rows: ProblemRow[]];

/** Default cut: a start date is the one term that moves on its own. */
function byDeadline(rows: ProblemRow[]): Section[] {
  const soon = Date.now() + 45 * 864e5;
  const of = (r: ProblemRow) => (!r.startBy ? 2 : new Date(r.startBy).getTime() <= soon ? 0 : 1);
  const at = (i: number) =>
    rows.filter((r) => of(r) === i).sort((a, b) => rank(a) - rank(b) || (a.startBy ?? "9").localeCompare(b.startBy ?? "9"));
  return (
    [
      ["Starting soon", at(0)],
      ["Planned", at(1)],
      ["No fixed date", at(2)],
    ] as Section[]
  ).filter(([, list]) => list.length > 0);
}

/** The other cut: one section per part of the business, the busiest first. */
function byArea(rows: ProblemRow[]): Section[] {
  const areas = [...new Set(rows.map((r) => r.area ?? "No part set"))];
  return areas
    .map((a): Section => {
      const list = rows.filter((r) => (r.area ?? "No part set") === a).sort((x, y) => rank(x) - rank(y));
      return [a, list];
    })
    .sort((x, y) => y[1].length - x[1].length);
}

function ProblemLine({ r, demo }: { r: ProblemRow; demo?: boolean }) {
  return (
    <Link
      href={`/problems/${r.id}${demo ? "?demo" : ""}`}
      className="flex items-center gap-6 border-b border-line px-4 py-[18px] transition-colors last:border-b-0 hover:bg-surface-alt/50 md:px-5"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{r.title}</p>
        <p className="mt-1 truncate text-[13px] text-ink-soft">
          {r.area && <span className="text-ink">{r.area}</span>}
          {r.area && r.terms && " · "}
          {r.terms}
        </p>
      </div>

      {/* One signal per row: the thing that decides whether this problem needs the owner today. */}
      <span className="flex w-[142px] flex-none justify-end">
        <Signal r={r} />
      </span>

      <span className={`hidden w-[56px] flex-none text-right text-[12.5px] tabular-nums md:block ${overdue(r) ? "text-ink" : "text-ink-faint"}`}>
        {dateLabel(r.startBy)}
      </span>
    </Link>
  );
}

/**
 * The row's one emphasis, ranked by what the owner can do about it:
 * a meeting waiting > a company to ask > matching in the background.
 */
function Signal({ r }: { r: ProblemRow }) {
  if (r.state === "closed") return <span className="text-[12px] font-medium text-ink-faint">Closed</span>;
  if (r.state === "ready")
    return (
      <Chip tone="accent">
        <Icon name="circle-dot" size={13} />
        {r.matched} ready to meet
      </Chip>
    );
  if (r.awaiting > 0)
    return (
      <Chip tone="seal">
        {r.awaiting} to ask
      </Chip>
    );
  if (r.matched > 0) return <span className="text-[12.5px] text-ink-soft tabular-nums">{r.matched} matched</span>;
  return <span className="text-[12.5px] text-ink-faint">Searching</span>;
}

/** Ranked the same way, so the row that needs an answer sits at the top of its section. */
function rank(r: ProblemRow) {
  if (r.state === "closed") return 4;
  if (r.state === "ready") return 0;
  if (r.awaiting > 0) return 1;
  return r.matched > 0 ? 2 : 3;
}

function overdue(r: ProblemRow) {
  return !!r.startBy && new Date(r.startBy).getTime() < Date.now();
}

function dateLabel(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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
