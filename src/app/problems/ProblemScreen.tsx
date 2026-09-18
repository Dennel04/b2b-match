import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui";

interface Party {
  id: string;
  name: string;
  place: string;
  logo?: string;
}

export interface ProblemScreenData {
  caseRef: string;
  status: string;
  initials: string;
  offers: number;
  title: string;
  summary: string;
  terms: string[];
  matched: (Party & { state: string; ready: boolean; score: number })[];
  awaiting: (Party & { area: string })[];
  declined: number;
}

/** The buyer's problem screen, rebuilt from drafts/design/problem-page.html. */
export function ProblemScreen({ d, setup }: { d: ProblemScreenData; setup?: React.ReactNode }) {
  return (
    <AppShell
      active="problems"
      offers={d.offers}
      initials={d.initials}
      bar={
        <>
          <Link href="/dashboard" aria-label="Back to problems" className="text-ink-soft hover:text-ink">
            <Icon name="chevron-left" />
          </Link>
          <span className="font-mono text-[13.5px] font-medium tracking-tight">{d.caseRef}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[12px] font-semibold text-accent-strong">
            <Icon name="circle-dot" size={13} />
            {d.status}
          </span>
          <BarButton icon="circle-stop">Stop</BarButton>
        </>
      }
      barRight={<BarButton icon="pencil">Edit</BarButton>}
    >
      <main className="flex flex-col">
        {setup}
        <section className="mx-auto w-full max-w-[1200px] px-4 pb-7 pt-9 md:px-9">
          <h1 className="max-w-[24ch] text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">{d.title}</h1>
          <p className="mt-3 max-w-[60ch] text-[16.5px] leading-[1.6] text-ink-soft">{d.summary}</p>
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
            <Row key={m.id} p={m}>
              <span className={`hidden flex-none text-[12px] font-medium sm:block ${m.ready ? "text-accent-strong" : "text-ink-soft"}`}>
                {m.ready && <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-accent" />}
                {m.state}
              </span>
              <span className="flex flex-none items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-[12px] font-semibold tabular-nums">
                <Icon name="gauge" size={14} />
                {m.score}
              </span>
              <RowButton href={`/matches/${m.id}`} primary={m.ready}>Open</RowButton>
            </Row>
          ))}
        </Group>

        <Group
          label="Awaiting"
          count={d.awaiting.length}
          fact="One term apart, and willing to move"
          note="Asking reveals nothing about you, and never sends your problem."
        >
          {d.awaiting.map((m) => (
            <Row key={m.id} p={m}>
              <span className="flex-none rounded-full bg-gold-soft px-2.5 py-1 text-[12px] font-semibold text-gold">{m.area}</span>
              <RowButton href={`/matches/${m.id}`}>Ask</RowButton>
            </Row>
          ))}
        </Group>

        <Group label="Declined" count={d.declined} fact="Nothing was sent to them" muted>
          <div className="flex items-center gap-4 bg-bg/50 px-4 py-[18px] md:px-[22px]">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-surface-alt text-ink-faint">
              <Icon name="circle-x" />
            </span>
            <p className="min-w-0 flex-1 text-[14px] font-semibold">Could help if you moved a term</p>
            <RowButton href="#">Review</RowButton>
          </div>
        </Group>
      </main>
    </AppShell>
  );
}

function BarButton({ icon, children }: { icon: "circle-stop" | "pencil"; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-1.5 rounded-[9px] border border-line-strong bg-surface px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-surface-alt"
    >
      <Icon name={icon} size={13} />
      {children}
    </button>
  );
}

function Group({
  label,
  count,
  fact,
  note,
  muted,
  children,
}: {
  label: string;
  count: number;
  fact: string;
  note?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={label} className="mx-auto w-full max-w-[1200px] px-4 pb-7 last:pb-12 md:px-9">
      <div className="flex items-baseline gap-2.5 pb-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{label}</h2>
        <span
          className={`rounded-full px-2 py-px text-[11.5px] font-semibold tabular-nums ${
            muted ? "bg-surface-alt text-ink-faint" : "bg-ink text-surface"
          }`}
        >
          {count}
        </span>
        <span className="ml-auto text-right text-[12.5px] text-ink-soft">{fact}</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgb(19_48_58/0.04)]">{children}</div>
      {note && <p className="mt-2.5 text-[12px] text-ink-faint">{note}</p>}
    </section>
  );
}

function Row({ p, children }: { p: Party; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-surface-alt px-4 py-[18px] last:border-0 md:px-[22px]">
      <span className="grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-[11px] border border-line bg-surface">
        {p.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.logo} alt="" width={26} height={26} className="block object-contain" />
        ) : (
          <Icon name="building-2" className="text-ink-faint" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{p.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-ink-soft">{p.place}</p>
      </div>
      {children}
    </div>
  );
}

function RowButton({ href, primary, children }: { href: string; primary?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex-none rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-colors ${
        primary ? "bg-ink text-surface hover:bg-ink-soft" : "border border-line-strong bg-surface text-ink hover:bg-surface-alt"
      }`}
    >
      {children}
    </Link>
  );
}
