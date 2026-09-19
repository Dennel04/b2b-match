import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Card, Chip, Icon, Pill, Row } from "@/components/ui";
import type { MatchView } from "@/types";
import { MatchActions } from "./MatchActions";

export interface MatchScreenData {
  m: MatchView;
  initials: string;
  matches: number;
  /** What this viewer may call the other side: a name once accepted, otherwise what they do. */
  counterparty: string;
  /** The buyer's own problem, shown only to the buyer — the seller never receives it. */
  problemTitle: string | null;
  terms: string[];
  formats: string[];
}

/** One match, read from the viewer's own side. Everything shown here was projected server-side. */
export function MatchScreen({ d }: { d: MatchScreenData }) {
  const { m } = d;
  const selling = m.viewer === "seller";

  return (
    <AppShell active="matches" matches={d.matches} initials={d.initials}>
      <main className="flex flex-col">
        <section className="mx-auto w-full max-w-[1200px] px-4 pb-7 pt-6 md:px-9 md:pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 pb-3 text-[12.5px] text-ink-soft">
            <Link href="/matches" className="-ml-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-alt hover:text-ink">
              Matches
            </Link>
            <Icon name="chevron-right" size={13} className="text-ink-faint" />
            <span className="font-mono tracking-tight">MTC-{m.id.slice(0, 4)}</span>
          </nav>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-12">
            <div className="min-w-0">
              <h1 className="max-w-[26ch] text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">
                {d.counterparty}
              </h1>
              {d.problemTitle && (
                <p className="mt-2 text-[13px] text-ink-faint">
                  Against your problem: <span className="text-ink-soft">{d.problemTitle}</span>
                </p>
              )}
            </div>
            <div className="flex flex-none items-center gap-1.5 md:pt-1.5">
              <Chip tone={m.status === "declined" ? "quiet" : "accent"}>
                <Icon name="circle-dot" size={13} />
                {STATE[m.status][selling ? 1 : 0]}
              </Chip>
              <Chip tone="neutral" className="tabular-nums">
                <Icon name="gauge" size={14} />
                {m.score}
              </Chip>
            </div>
          </div>

          <p className="mt-3.5 max-w-[60ch] text-[16.5px] leading-[1.6] text-ink-soft">{m.reasoning_public}</p>

          {!m.negotiating && <MatchActions id={m.id} status={m.status} viewer={m.viewer} hasBrief={!!m.brief_md} />}
        </section>

        <Section label="Terms" fact="Compatibility, never the figures">
          <Card>
            {TERMS.map(([label, key]) => {
              const state = m.compatibility?.[key] ?? "unknown";
              return (
                <Row key={label}>
                  <span className="min-w-0 flex-1 text-[14px] font-semibold">{label}</span>
                  <Chip tone={state === "ok" ? "accent" : state === "gap" ? "seal" : "neutral"}>
                    {{ ok: "Compatible", gap: "Apart", unknown: "Not stated" }[state]}
                  </Chip>
                </Row>
              );
            })}
            {d.formats.length > 0 && (
              <Row>
                <span className="min-w-0 flex-1 text-[14px] font-semibold">Formats both sides accept</span>
                <span className="flex flex-wrap gap-2">
                  {d.formats.map((f) => (
                    <Pill key={f}>{f}</Pill>
                  ))}
                </span>
              </Row>
            )}
          </Card>
          {d.terms.length > 0 && (
            <>
              <p className="mt-5 text-[12.5px] text-ink-faint">
                Your figures. The other side is told that they fit, never what they are.
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {d.terms.map((t) => (
                  <li key={t}>
                    <Pill>{t}</Pill>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>

        {m.negotiation && (
          <Section
            label="The agents"
            fact={m.negotiating ? "Negotiating now" : "What they settled without you"}
            note="Your problem was never sent. A withheld line is one your agent refused to answer."
          >
            <Card className="flex flex-col gap-3 p-5">
              {m.negotiation.lines.map((l, i) => {
                const mine = selling ? l.speaker === "seller_agent" : l.speaker === "buyer_agent";
                return (
                  <div key={i} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                    <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
                      {mine ? "Your agent" : "Their agent"}
                    </span>
                    <p
                      className={`max-w-[46ch] rounded-[10px] px-3.5 py-2.5 text-[14px] leading-[1.55] ${
                        mine ? "bg-surface-alt text-ink" : "border border-line text-ink-soft"
                      }`}
                    >
                      {l.text}
                    </p>
                    {l.withheld && <Chip tone="seal">Withheld</Chip>}
                  </div>
                );
              })}
            </Card>

            {m.negotiation.envelope && (
              <Card className="mt-4">
                <Row>
                  <span className="min-w-0 flex-1 text-[14px] font-semibold">Verdict</span>
                  <Chip tone={m.negotiation.envelope.verdict === "proceed" ? "accent" : "quiet"}>
                    {m.negotiation.envelope.verdict === "proceed" ? "Meet" : "Do not meet"}
                  </Chip>
                </Row>
                {m.negotiation.envelope.agreed_format && (
                  <Row>
                    <span className="min-w-0 flex-1 text-[14px] font-semibold">Agreed format</span>
                    <span className="text-[13px] text-ink-soft">{m.negotiation.envelope.agreed_format.replace(/_/g, " ")}</span>
                  </Row>
                )}
                {m.negotiation.envelope.earliest_start && (
                  <Row>
                    <span className="min-w-0 flex-1 text-[14px] font-semibold">Earliest start</span>
                    <span className="text-[13px] text-ink-soft">{m.negotiation.envelope.earliest_start}</span>
                  </Row>
                )}
                {m.negotiation.envelope.open_questions.map((q) => (
                  <Row key={q}>
                    <span className="min-w-0 flex-1 text-[14px] text-ink-soft">{q}</span>
                    <Chip tone="seal">For the people</Chip>
                  </Row>
                ))}
              </Card>
            )}
          </Section>
        )}

        {m.brief_md && (
          <Section label="Briefing" fact="Both sides accepted">
            <Card className="px-5 py-4">
              <Brief md={m.brief_md} />
            </Card>
          </Section>
        )}
      </main>
    </AppShell>
  );
}

const STATE: Record<MatchView["status"], [buyer: string, seller: string]> = {
  proposed: ["New match", "Waiting on the buyer"],
  buyer_interested: ["Interest sent", "Interest received"],
  accepted: ["Meeting confirmed", "Meeting confirmed"],
  declined: ["Declined", "Declined"],
};

const TERMS = [
  ["Budget", "budget"],
  ["Timeline", "timeline"],
  ["Contract format", "formats"],
] as const;

function Section({ label, fact, note, children }: { label: string; fact: string; note?: string; children: React.ReactNode }) {
  return (
    <section aria-label={label} className="mx-auto w-full max-w-[1200px] px-4 pb-7 last:pb-12 md:px-9">
      <div className="flex items-baseline gap-2.5 pb-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{label}</h2>
        <span className="ml-auto text-right text-[12.5px] text-ink-soft">{fact}</span>
      </div>
      {children}
      {note && <p className="mt-2.5 text-[12px] text-ink-faint">{note}</p>}
    </section>
  );
}

/**
 * The briefing as the model wrote it: headings, bullets, paragraphs, nothing else.
 * ponytail: four line shapes instead of a markdown dependency — briefPrompt() writes no others.
 */
function Brief({ md }: { md: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {md.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return null;
        if (t.startsWith("## ")) return <h3 key={i} className="mt-2 text-[15px] font-semibold first:mt-0">{t.slice(3)}</h3>;
        if (t.startsWith("# ")) return <h3 key={i} className="mt-2 text-[15px] font-semibold first:mt-0">{t.slice(2)}</h3>;
        if (t.startsWith("- ") || t.startsWith("* "))
          return (
            <p key={i} className="flex gap-2.5 pl-1 text-[14px] leading-[1.6] text-ink-soft">
              <span aria-hidden className="mt-[0.6em] h-1 w-1 flex-none rounded-full bg-ink-faint" />
              {t.slice(2)}
            </p>
          );
        return <p key={i} className="max-w-[70ch] text-[14px] leading-[1.6] text-ink-soft">{t}</p>;
      })}
    </div>
  );
}
