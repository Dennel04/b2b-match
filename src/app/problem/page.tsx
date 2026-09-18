import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "PRB-4f21 — B2B Match" };

/**
 * The buyer's own problem page. Hardcoded for the demo; the shapes match src/types.ts.
 *
 * Order of the page is the argument: the document first, then the small amount that left it,
 * then who it reached, then what the machines did while the buyer waited.
 */

/** A specific that never left this page. The owner still reads it — the mark means "stayed here". */
function Sealed({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[2px] border-b-2 border-gold bg-gold-soft px-[0.15em] py-[0.05em]">
      {children}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line-strong px-[11px] py-1.5 text-[12.5px] font-medium">
      {children}
    </span>
  );
}

const VENDORS = [
  {
    label: "Process automation vendor",
    detail: "Logistics back office, Tartu, 10–20 people",
    score: 91,
    state: "Agents finished — waiting on you",
  },
  {
    label: "Back-office automation vendor",
    detail: "Freight and 3PL back office, 10–20 people",
    score: 74,
    state: "Agents still talking",
  },
];

const FILTERED = [
  {
    label: "Enterprise logistics automation, 60 people",
    reason: "Minimum engagement above your ceiling. Never saw your problem.",
  },
  {
    label: "Web development and integrations, 6 people",
    reason: "Will not sign a data protection agreement. Never saw your problem.",
  },
];

const LOG = [
  { time: "20:14", text: "Terms checked against 9 companies. 7 did not clear them." },
  { time: "20:14", text: "2 agents opened negotiation on your behalf." },
  { time: "20:26", text: "One agent asked for exact figures. Yours declined." },
  { time: "20:31", text: "First negotiation finished. A meeting is recommended." },
];

export default function ProblemPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <SiteHeader>
        <span className="font-medium">PRB-4f21</span>
        <span className="flex items-center gap-1.5 rounded-md bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent-strong">
          Matching
        </span>
        <span className="hidden text-[12px] text-ink-soft sm:inline">Private to you</span>
      </SiteHeader>

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 sm:px-12">
        {/* The document, and the little that left it. */}
        <section className="grid gap-10 pt-6 md:grid-cols-[1.6fr_1fr] md:gap-14">
          <article>
            <h1 className="text-[13px] font-medium text-ink-soft">Your problem, as you wrote it</h1>
            <div className="mt-3 rounded-[10px] border border-line bg-surface p-6 md:p-8">
              <p className="text-[19px] leading-[1.7] md:text-[21px] md:leading-[1.75]">
                We&rsquo;re still doing <Sealed>customs</Sealed> paperwork by hand across{" "}
                <Sealed>three warehouses</Sealed>. It eats{" "}
                <Sealed>about 60 hours a month between two people</Sealed>, and we&rsquo;ve had{" "}
                <Sealed>two fines this year</Sealed> from filing errors. We tried{" "}
                <Sealed>a freelancer last spring</Sealed> and it didn&rsquo;t stick.
              </p>
            </div>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-ink-soft">
              <span className="inline-block h-3 w-3 rounded-[2px] border-b-2 border-gold bg-gold-soft" />
              Five specifics stayed on this page. They were never sent anywhere.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill>Ceiling €4,000 / month</Pill>
              <Pill>Start by 15 Nov 2026</Pill>
              <Pill>Pilot first or retainer</Pill>
              <Pill>DPA, Estonian</Pill>
            </div>
            <p className="mt-2 text-[12px] text-ink-faint">
              Your ceiling is compared inside the system. No vendor is ever shown the figure.
            </p>
          </article>

          <article className="md:pt-8">
            <h2 className="text-[13px] font-medium text-ink-soft">What the vendors received</h2>
            <div className="mt-3 rounded-[10px] border border-line bg-surface-alt p-6">
              <p className="leading-[1.7]">
                A mid-sized logistics company needs help automating a manual back-office process
                across several sites. They have tried an external contractor before without
                success.
              </p>
            </div>
            <p className="mt-3 text-[13px] text-ink-soft">Nothing else crossed.</p>
          </article>
        </section>

        {/* Who it reached, and who it never reached. */}
        <section className="mt-14">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-3">
            <h2 className="font-semibold">Companies ready to solve it</h2>
            <span className="rounded-md bg-ink px-[7px] py-0.5 text-[11.5px] font-semibold text-bg">
              {VENDORS.length}
            </span>
            <span className="ml-auto text-[12px] text-ink-soft">
              {FILTERED.length} more did not clear your terms
            </span>
          </div>

          <ul className="overflow-hidden rounded-[10px] border border-line bg-surface">
            {VENDORS.map((v) => (
              <li
                key={v.label}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{v.label}</p>
                  <p className="mt-0.5 text-[13px] text-ink-soft">{v.detail}</p>
                </div>
                <span className="text-[12px] text-accent-strong">{v.state}</span>
                <span className="rounded-md border border-line-strong px-2.5 py-1 text-[12px] font-semibold">
                  {v.score}
                </span>
                <button className="rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-bg hover:bg-ink-soft">
                  Open
                </button>
              </li>
            ))}

            {FILTERED.map((f) => (
              <li
                key={f.label}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-5 py-3.5 last:border-b-0 bg-surface-alt/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{f.label}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-soft">{f.reason}</p>
                </div>
                <span className="text-[12px] text-ink-faint">Filtered</span>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[12px] text-ink-faint">
            Names appear once both sides have agreed to meet.
          </p>
        </section>

        {/* What the machines did while nobody was watching. */}
        <section className="mt-14">
          <h2 className="pb-3 font-semibold">While you were away</h2>
          <ol className="rounded-[10px] border border-line bg-surface">
            {LOG.map((e) => (
              <li
                key={e.time + e.text}
                className="flex gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
              >
                <span className="w-12 shrink-0 text-[13px] tabular-nums text-ink-faint">
                  {e.time}
                </span>
                <span className="text-[14px]">{e.text}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
