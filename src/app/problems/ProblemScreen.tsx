import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui";
import { DeclinedRow, Group, PartyRow, RowButton, type Party } from "@/components/counterparties";

/** What the screen says it is doing, read off the matches themselves — never a fixed label. */
export type ProblemState = "searching" | "potential" | "matching" | "stopped";

export interface ProblemScreenData {
  caseRef: string;
  status: ProblemState;
  initials: string;
  matches: number;
  title: string;
  summary: string;
  terms: string[];
  matched: (Party & { state: string; ready: boolean; score: number })[];
  awaiting: (Party & { area: string })[];
  declined: number;
}

/** The buyer's problem screen, rebuilt from drafts/design/problem-page.html. */
export function ProblemScreen({ d, demo }: { d: ProblemScreenData; demo?: boolean}) {
  return (
    <AppShell active="problems" demo={demo} matches={d.matches} initials={d.initials}>
      <main className="flex flex-col">
        <section className="mx-auto w-full max-w-[1200px] px-4 pb-7 pt-6 md:px-9 md:pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 pb-3 text-[12.5px] text-ink-soft">
            <Link href={`/problems${demo ? "?demo" : ""}`} className="rounded-md px-1.5 py-1 -ml-1.5 transition-colors hover:bg-surface-alt hover:text-ink">
              Problems
            </Link>
            <Icon name="chevron-right" size={13} className="text-ink-faint" />
            <span className="font-mono tracking-tight">{d.caseRef}</span>
          </nav>

          {/* Title carries its own controls, so the screen needs no top bar. */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-12">
            <h1 className="max-w-[24ch] text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">{d.title}</h1>
            <div className="flex flex-none items-center gap-1 md:pt-1.5">
              <StatusChip state={d.status} />
              <span aria-hidden className="mx-1.5 h-4 w-px bg-line" />
              <TitleButton icon="pencil">Edit</TitleButton>
              <TitleButton icon="circle-stop">Stop</TitleButton>
            </div>
          </div>

          <p className="mt-3.5 max-w-[60ch] text-[16.5px] leading-[1.6] text-ink-soft">{d.summary}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {d.terms.map((t) => (
              <li key={t} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium shadow-[0_1px_0_var(--border)]">
                {t}
              </li>
            ))}
          </ul>
        </section>

        <Group label="Matched" count={d.matched.length} fact="Every term cleared">
          {d.matched.map((m) => (
            <PartyRow key={m.id} p={m}>
              <span className={`hidden flex-none text-[12px] font-medium sm:block ${m.ready ? "text-accent-strong" : "text-ink-soft"}`}>
                {m.ready && <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle -translate-y-[0.09em]" />}
                {m.state}
              </span>
              <span className="flex flex-none items-center gap-1.5 rounded-[7px] bg-surface-alt px-2.5 py-1 text-[12px] font-semibold tabular-nums">
                <Icon name="gauge" size={14} />
                {m.score}
              </span>
              <RowButton href={`/matches/${m.id}`} primary={m.ready}>Open</RowButton>
            </PartyRow>
          ))}
        </Group>

        <Group
          label="Awaiting"
          count={d.awaiting.length}
          fact="One term apart, and willing to move"
          note="Asking reveals nothing about you, and never sends your problem."
        >
          {d.awaiting.map((m) => (
            <PartyRow key={m.id} p={m}>
              <span className="flex-none rounded-[7px] bg-gold-soft px-2.5 py-1 text-[12px] font-semibold text-gold">{m.area}</span>
              <RowButton href={`/matches/${m.id}`}>Ask</RowButton>
            </PartyRow>
          ))}
        </Group>

        <Group label="Declined" count={d.declined} fact="Nothing was sent to them" muted>
          <DeclinedRow />
        </Group>
      </main>
    </AppShell>
  );
}

/**
 * One chip, four states: nothing found yet, someone found but a term apart, someone cleared,
 * or the owner stopped it. A problem with no match must not claim to be matching.
 */
const STATUS = {
  searching: { label: "Searching", icon: "search", tone: "bg-surface-alt text-ink-soft" },
  potential: { label: "Potential", icon: "circle-dot", tone: "bg-gold-soft text-gold" },
  matching: { label: "Matching", icon: "circle-dot", tone: "bg-accent-soft text-accent-strong" },
  stopped: { label: "Stopped", icon: "circle-stop", tone: "bg-surface-alt text-ink-faint" },
} as const;

function StatusChip({ state }: { state: ProblemState }) {
  const s = STATUS[state];
  return (
    <span className={`flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[12px] font-semibold ${s.tone}`}>
      <Icon name={s.icon} size={13} />
      {s.label}
    </span>
  );
}

function TitleButton({ icon, children }: { icon: "circle-stop" | "pencil"; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
    >
      <Icon name={icon} size={13} />
      {children}
    </button>
  );
}


