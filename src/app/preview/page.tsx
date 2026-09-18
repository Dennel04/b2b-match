import type { AgentDialogueLine, DealEnvelope } from '@/types';

export const metadata = { title: 'Match — B2B Match' };

/**
 * Static mockup of the screen the whole demo rests on: the two readings of one problem,
 * the machine negotiation, and the outcome. Hardcoded data, no server calls.
 * Route: /preview
 */

/** A specific that never left the buyer's side. Sealed, not hidden — the owner still reads it. */
function Sealed({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gold-soft border-b-2 border-gold px-[0.15em] py-[0.05em] rounded-[2px]">
      {children}
    </span>
  );
}

const TRANSCRIPT: (AgentDialogueLine & { withheld?: boolean })[] = [
  {
    speaker: 'buyer_agent',
    text: 'My client runs a multi-site operation and is losing significant staff time to a manual back-office process. Have you replaced a paper-based workflow at this scale before?',
  },
  {
    speaker: 'seller_agent',
    text: 'Three logistics clients in the last two years, all multi-warehouse. We typically cut manual handling by 70 to 80 percent inside the first quarter.',
  },
  {
    speaker: 'buyer_agent',
    text: 'There have been compliance consequences from the current process. Do your deployments cover filing accuracy, or only speed?',
  },
  {
    speaker: 'seller_agent',
    text: 'Both. Validation sits inside the filing step, so errors surface before submission rather than after. To size this — how many filings a month, and how many people touch them?',
  },
  {
    speaker: 'buyer_agent',
    withheld: true,
    text: 'Between one and two hundred a month, across several sites. The exact counts, and what the current errors have cost, stay with my client until a meeting is agreed.',
  },
  {
    speaker: 'seller_agent',
    text: 'That sits inside our normal range. A monthly retainer fits better than a fixed price here — volume varies and you will want us reachable after go-live.',
  },
  {
    speaker: 'buyer_agent',
    text: 'My client will consider a retainer. They need to begin before mid-November, and they require a signed DPA and Estonian-language support.',
  },
  {
    speaker: 'seller_agent',
    text: 'We are free from late September and we sign DPAs as standard. Estonian-language support is available, though our written documentation is in English.',
  },
];

const ENVELOPE: DealEnvelope = {
  verdict: 'proceed',
  agreed_format: 'monthly_retainer',
  budget_compatible: true,
  earliest_start: '2026-09-25',
  open_questions: [
    'Does Estonian-language coverage extend to written documentation, or only to support conversations?',
    'Does the first month run as a trial period, and does it count toward the retainer?',
  ],
  confidence: 84,
};

export default function PreviewPage() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 py-12 md:py-16">
      <header className="mb-12 border-b border-line pb-6">
        <p className="text-sm text-ink-soft">Match 04 · Nordkai Logistics</p>
        <h1 className="mt-1 font-serif text-3xl md:text-4xl">
          Rebase OÜ can help, and has never read your problem
        </h1>
      </header>

      {/* The two readings. Mass does the arguing: a full document against what actually crossed. */}
      <section className="grid gap-10 md:grid-cols-[1.55fr_1fr] md:gap-14">
        <article>
          <h2 className="mb-4 text-sm font-medium text-ink-soft">Your problem, as you wrote it</h2>
          <div className="rounded-sm border border-line bg-surface p-6 md:p-8">
            <p className="font-serif text-lg leading-[1.75] md:text-xl md:leading-[1.8]">
              We&rsquo;re still doing <Sealed>customs</Sealed> paperwork by hand across{' '}
              <Sealed>three warehouses</Sealed>. It eats{' '}
              <Sealed>about 60 hours a month between two people</Sealed>, and we&rsquo;ve had{' '}
              <Sealed>two fines this year</Sealed> from filing errors. We tried{' '}
              <Sealed>a freelancer last spring</Sealed> and it didn&rsquo;t stick.
            </p>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
            <span className="inline-block h-3 w-3 rounded-[2px] bg-gold-soft border-b-2 border-gold" />
            Five specifics stayed with you. They were never sent anywhere.
          </p>
        </article>

        <article className="md:pt-9">
          <h2 className="mb-4 text-sm font-medium text-ink-soft">What Rebase OÜ received</h2>
          <div className="rounded-sm border border-line bg-surface-alt p-6">
            <p className="font-serif leading-[1.7]">
              A mid-sized logistics company needs help automating a manual back-office process
              across several sites. They have tried an external contractor before without success.
            </p>
          </div>
          <p className="mt-3 text-sm text-ink-soft">Nothing else crossed.</p>
        </article>
      </section>

      {/* The machine channel. Same sealing language, so the refusal reads as the same act. */}
      <section className="mt-16 md:mt-20">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
          <h2 className="font-serif text-2xl">What the agents said to each other</h2>
          <p className="text-sm text-ink-soft">Neither company was present</p>
        </div>

        <ol className="space-y-5">
          {TRANSCRIPT.map((line, i) => {
            const buyer = line.speaker === 'buyer_agent';
            return (
              <li
                key={i}
                className={`md:grid md:grid-cols-[1fr_9rem] md:gap-6 ${buyer ? '' : 'md:pl-16'}`}
              >
                <div
                  className={
                    line.withheld
                      ? 'rounded-sm border border-gold bg-gold-soft p-5'
                      : 'rounded-sm border border-line bg-surface p-5'
                  }
                >
                  <p className="mb-1.5 text-xs font-medium text-ink-soft">
                    {buyer ? 'Nordkai&rsquo;s agent' : 'Rebase&rsquo;s agent'}
                  </p>
                  <p className="leading-relaxed">{line.text}</p>
                </div>
                {line.withheld && (
                  <p className="mt-2 text-sm text-gold md:mt-0 md:self-center">
                    Asked for exact figures. Declined.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Outcome. The closing line is the pitch. */}
      <section className="mt-16 rounded-sm border border-line bg-surface p-6 md:mt-20 md:p-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-serif text-2xl text-accent">The agents recommend meeting</span>
          <span className="text-sm text-ink-soft">confidence {ENVELOPE.confidence} of 100</span>
        </div>

        <dl className="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-ink-soft">Contract format</dt>
            <dd className="mt-1">Monthly retainer</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-soft">Budget</dt>
            <dd className="mt-1 flex items-center gap-1.5">
              <span aria-hidden className="text-accent">✓</span> Terms match
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-soft">Could start</dt>
            <dd className="mt-1">25 September</dd>
          </div>
        </dl>

        <div className="mt-8 border-t border-line pt-6">
          <h3 className="text-sm font-medium text-ink-soft">Left for the two of you</h3>
          <ul className="mt-3 space-y-2">
            {ENVELOPE.open_questions.map((q) => (
              <li key={q} className="font-serif leading-relaxed">
                {q}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button className="rounded-sm bg-accent px-5 py-2.5 text-surface hover:bg-accent-strong">
            Accept meeting
          </button>
          <button className="rounded-sm border border-line-strong px-5 py-2.5 hover:bg-surface-alt">
            Not this one
          </button>
        </div>

        <p className="mt-6 text-sm text-ink-soft">
          Neither side was shown the other&rsquo;s budget. We compared them and reported only that
          they match.
        </p>
      </section>
    </main>
  );
}
