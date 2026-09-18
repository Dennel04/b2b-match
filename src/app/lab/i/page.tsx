import { Onest } from 'next/font/google';
import {
  ACTIVITY, COMPANY, ENVELOPE, FORMAT_LABEL, INCOMING, LIVE_NEGOTIATION, MATCHES, MEETING,
  PROBLEMS, STAGE_LABEL,
} from '../_data';

/**
 * Variant I, skill: liquid-glass (Armitanemati/liquid-glass-claude-skill).
 * Layer map: content (matches, problems, dialogue) = no glass, solid surfaces.
 * Functional floating UI = glass: top nav (regular tier), bottom action dock (regular),
 * meeting sheet that stays reachable while content scrolls (thick tier). No glass on glass.
 * Backdrop is a non-flat ambient field, because blur over a flat gradient is invisible.
 * Brand stays the project's own: teal accent from globals.css, not borrowed from Apple.
 * Fallback: opaque fill without backdrop-filter or with reduced transparency (lab.css).
 */

const onest = Onest({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--i-sans' });

export const metadata = { title: 'I · liquid-glass — Lab' };

const TEAL = '#1F5C54';

export default function VariantI() {
  return (
    <div className={`${onest.variable} relative min-h-dvh bg-[#EEF1F0] pb-40 font-[family-name:var(--i-sans)] text-[#14201D]`}>
      {/* Ambient field: gives the glass something real to refract. Fixed, never scrolls. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-[#9ED3C6] opacity-70 blur-[90px]" />
        <div className="absolute right-[-10%] top-[20%] h-[520px] w-[520px] rounded-full bg-[#F2C9A0] opacity-60 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[30%] h-[560px] w-[560px] rounded-full bg-[#B9C6F0] opacity-60 blur-[110px]" />
      </div>

      {/* Regular-tier glass nav */}
      <nav className="lab-glass-regular fixed inset-x-4 top-4 z-30 mx-auto flex h-14 max-w-[1180px] items-center gap-6 rounded-2xl px-5 shadow-[0_8px_32px_-12px_rgba(20,32,29,0.25)]">
        <span className="font-bold tracking-tight">B2B Match</span>
        <div className="hidden gap-1 text-sm md:flex">
          {['Overview', 'Problems', 'Matches', 'Meetings'].map((l, i) => (
            <a key={l} href="#" className={`rounded-lg px-3 py-1.5 ${i === 0 ? 'bg-white/70 font-medium' : 'text-[#43524E] hover:bg-white/40'}`}>{l}</a>
          ))}
        </div>
        <span className="ml-auto text-sm text-[#43524E]">{COMPANY.name}</span>
      </nav>

      <main className="relative mx-auto grid max-w-[1180px] gap-6 px-4 pt-28 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <div className="px-1 pt-4">
            <h1 className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.035em]">
              Seven matches. None of them read your problem.
            </h1>
            <p className="mt-3 max-w-[54ch] text-lg text-[#43524E]">
              Sellers got a plain summary. The specifics below stayed with {COMPANY.name}.
            </p>
          </div>

          {/* Content: solid, no glass */}
          {PROBLEMS.map((p) => (
            <section key={p.id} className="rounded-[28px] bg-white/95 p-6 shadow-[0_1px_2px_rgba(20,32,29,0.06),0_12px_32px_-20px_rgba(20,32,29,0.3)] md:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold tracking-tight">{p.title}</h2>
                <span className="text-sm text-[#6A7874]">{p.matches} matches</span>
              </div>
              <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed text-[#2E3B38]">
                {p.parts.map((part, k) =>
                  typeof part === 'string' ? part : (
                    <span key={k} className="rounded-[5px] bg-[#1F5C54]/10 px-1 text-[#1F5C54]">{part.sealed}</span>
                  ),
                )}
              </p>
              <ul className="mt-5 divide-y divide-[#E6ECEA]">
                {MATCHES.filter((m) => m.problemId === p.id).map((m) => (
                  <li key={m.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-4 py-4">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F1F5F4] text-sm font-semibold tabular-nums">{m.score}</span>
                    <div>
                      <p className="font-semibold">{m.seller}</p>
                      <p className="mt-0.5 max-w-[58ch] text-[15px] text-[#56645F]">{m.reasoning}</p>
                    </div>
                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${m.stage === 'meeting' ? 'bg-[#1F5C54] text-white' : 'bg-[#F1F5F4] text-[#43524E]'}`}>
                      {STAGE_LABEL[m.stage]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] bg-white/95 p-6 shadow-[0_12px_32px_-20px_rgba(20,32,29,0.3)]">
              <h2 className="text-lg font-semibold">Agents with {LIVE_NEGOTIATION.with}</h2>
              <p className="text-sm text-[#6A7874]">Turn {LIVE_NEGOTIATION.turn} of {LIVE_NEGOTIATION.of}</p>
              <div className="mt-4 space-y-2.5">
                {LIVE_NEGOTIATION.lines.map((l, i) => (
                  <p key={i} className={`rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${l.speaker === 'buyer_agent' ? 'mr-8 bg-[#1F5C54] text-white' : 'ml-8 bg-[#F1F5F4]'}`}>{l.text}</p>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] bg-white/95 p-6 shadow-[0_12px_32px_-20px_rgba(20,32,29,0.3)]">
              <h2 className="text-lg font-semibold">Buyers asking for you</h2>
              <ul className="mt-4 space-y-4">
                {INCOMING.map((m) => (
                  <li key={m.id}>
                    <p className="font-medium">{m.buyer_industry}, {m.buyer_size_hint}</p>
                    <p className="mt-0.5 text-[15px] text-[#56645F]">{m.reasoning_public}</p>
                    <p className={`mt-1 text-sm font-medium ${m.budget_compatible ? 'text-[#1F5C54]' : 'text-[#A2402F]'}`}>
                      {m.budget_compatible ? 'Budget fits your floor' : 'Budget below your floor'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Thick-tier glass sheet: floats, stays reachable while content scrolls under it. */}
        <aside className="lab-glass-thick h-max rounded-[28px] p-6 shadow-[0_24px_60px_-24px_rgba(20,32,29,0.35)] lg:sticky lg:top-24">
          <p className="text-sm font-medium" style={{ color: TEAL }}>{MEETING.when}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{MEETING.with}</h2>
          <p className="text-[#43524E]">{MEETING.person}</p>
          {/* Inside glass: separate with fills, never a second blur layer. */}
          <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-white/60 p-3"><dt className="text-[#6A7874]">Format</dt><dd className="font-semibold">{FORMAT_LABEL[ENVELOPE.agreed_format!]}</dd></div>
            <div className="rounded-2xl bg-white/60 p-3"><dt className="text-[#6A7874]">Confidence</dt><dd className="font-semibold">{ENVELOPE.confidence} / 100</dd></div>
            <div className="col-span-2 rounded-2xl bg-white/60 p-3"><dt className="text-[#6A7874]">Budget</dt><dd className="font-semibold">Compatible. Amounts never shared.</dd></div>
          </dl>
          <p className="mt-5 text-sm font-medium">Left for the two of you</p>
          <ul className="mt-2 space-y-1.5 text-[15px] text-[#2E3B38]">
            {ENVELOPE.open_questions.map((q) => <li key={q}>{q}</li>)}
          </ul>
          <button className="mt-6 h-12 w-full rounded-2xl font-semibold text-white transition-transform duration-150 active:scale-[0.97]" style={{ background: TEAL }}>
            Open the brief
          </button>
          <div className="mt-6 space-y-1.5 border-t border-white/70 pt-4 text-sm text-[#43524E]">
            {ACTIVITY.slice(0, 3).map((a) => <p key={a.text}><span className="font-medium text-[#14201D]">{a.when}</span> {a.text}</p>)}
          </div>
        </aside>
      </main>

      {/* Regular-tier glass action dock */}
      <div className="lab-glass-regular fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full p-1.5 shadow-[0_12px_40px_-12px_rgba(20,32,29,0.35)]">
        <button className="h-11 rounded-full px-5 text-sm font-semibold text-white active:scale-[0.97]" style={{ background: TEAL }}>New problem</button>
        <button className="h-11 rounded-full px-5 text-sm font-medium hover:bg-white/50">Review 1 match</button>
      </div>
    </div>
  );
}
