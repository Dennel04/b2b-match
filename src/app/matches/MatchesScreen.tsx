import Link from "next/link";
import { DeclinedRow, Group, PartyRow, RowButton, type Party } from "@/components/counterparties";

import { Icon } from "@/components/ui";
import type { CompanyRole } from "@/types";
import { sells } from "../onboarding/fields";
import { Unlock } from "./Unlock";

/**
 * One counterparty across every problem. `context` is what the viewer is allowed to know about
 * why this pair exists — the problem's own title on the buyer's side, the industry and size of
 * an anonymous buyer on the seller's. Never the other side's figures.
 */
export interface MatchLine extends Party {
  context: string;
  state: string;
  /** Which side of the wall this row is on. The screen is read one side at a time. */
  side: Side;
  /** The next move is the viewer's: they are the one holding the double opt-in up. */
  yours: boolean;
  score: number;
  /** A buyer who arrived at this company's service, not yet paid for. Blurred until they are. */
  locked?: boolean;
}

/** Selling is a buyer who came to you; buying is a vendor for a problem you wrote. */
export type Side = "selling" | "buying";

export interface MatchesScreenData {
  initials: string;
  /** Counterparties that arrived while nobody was looking. The line under the title, nothing else. */
  unseen: number;
  /** Decides what an empty screen invites: a buyer writes a problem, a seller can only be findable. */
  role: CompanyRole;
  matched: MatchLine[];
  awaiting: (Party & { context: string; area: string; side: Side })[];
  declined: Record<Side, number>;
}

/**
 * Every counterparty the company has, on one screen. The problem screen answers "who can solve
 * this one problem"; this answers "where do I have to move next" — so the rows waiting on the
 * viewer sort to the top and carry the only filled button on the screen.
 */
export function MatchesScreen({ d }: { d: MatchesScreenData; demo?: boolean }) {
  const open = d.matched.length + d.awaiting.length;
  const yours = d.matched.filter((m) => m.yours).length;
  const declined = d.declined.selling + d.declined.buying;

  // Two sides, never mixed: one is people who came to you, the other people you went looking
  // for. The same three groups inside each, because a match reads the same way on both.
  const side = (s: Side) => ({
    matched: d.matched.filter((m) => m.side === s).sort((a, b) => Number(b.yours) - Number(a.yours) || b.score - a.score),
    awaiting: d.awaiting.filter((m) => m.side === s),
    declined: d.declined[s],
  });
  const selling = side("selling");
  const buying = side("buying");
  const has = (x: ReturnType<typeof side>) => x.matched.length + x.awaiting.length + x.declined > 0;

  return (
    <>
      <main className="flex flex-col">
        <section className="mx-auto w-full max-w-[1200px] px-4 pb-1 pt-6 md:px-9 md:pt-8">
          <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">Matches</h1>
          <p className="mt-2 text-[14px] text-ink-soft">
            {open} open
            {yours > 0 && (
              <span className="ml-3 font-semibold text-accent-strong">
                <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle -translate-y-[0.09em]" />
                {yours} waiting for you
              </span>
            )}
          </p>
        </section>

        {open === 0 && declined === 0 ? (
          <Blank role={d.role} />
        ) : (
          <div className="pt-4">
            {has(selling) && (
              <Side title="They came to you" lead="Buyers who arrived through your services." {...selling} />
            )}
            {has(buying) && (
              <Side title="Can help you" lead="Vendors matched to the problems you wrote." {...buying} />
            )}
          </div>
        )}
      </main>
    </>
  );
}

/** One side of the wall: the three groups, under the heading that says whose move brought them. */
function Side({
  title,
  lead,
  matched,
  awaiting,
  declined,
}: {
  title: string;
  lead: string;
  matched: MatchLine[];
  awaiting: MatchesScreenData["awaiting"];
  declined: number;
}) {
  return (
    <section aria-label={title} className="border-t border-line pt-7 first:border-0 first:pt-1">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-1 md:px-9">
        <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{title}</h2>
        <p className="mt-1 text-[13px] text-ink-soft">{lead}</p>
      </div>

      {matched.length > 0 && (
        <Group
          label="Matched"
          count={matched.length}
          fact="Every term cleared"
          note={
            matched.some((m) => m.locked)
              ? "Opening one costs 10 credits. Being matched, and the agents' work, stay free."
              : undefined
          }
        >
          {matched.map((m) => (
            <PartyRow key={m.id} p={m}>
              <Context>{m.context}</Context>
              <span className={`hidden flex-none text-[12px] font-medium sm:block ${m.yours ? "text-accent-strong" : "text-ink-soft"}`}>
                {m.yours && <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle -translate-y-[0.09em]" />}
                {m.locked ? "Waiting to be opened" : m.state}
              </span>
              {/* The score is never blurred: it is the reason to spend the credit. */}
              <span className="flex flex-none items-center gap-1.5 rounded-[7px] bg-surface-alt px-2.5 py-1 text-[12px] font-semibold tabular-nums">
                <Icon name="gauge" size={14} />
                {m.score}
              </span>
              {m.locked ? (
                <Unlock id={m.id} />
              ) : (
                <RowButton href={`/matches/${m.id}`} primary={m.yours}>
                  Open
                </RowButton>
              )}
            </PartyRow>
          ))}
        </Group>
      )}

      {awaiting.length > 0 && (
        <Group
          label="Awaiting"
          count={awaiting.length}
          fact="One term apart, and willing to move"
          note="Asking reveals nothing about you, and never sends your problem."
        >
          {awaiting.map((m) => (
            <PartyRow key={m.id} p={m}>
              <Context>{m.context}</Context>
              <span className="flex-none rounded-[7px] bg-gold-soft px-2.5 py-1 text-[12px] font-semibold text-gold">{m.area}</span>
              <RowButton href={`/matches/${m.id}`}>Ask</RowButton>
            </PartyRow>
          ))}
        </Group>
      )}

      {declined > 0 && (
        <Group label="Declined" count={declined} fact="Nothing was sent to them" muted>
          <DeclinedRow />
        </Group>
      )}
    </section>
  );
}

/**
 * Nothing here yet — so say what would change that, from this company's own side. A seller
 * cannot summon a buyer; the one thing in its hands is whether what it offers is written well
 * enough for the matcher to read. Only a company that does not sell at all leads with the
 * problem, because `role` defaults to 'both' and almost every company here sells something.
 */
function Blank({ role }: { role: CompanyRole }) {
  const offers = sells(role);
  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 md:px-9">
      <div className="rounded-[10px] border border-line bg-surface p-8 text-center">
        <p className="text-[15px] font-semibold">{offers ? "No one has come to you yet" : "No one to meet yet"}</p>
        <p className="mt-1.5 text-[13.5px] text-ink-soft">
          {offers ? "Buyers find you through your services." : "Describe a problem and matching starts."}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <Link
            href={offers ? "/company" : "/problems/new"}
            className="inline-flex items-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-[13px] font-semibold text-surface transition-colors hover:bg-brand-strong"
          >
            <Icon name={offers ? "building-2" : "plus"} size={15} />
            {offers ? "Review your services" : "Describe a problem"}
          </Link>
          {role === "both" && (
            <Link href="/problems/new" className="text-[13px] text-ink-soft underline-offset-4 hover:text-ink hover:underline">
              Describe a problem
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/** Which problem a row belongs to. Quiet: it explains the row, it is not the point of it. */
function Context({ children }: { children: React.ReactNode }) {
  return <span className="hidden w-[210px] flex-none truncate text-right text-[12.5px] text-ink-faint lg:block">{children}</span>;
}
