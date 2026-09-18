import { Inter } from 'next/font/google';
import {
  ACTIVITY, COMPANY, ENVELOPE, FORMAT_LABEL, INCOMING, LIVE_NEGOTIATION, MATCHES, MEETING,
  PROBLEMS, STAGE_LABEL,
} from '../_data';

/**
 * Variant J, skill: apple-design (s1gmamale1/apple-design-skills), utility surface.
 * Restraint pass applied: light by default, one accent (#0071E3), type + space carry hierarchy,
 * glass only on chrome (sidebar and toolbar), content in solid inset-grouped lists like
 * iOS Settings, 44px targets, motion near-invisible (press feedback only), no bento, no glow.
 * Type: system stack first (SF on Apple devices), Inter as the fallback elsewhere.
 */

const inter = Inter({ subsets: ['latin'], variable: '--j-inter' });

export const metadata = { title: 'J · apple-design — Lab' };

const BLUE = '#0071E3';

function Chevron() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden className="shrink-0">
      <path d="m1 1 6 6-6 6" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Group({ title, footer, children }: { title?: string; footer?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      {title && <h2 className="mb-2 px-4 text-[13px] text-[#6E6E73]">{title}</h2>}
      <div className="overflow-hidden rounded-xl bg-white">{children}</div>
      {footer && <p className="mt-2 px-4 text-[13px] leading-snug text-[#6E6E73]">{footer}</p>}
    </section>
  );
}

function Row({ children, chevron = true }: { children: React.ReactNode; chevron?: boolean }) {
  return (
    <div className="relative flex min-h-[44px] items-center gap-3 px-4 py-2.5 transition-colors duration-150 after:absolute after:bottom-0 after:left-4 after:right-0 after:h-px after:bg-[#E5E5EA] last:after:hidden hover:bg-[#F7F7F9] active:bg-[#EDEDF0]">
      {children}
      {chevron && <Chevron />}
    </div>
  );
}

export default function VariantJ() {
  return (
    <div
      className={`${inter.variable} flex min-h-dvh bg-[#F5F5F7] pb-28 text-[15px] tracking-[-0.01em] text-[#1D1D1F] antialiased`}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", var(--j-inter), sans-serif' }}
    >
      {/* Chrome: translucent sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-black/[0.06] bg-[#F5F5F7]/70 p-3 backdrop-blur-2xl md:block">
        <p className="px-3 pb-4 pt-3 text-[13px] font-semibold text-[#6E6E73]">{COMPANY.name}</p>
        {['Overview', 'Problems', 'Matches', 'Meetings', 'Supplier inbox'].map((l, i) => (
          <a
            key={l}
            href="#"
            className={`flex h-9 items-center rounded-lg px-3 text-[14px] ${i === 0 ? 'bg-black/[0.06] font-medium' : 'text-[#3A3A3C] hover:bg-black/[0.04]'}`}
          >
            {l}
          </a>
        ))}
      </aside>

      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 flex h-12 items-center justify-end border-b border-black/[0.06] bg-[#F5F5F7]/75 px-5 backdrop-blur-2xl">
          <button className="h-8 rounded-full px-4 text-[14px] font-medium text-white active:opacity-80" style={{ background: BLUE }}>
            New Problem
          </button>
        </div>

        <div className="mx-auto max-w-[720px] px-5 pt-8">
          <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em]">Overview</h1>
          <p className="mt-1 text-[17px] text-[#6E6E73]">Tuesday you meet {MEETING.with}.</p>

          {/* The one moment of emphasis: the meeting, set in type, not in a box of effects. */}
          <section className="mt-8 rounded-2xl bg-white p-6">
            <p className="text-[13px] font-semibold uppercase tracking-[0.02em]" style={{ color: BLUE }}>Meeting</p>
            <p className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em]">{MEETING.with}</p>
            <p className="text-[17px] text-[#6E6E73]">{MEETING.when}. {MEETING.where}.</p>
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-[#E5E5EA] pt-5">
              <div><p className="text-[13px] text-[#6E6E73]">Format</p><p className="mt-0.5 font-medium">{FORMAT_LABEL[ENVELOPE.agreed_format!]}</p></div>
              <div><p className="text-[13px] text-[#6E6E73]">Budget</p><p className="mt-0.5 font-medium">Compatible</p></div>
              <div><p className="text-[13px] text-[#6E6E73]">Confidence</p><p className="mt-0.5 font-medium">{ENVELOPE.confidence}%</p></div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="h-11 rounded-full px-6 text-[15px] font-medium text-white active:opacity-80" style={{ background: BLUE }}>Read Brief</button>
              <button className="h-11 rounded-full bg-[#F5F5F7] px-6 text-[15px] font-medium active:bg-[#EDEDF0]" style={{ color: BLUE }}>Add to Calendar</button>
            </div>
          </section>

          <Group title="MATCHES" footer="Sellers see a plain summary of your problem. Budgets are compared privately; only compatibility is shown.">
            {MATCHES.map((m) => (
              <Row key={m.id}>
                <span className="w-8 text-[15px] font-semibold tabular-nums">{m.score}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{m.seller}</span>
                  <span className="block truncate text-[13px] text-[#6E6E73]">{m.reasoning}</span>
                </span>
                <span className={`hidden whitespace-nowrap text-[15px] sm:block ${m.stage === 'ready' ? 'font-medium' : 'text-[#6E6E73]'}`} style={m.stage === 'ready' ? { color: BLUE } : undefined}>
                  {STAGE_LABEL[m.stage]}
                </span>
              </Row>
            ))}
          </Group>

          <Group title={`AGENTS WITH ${LIVE_NEGOTIATION.with.toUpperCase()}`} footer={`Turn ${LIVE_NEGOTIATION.turn} of ${LIVE_NEGOTIATION.of}. You get the outcome, not every message.`}>
            <div className="space-y-2 p-4">
              {LIVE_NEGOTIATION.lines.map((l, i) => (
                <div key={i} className={`flex ${l.speaker === 'buyer_agent' ? 'justify-end' : ''}`}>
                  <p
                    className={`max-w-[80%] rounded-[18px] px-3.5 py-2 text-[15px] leading-snug ${l.speaker === 'buyer_agent' ? 'text-white' : 'bg-[#E9E9EB]'}`}
                    style={l.speaker === 'buyer_agent' ? { background: BLUE } : undefined}
                  >
                    {l.text}
                  </p>
                </div>
              ))}
            </div>
          </Group>

          <Group title="YOUR PROBLEMS" footer="Only you can read these.">
            {PROBLEMS.map((p) => (
              <Row key={p.id}>
                <span className="flex-1">{p.title}</span>
                <span className="text-[#6E6E73]">{p.matches}</span>
              </Row>
            ))}
          </Group>

          <Group title="BUYERS ASKING FOR YOU" footer="Buyers stay anonymous until you both agree to meet.">
            {INCOMING.map((m) => (
              <Row key={m.id}>
                <span className="min-w-0 flex-1">
                  <span className="block">{m.buyer_industry}</span>
                  <span className="block text-[13px] text-[#6E6E73]">{m.buyer_size_hint}. {m.budget_compatible ? 'Budget fits.' : 'Below your floor.'}</span>
                </span>
                <span className="text-[#6E6E73] tabular-nums">{m.score}</span>
              </Row>
            ))}
          </Group>

          <Group title="RECENT">
            {ACTIVITY.map((a) => (
              <Row key={a.text} chevron={false}>
                <span className="flex-1">{a.text}</span>
                <span className="text-[#6E6E73]">{a.when}</span>
              </Row>
            ))}
          </Group>
        </div>
      </main>
    </div>
  );
}
