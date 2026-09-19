import Link from "next/link";
import { DeclinedRow, Group, PartyRow, RowButton, type Party } from "@/components/counterparties";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui";

/**
 * One service, as its owner sees it. The mirror of the problem screen: the same three groups
 * of counterparties, read from the selling side. What a buyer wrote is never here — a row says
 * only what the server was willing to project.
 */
export interface ServiceScreenData {
  caseRef: string;
  status: "Live" | "Paused";
  initials: string;
  matches: number;
  title: string;
  summary: string;
  /** The company's own terms for this service, in its own figures. */
  terms: string[];
  matched: (Party & { state: string; yours: boolean; score: number })[];
  awaiting: (Party & { area: string })[];
  declined: number;
  /** Where the declined ones fell away, counted — "4 on price, 2 on the deadline". Never who. */
  declinedReasons: string;
}

export function ServiceScreen({ d, demo }: { d: ServiceScreenData; demo?: boolean }) {
  const live = d.status === "Live";
  return (
    <AppShell active="services" demo={demo} matches={d.matches} initials={d.initials}>
      <main className="flex flex-col">
        <section className="mx-auto w-full max-w-[1200px] px-4 pb-7 pt-6 md:px-9 md:pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 pb-3 text-[12.5px] text-ink-soft">
            <Link href={`/services${demo ? "?demo" : ""}`} className="-ml-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-alt hover:text-ink">
              Services
            </Link>
            <Icon name="chevron-right" size={13} className="text-ink-faint" />
            <span className="font-mono tracking-tight">{d.caseRef}</span>
          </nav>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-12">
            <h1 className="max-w-[24ch] text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">{d.title}</h1>
            <div className="flex flex-none items-center gap-1 md:pt-1.5">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  live ? "bg-accent-soft text-accent-strong" : "bg-surface-alt text-ink-faint"
                }`}
              >
                <Icon name="circle-dot" size={13} />
                {d.status}
              </span>
              <span aria-hidden className="mx-1.5 h-4 w-px bg-line" />
              <TitleButton icon="pencil">Edit</TitleButton>
              <TitleButton icon="circle-stop">{live ? "Pause" : "Resume"}</TitleButton>
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
          <p className="mt-3 text-[12px] text-ink-faint">Your figures. A buyer is told that they fit, never what they are.</p>
        </section>

        <Group label="Matched" count={d.matched.length} fact="Every term cleared">
          {d.matched.length === 0 ? (
            <p className="px-4 py-[18px] text-[13.5px] text-ink-soft md:px-[22px]">No buyer has cleared every term yet.</p>
          ) : (
            d.matched.map((m) => (
              <PartyRow key={m.id} p={m}>
                <span className={`hidden flex-none text-[12px] font-medium sm:block ${m.yours ? "text-accent-strong" : "text-ink-soft"}`}>
                  {m.yours && <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle -translate-y-[0.09em]" />}
                  {m.state}
                </span>
                <span className="flex flex-none items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-[12px] font-semibold tabular-nums">
                  <Icon name="gauge" size={14} />
                  {m.score}
                </span>
                <RowButton href={`/matches/${m.id}`} primary={m.yours}>
                  Open
                </RowButton>
              </PartyRow>
            ))
          )}
        </Group>

        {d.awaiting.length > 0 && (
          <Group
            label="Awaiting"
            count={d.awaiting.length}
            fact="One term apart, and willing to move"
            note="Moving a term here re-checks every buyer against it. Nothing you change is shown to them."
          >
            {d.awaiting.map((m) => (
              <PartyRow key={m.id} p={m}>
                <span className="flex-none rounded-full bg-gold-soft px-2.5 py-1 text-[12px] font-semibold text-gold">{m.area}</span>
                <RowButton href={`/matches/${m.id}`}>Ask</RowButton>
              </PartyRow>
            ))}
          </Group>
        )}

        {d.declined > 0 && (
          <Group label="Declined" count={d.declined} fact={d.declinedReasons} muted>
            <DeclinedRow />
          </Group>
        )}
      </main>
    </AppShell>
  );
}

function TitleButton({ icon, children }: { icon: "circle-stop" | "pencil"; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
    >
      <Icon name={icon} size={13} />
      {children}
    </button>
  );
}
