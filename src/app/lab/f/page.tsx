import { Plus_Jakarta_Sans } from 'next/font/google';
import {
  ACTIVITY, COMPANY, ENVELOPE, FORMAT_LABEL, INCOMING, LIVE_NEGOTIATION, MATCHES, MEETING,
  PROBLEMS, STAGE_LABEL,
} from '../_data';

/**
 * Variant F, skill: high-end-visual-design (taste-skill).
 * Variance engine roll: vibe "Soft Structuralism" + layout "Asymmetrical Bento".
 * Rules applied: double-bezel cards (outer shell + inner core, concentric radii), pill CTAs with
 * button-in-button trailing icon, floating island nav with blur (fixed element only), eyebrow
 * pills, custom cubic-bezier motion, blur-in stagger on entry, diffuse tinted shadows only.
 */

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--f-sans' });

export const metadata = { title: 'F · high-end-visual-design — Lab' };

const EASE = 'ease-[cubic-bezier(0.32,0.72,0,1)]';

function Bezel({ className = '', inner = 'bg-white', i = 0, children }: { className?: string; inner?: string; i?: number; children: React.ReactNode }) {
  return (
    <div className={`lab-soft-in rounded-[2rem] bg-black/[0.035] p-1.5 ring-1 ring-black/[0.05] ${className}`} style={{ ['--i' as string]: i }}>
      <div className={`h-full rounded-[calc(2rem-0.375rem)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_40px_-24px_rgba(40,48,60,0.25)] md:p-8 ${inner}`}>
        {children}
      </div>
    </div>
  );
}

function Pill({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <button
      className={`group inline-flex items-center gap-3 rounded-full py-2 pl-5 pr-2 text-sm font-semibold transition-transform duration-500 ${EASE} active:scale-[0.98] ${
        dark ? 'bg-[#15171C] text-white' : 'bg-black/[0.05] text-[#15171C]'
      }`}
    >
      {children}
      <span
        className={`grid h-8 w-8 place-items-center rounded-full transition-transform duration-500 ${EASE} group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105 ${
          dark ? 'bg-white/15' : 'bg-white'
        }`}
        aria-hidden
      >
        ↗
      </span>
    </button>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full bg-black/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C6370]">{children}</span>;
}

export default function VariantF() {
  return (
    <div className={`${jakarta.variable} min-h-dvh bg-[#E9EAEC] pb-32 font-[family-name:var(--f-sans)] text-[#15171C]`}>
      {/* Floating island nav */}
      <nav className="fixed left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/70 p-1.5 text-sm font-medium shadow-[0_10px_30px_-12px_rgba(40,48,60,0.3)] ring-1 ring-black/[0.05] backdrop-blur-xl">
        <span className="px-4 font-bold">B2B Match</span>
        {['Overview', 'Matches', 'Meetings'].map((l, i) => (
          <a key={l} href="#" className={`rounded-full px-4 py-2 ${i === 0 ? 'bg-[#15171C] text-white' : 'hidden text-[#5C6370] hover:text-[#15171C] sm:block'}`}>{l}</a>
        ))}
      </nav>

      <main className="mx-auto max-w-[1200px] px-4 pt-32 md:px-8 md:pt-40">
        <div className="lab-soft-in max-w-3xl">
          <Eyebrow>{COMPANY.name}</Eyebrow>
          <h1 className="mt-6 text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1] tracking-[-0.045em]">
            You&rsquo;re meeting {MEETING.with} on Tuesday.
          </h1>
          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-[#5C6370]">
            Two agents settled the terms. You only walk in for the part that needs people.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Pill dark>Open the brief</Pill>
            <Pill>New problem</Pill>
          </div>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-12 md:mt-28">
          {/* Meeting */}
          <Bezel className="md:col-span-7 md:row-span-2" inner="flex flex-col bg-[#15171C] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]" i={1}>
            <span className="inline-block w-max rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">{MEETING.when}</span>
            <h2 className="mt-6 text-4xl font-bold tracking-[-0.03em] md:text-5xl">{MEETING.with}</h2>
            <p className="mt-2 text-white/60">{MEETING.person}</p>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                ['Format', FORMAT_LABEL[ENVELOPE.agreed_format!]],
                ['Budget', 'Compatible'],
                ['Confidence', `${ENVELOPE.confidence}/100`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white/[0.06] p-4">
                  <p className="text-xs text-white/50">{k}</p>
                  <p className="mt-1 font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-10">
              <p className="text-sm text-white/50">Still open</p>
              <ul className="mt-2 space-y-2">
                {ENVELOPE.open_questions.map((q) => <li key={q} className="text-white/85">{q}</li>)}
              </ul>
            </div>
          </Bezel>

          {/* Live */}
          <Bezel className="md:col-span-5" i={2}>
            <div className="flex items-center justify-between">
              <Eyebrow>Negotiating</Eyebrow>
              <span className="text-sm text-[#5C6370]">{LIVE_NEGOTIATION.turn} of {LIVE_NEGOTIATION.of}</span>
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-[-0.02em]">{LIVE_NEGOTIATION.with}</h2>
            <p className="mt-4 rounded-2xl bg-[#F3F4F6] p-4 text-[15px] leading-relaxed text-[#3A404A]">
              &ldquo;{LIVE_NEGOTIATION.lines[LIVE_NEGOTIATION.lines.length - 1].text}&rdquo;
            </p>
            <div className="mt-4 flex gap-1">
              {Array.from({ length: LIVE_NEGOTIATION.of }).map((_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < LIVE_NEGOTIATION.turn ? 'bg-[#15171C]' : 'bg-black/10'}`} />
              ))}
            </div>
          </Bezel>

          {/* Incoming */}
          <Bezel className="md:col-span-5" i={3}>
            <Eyebrow>Asking for you</Eyebrow>
            <ul className="mt-5 space-y-4">
              {INCOMING.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{m.buyer_industry}</p>
                    <p className="text-sm text-[#5C6370]">{m.buyer_size_hint}, {m.budget_compatible ? 'budget fits' : 'below your floor'}</p>
                  </div>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F3F4F6] text-sm font-bold">{m.score}</span>
                </li>
              ))}
            </ul>
          </Bezel>

          {/* Matches */}
          <Bezel className="md:col-span-8" i={4}>
            <h2 className="text-2xl font-bold tracking-[-0.02em]">Companies that can help</h2>
            <ul className="mt-6 divide-y divide-black/[0.06]">
              {MATCHES.map((m) => (
                <li key={m.id} className="grid gap-2 py-5 first:pt-0 last:pb-0 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold">{m.seller}</p>
                      <span className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#5C6370]">{STAGE_LABEL[m.stage]}</span>
                    </div>
                    <p className="mt-1 max-w-[60ch] text-[15px] text-[#5C6370]">{m.reasoning}</p>
                  </div>
                  <p className="text-4xl font-extrabold tracking-[-0.04em] md:text-right">{m.score}</p>
                </li>
              ))}
            </ul>
          </Bezel>

          {/* Problems */}
          <Bezel className="md:col-span-4" inner="bg-[#F7F7F8]" i={5}>
            <h2 className="text-2xl font-bold tracking-[-0.02em]">Your problems</h2>
            <p className="mt-1 text-sm text-[#5C6370]">Private to you.</p>
            <div className="mt-6 space-y-3">
              {PROBLEMS.map((p) => (
                <div key={p.id} className="rounded-2xl bg-white p-4 shadow-[0_8px_20px_-14px_rgba(40,48,60,0.35)]">
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-1 text-sm text-[#5C6370]">{p.matches} matches, {p.sealed} details kept back</p>
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-2 text-sm text-[#5C6370]">
              {ACTIVITY.slice(0, 3).map((a) => <p key={a.text}><span className="font-semibold text-[#15171C]">{a.when}</span> {a.text}</p>)}
            </div>
          </Bezel>
        </div>
      </main>
    </div>
  );
}
