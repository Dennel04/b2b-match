import { Inter_Tight, Instrument_Serif } from 'next/font/google';
import {
  ACTIVITY, COMPANY, ENVELOPE, FORMAT_LABEL, INCOMING, LIVE_NEGOTIATION, MATCHES, MEETING,
  PROBLEMS, STAGE_LABEL,
} from '../_data';

/**
 * Variant K, skill: awwwards (tponscr-debug/claude-skill-awwwards).
 * Art direction: emotion = calm control; industry = finance-like trust (number-forward,
 * neutral base, one green accent for positive); archetype = Monochrome + Pop.
 * Type: Inter Tight for display (fluid clamp, tracking -0.04em, leading 0.9) and Instrument Serif
 * italic used once. Colors in oklch. Layout varies rhythm section by section: giant hero,
 * marquee, broken-grid ledger with hanging numerals, sticky split for the dialogue.
 * Motion: power4.out curve, CSS scroll-driven reveals (the skill's no-GSAP alternative).
 */

const tight = Inter_Tight({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--k-sans' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['italic'], variable: '--k-serif' });

export const metadata = { title: 'K · awwwards — Lab' };

const C = {
  bg: 'oklch(0.975 0.004 100)',
  ink: 'oklch(0.19 0.01 260)',
  soft: 'oklch(0.52 0.01 260)',
  line: 'oklch(0.19 0.01 260 / 0.1)',
  pop: 'oklch(0.62 0.16 152)',
};
const EASE = 'cubic-bezier(0.16,1,0.3,1)';

export default function VariantK() {
  const feed = [...ACTIVITY, ...ACTIVITY];
  return (
    <div className={`${tight.variable} ${serif.variable} min-h-dvh overflow-x-hidden pb-32 font-[family-name:var(--k-sans)] text-[18px] tracking-[-0.01em]`} style={{ background: C.bg, color: C.ink }}>
      <header className="flex items-center justify-between px-5 py-5 text-[15px] md:px-10">
        <span className="font-semibold">B2B Match</span>
        <nav className="hidden gap-8 md:flex" style={{ color: C.soft }}>
          <a href="#" style={{ color: C.ink }}>Overview</a><a href="#">Matches</a><a href="#">Meetings</a>
        </nav>
        <span style={{ color: C.soft }}>{COMPANY.name}</span>
      </header>

      {/* Hero: the date is the headline. */}
      <section className="px-5 pb-16 pt-14 md:px-10 md:pt-24">
        <p className="max-w-[30ch] text-[17px]" style={{ color: C.soft }}>
          {COMPANY.person}, two agents did the first eight rounds for you. You walk into round nine.
        </p>
        <h1 className="lab-rise mt-6 text-[clamp(3.5rem,12vw,11.5rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
          Tuesday,<br />
          <span className="font-[family-name:var(--k-serif)] font-normal italic tracking-[-0.02em]" style={{ color: C.pop }}>with</span> {MEETING.with}
        </h1>
        <div className="mt-12 grid gap-8 border-t pt-8 md:grid-cols-4" style={{ borderColor: C.line }}>
          {[
            ['Time', '10:00, video call'],
            ['Format', FORMAT_LABEL[ENVELOPE.agreed_format!]],
            ['Budget', 'Compatible, amounts private'],
            ['Agent confidence', `${ENVELOPE.confidence} of 100`],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[14px]" style={{ color: C.soft }}>{k}</p>
              <p className="mt-1 text-[20px] font-medium">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href="#" className="group inline-flex h-14 items-center gap-3 rounded-full px-7 text-[17px] font-medium text-white" style={{ background: C.ink }}>
            Read the brief
            <span className="inline-block transition-transform duration-[400ms] group-hover:translate-x-1" style={{ transitionTimingFunction: EASE }}>→</span>
          </a>
          <a href="#" className="inline-flex h-14 items-center rounded-full border px-7 text-[17px] font-medium transition-colors duration-[250ms] hover:bg-white" style={{ borderColor: C.line }}>
            New problem
          </a>
        </div>
      </section>

      {/* Marquee: the activity feed as a moving ticker. */}
      <div className="overflow-hidden border-y py-5" style={{ borderColor: C.line }} aria-label="Recent activity">
        <div className="lab-marquee flex w-max gap-14 whitespace-nowrap text-[clamp(1.4rem,2.6vw,2.2rem)] font-medium tracking-[-0.03em]">
          {feed.map((a, i) => (
            <span key={i} className="flex items-center gap-14">
              <span><span style={{ color: C.soft }}>{a.when}</span> {a.text}</span>
              <span aria-hidden style={{ color: C.pop }}>✱</span>
            </span>
          ))}
        </div>
      </div>

      {/* Broken-grid ledger: numerals hang in their own column. */}
      <section className="px-5 py-24 md:px-10 md:py-32">
        <h2 className="max-w-[16ch] text-[clamp(2.2rem,5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
          Who answered, and how well they fit
        </h2>
        <ol className="mt-16">
          {MATCHES.map((m) => (
            <li key={m.id} className="lab-view grid gap-x-10 gap-y-2 border-t py-8 md:grid-cols-[minmax(0,2.2fr)_minmax(0,3fr)_minmax(0,1.2fr)]" style={{ borderColor: C.line }}>
              <p className="text-[clamp(4rem,9vw,8.5rem)] font-semibold leading-[0.8] tracking-[-0.06em] tabular-nums" style={m.stage === 'meeting' ? { color: C.pop } : undefined}>
                {m.score}
              </p>
              <div>
                <p className="text-[clamp(1.5rem,2.4vw,2.1rem)] font-medium leading-tight tracking-[-0.03em]">{m.seller}</p>
                <p className="mt-2 max-w-[52ch] leading-relaxed" style={{ color: C.soft }}>{m.reasoning}</p>
              </div>
              <div className="text-[15px] md:text-right">
                <p className="font-medium">{STAGE_LABEL[m.stage]}</p>
                <p style={{ color: m.compatibility.budget === 'gap' ? 'oklch(0.55 0.18 28)' : C.soft }}>
                  {m.compatibility.budget === 'gap' ? 'Budgets apart' : 'Budget fits'}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Sticky split: title stays, the dialogue scrolls past. */}
      <section className="px-5 py-24 text-white md:px-10 md:py-32" style={{ background: C.ink }}>
        <div className="grid gap-12 md:grid-cols-[1fr_1.3fr]">
          <div className="md:sticky md:top-16 md:h-max">
            <p className="text-[15px] text-white/50">Turn {LIVE_NEGOTIATION.turn} of {LIVE_NEGOTIATION.of}</p>
            <h2 className="mt-3 text-[clamp(2.4rem,5.5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.045em]">
              Agents talking to {LIVE_NEGOTIATION.with}
            </h2>
            <p className="mt-5 max-w-[34ch] text-white/60">Nobody from either company is in this room. Figures stay on each side of the wall.</p>
          </div>
          <div className="space-y-6">
            {LIVE_NEGOTIATION.lines.map((l, i) => (
              <div key={i} className="lab-view rounded-[28px] p-7" style={{ background: l.speaker === 'buyer_agent' ? 'oklch(0.26 0.01 260)' : 'oklch(0.23 0.01 260)' }}>
                <p className="text-[14px] text-white/45">{l.speaker === 'buyer_agent' ? 'Your agent' : `${LIVE_NEGOTIATION.with}'s agent`}</p>
                <p className="mt-2 text-[clamp(1.2rem,1.8vw,1.5rem)] leading-snug tracking-[-0.02em]">{l.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-up: problems and anonymous buyers, different rhythm again. */}
      <section className="grid gap-px md:grid-cols-2" style={{ background: C.line }}>
        <div className="px-5 py-20 md:px-10" style={{ background: C.bg }}>
          <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-semibold tracking-[-0.035em]">Your problems</h2>
          {PROBLEMS.map((p) => (
            <div key={p.id} className="lab-view mt-8">
              <p className="text-[20px] font-medium">{p.title}</p>
              <p className="mt-1" style={{ color: C.soft }}>{p.matches} matches. {p.sealed} specifics never left.</p>
            </div>
          ))}
        </div>
        <div className="px-5 py-20 md:px-10" style={{ background: C.bg }}>
          <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-semibold tracking-[-0.035em]">Buyers asking for you</h2>
          {INCOMING.map((m) => (
            <div key={m.id} className="lab-view mt-8">
              <p className="text-[20px] font-medium">{m.buyer_industry} <span style={{ color: C.soft }}>{m.score}</span></p>
              <p className="mt-1 max-w-[46ch]" style={{ color: C.soft }}>{m.reasoning_public}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
