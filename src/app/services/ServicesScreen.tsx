import Link from "next/link";

import { Chip, Icon } from "@/components/ui";

/** One service as its owner sees it in the list. Figures here are the owner's own. */
export interface ServiceRow {
  id: string;
  title: string;
  /** The part of the business it comes out of — "Connectivity", "Customer service". Null until set. */
  area: string | null;
  state: "listed" | "talking" | "interested" | "paused";
  matched: number;
  awaiting: number;
  /** ISO date the company can take new work from, out of its own terms. */
  availableFrom: string | null;
  /** The owner's leading term, in their own figures. */
  terms: string;
}

export interface ServicesScreenData {
  initials: string;
  rows: ServiceRow[];
}

/** What the controls read out of the URL, so the screen stays a Server Component. */
export interface ServicesFilter {
  by?: string;
  paused?: string;
  demo?: boolean;
}

/**
 * What the company sells, one row per service. The problems list read backwards: there a
 * company writes down what it needs, here what it offers — same cuts, same signals, same row.
 * Each service is matched on its own terms, because a call centre and a fibre install are not
 * the same deal.
 */
export function ServicesScreen({
  d,
  f,
}: {
  d: ServicesScreenData;
  f: ServicesFilter;
}) {
  const byPart = f.by === "part" && d.rows.some((r) => r.area);
  const withPaused = f.paused !== undefined;

  const rows = d.rows.filter((r) => withPaused || r.state !== "paused");
  const live = d.rows.filter((r) => r.state !== "paused").length;
  const interested = d.rows.filter((r) => r.state === "interested").length;
  const paused = d.rows.length - live;

  const href = (next: Partial<ServicesFilter>) => {
    const by = "by" in next ? next.by : byPart ? "part" : undefined;
    const withP = "paused" in next ? next.paused !== undefined : withPaused;
    const parts = [
      f.demo && "demo",
      by === "part" && "by=part",
      withP && "paused",
    ].filter(Boolean);
    return parts.length ? `/services?${parts.join("&")}` : "/services";
  };

  return (
    <>
      <main className="flex flex-col">
        <section className="mx-auto w-full max-w-[1200px] px-4 pt-6 md:px-9 md:pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-12">
            <div className="min-w-0">
              <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">
                Services
              </h1>
              <p className="mt-2 text-[14px] text-ink-soft">
                {live} live
                {interested > 0 && (
                  <>
                    <span className="ml-3 font-semibold text-accent-strong">
                      <span
                        aria-hidden
                        className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle -translate-y-[0.09em]"
                      />
                      {interested} with a buyer waiting
                    </span>
                  </>
                )}
              </p>
            </div>
            <Link
              href="/services/new"
              className="inline-flex flex-none items-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-[13px] font-semibold text-surface transition-colors hover:bg-brand-strong md:mt-1.5"
            >
              <Icon name="plus" size={15} />
              Add a service
            </Link>
          </div>

          {/* Two controls, both in the URL: how the list is cut, and whether paused ones are in. */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-3">
            <span className="text-[12.5px] text-ink-faint">Grouped by</span>
            <div className="flex items-center gap-1">
              <Toggle href={href({ by: undefined })} on={!byPart}>
                Availability
              </Toggle>
              {d.rows.some((r) => r.area) && (
                <Toggle href={href({ by: "part" })} on={byPart}>
                  Part of the business
                </Toggle>
              )}
            </div>
            {paused > 0 && (
              <Link
                href={href({ paused: withPaused ? undefined : "" })}
                className="ml-auto text-[12.5px] text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                {withPaused ? "Hide paused" : `Show paused (${paused})`}
              </Link>
            )}
          </div>
        </section>

        {/* Sections breathe, the list keeps one edge: air above each heading, never a box per group. */}
        <section className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-4 md:px-9">
          {rows.length === 0 ? (
            <Blank
              title="Nothing listed yet"
              lead="List what you do and buyers with a matching problem are shown to you. Each service is matched on its own terms."
              href="/services/new"
              action="List a service"
            />
          ) : (
            (byPart ? byArea(rows) : byAvailability(rows)).map(
              ([label, list], i) => (
                <div key={label} className={i > 0 ? "mt-8" : "mt-2"}>
                  {/*
                   * Label left, count beside it. The count is inventory, not a notification:
                   * plain figures, no filled badge — nothing here is unread.
                   */}
                  <div className="flex items-baseline gap-2.5 pb-2.5">
                    <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                      {label}
                    </h2>
                    <span className="text-[12.5px] text-ink-faint">
                      {list.length} {list.length === 1 ? "service" : "services"}
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
                    {list.map((r) => (
                      <ServiceLine key={r.id} r={r} demo={f.demo} />
                    ))}
                  </div>
                </div>
              ),
            )
          )}
        </section>
      </main>
    </>
  );
}

type Section = [label: string, rows: ServiceRow[]];

/** Default cut: when you can take the work is the one term that moves on its own. */
function byAvailability(rows: ServiceRow[]): Section[] {
  const now = Date.now();
  const of = (r: ServiceRow) =>
    !r.availableFrom ? 2 : new Date(r.availableFrom).getTime() <= now ? 0 : 1;
  const at = (i: number) =>
    rows
      .filter((r) => of(r) === i)
      .sort(
        (a, b) =>
          rank(a) - rank(b) ||
          (a.availableFrom ?? "9").localeCompare(b.availableFrom ?? "9"),
      );
  return (
    [
      ["Available now", at(0)],
      ["Available later", at(1)],
      ["No date set", at(2)],
    ] as Section[]
  ).filter(([, list]) => list.length > 0);
}

/** The other cut: one section per part of the business, the busiest first. */
function byArea(rows: ServiceRow[]): Section[] {
  const areas = [...new Set(rows.map((r) => r.area ?? "No part set"))];
  return areas
    .map((a): Section => {
      const list = rows
        .filter((r) => (r.area ?? "No part set") === a)
        .sort((x, y) => rank(x) - rank(y));
      return [a, list];
    })
    .sort((x, y) => y[1].length - x[1].length);
}

function ServiceLine({ r, demo }: { r: ServiceRow; demo?: boolean }) {
  return (
    <Link
      href={`/services/${r.id}${demo ? "?demo" : ""}`}
      className="flex items-center gap-6 border-b border-line px-4 py-[18px] transition-colors last:border-b-0 hover:bg-surface-alt/50 md:px-5"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">
          {r.title}
        </p>
        <p className="mt-1 truncate text-[13px] text-ink-soft">
          {r.area && <span className="text-ink">{r.area}</span>}
          {r.area && r.terms && " · "}
          {r.terms}
        </p>
      </div>

      {/* One signal per row: the thing that decides whether this service needs the owner today. */}
      <span className="flex w-[142px] flex-none justify-end">
        <Signal r={r} />
      </span>

      <span className="hidden w-[56px] flex-none text-right text-[12.5px] tabular-nums text-ink-faint md:block">
        {dateLabel(r.availableFrom)}
      </span>
    </Link>
  );
}

/**
 * The row's one emphasis, ranked by what the owner can do about it:
 * a buyer waiting on an answer > a term to move > matching in the background.
 */
function Signal({ r }: { r: ServiceRow }) {
  if (r.state === "paused")
    return (
      <span className="text-[12px] font-medium text-ink-faint">Paused</span>
    );
  if (r.state === "interested")
    return (
      <Chip tone="accent">
        <Icon name="circle-dot" size={13} />
        {r.matched} to answer
      </Chip>
    );
  if (r.awaiting > 0) return <Chip tone="seal">{r.awaiting} a term away</Chip>;
  if (r.matched > 0)
    return (
      <span className="text-[12.5px] text-ink-soft tabular-nums">
        {r.matched} matched
      </span>
    );
  return <span className="text-[12.5px] text-ink-faint">Listed</span>;
}

/** Ranked the same way, so the row that needs an answer sits at the top of its section. */
function rank(r: ServiceRow) {
  if (r.state === "paused") return 4;
  if (r.state === "interested") return 0;
  if (r.awaiting > 0) return 1;
  return r.matched > 0 ? 2 : 3;
}

function dateLabel(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function Toggle({
  href,
  on,
  children,
}: {
  href: string;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={on ? "true" : undefined}
      className={`whitespace-nowrap rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
        on
          ? "bg-ink text-surface"
          : "text-ink-soft hover:bg-surface-alt hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

/**
 * An empty list is an invitation, not a status line. The header already carries the same button;
 * this one says why the page is empty and what would change it, where the eye actually lands.
 */
function Blank({
  title,
  lead,
  href,
  action,
}: {
  title: string;
  lead: string;
  href: string;
  action: string;
}) {
  return (
    <div className="mt-2 flex flex-col items-start gap-5 rounded-[10px] border border-line bg-surface px-6 py-12 md:items-center md:px-8 md:py-16 md:text-center">
      <div className="flex flex-col gap-2 md:items-center">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        <p className="max-w-[52ch] text-[14.5px] leading-relaxed text-ink-soft">
          {lead}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-[13px] font-semibold text-surface transition-colors hover:bg-brand-strong"
      >
        <Icon name="plus" size={15} />
        {action}
      </Link>
    </div>
  );
}
