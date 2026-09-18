'use client';

import { useEffect, useRef, useState } from 'react';
import {
  COMPANY, ENVELOPE, FORMAT_LABEL, INCOMING, LIVE_NEGOTIATION, MATCHES, MEETING, PROBLEMS,
  STAGE_LABEL, problemTitle,
} from '../_data';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const HOLD_MS = 1600;

function Button({
  children, onClick, dark = false, className = '',
}: { children: React.ReactNode; onClick?: () => void; dark?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-10 rounded-xl px-4 text-sm font-medium active:scale-[0.97] ${
        dark ? 'bg-[#171717] text-white hover:bg-[#2E2E2E]' : 'bg-white text-[#171717] shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#F5F5F5]'
      } ${className}`}
      style={{ transition: `transform 160ms ${EASE_OUT}, background-color 150ms ease` }}
    >
      {children}
    </button>
  );
}

/** Hold to confirm: the fill tracks the press, release early and it snaps back. */
function HoldToConfirm({ onDone, done }: { onDone: () => void; done: boolean }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => {
    if (done) return;
    timer.current = setTimeout(onDone, HOLD_MS);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  if (done) {
    return (
      <div className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8F5EC] text-sm font-medium text-[#1A6B3A]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M5 12.5 10 17l9-10" /></svg>
        Meeting confirmed
      </div>
    );
  }
  return (
    <button
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onDone(); }}
      className="lab-hold relative h-11 w-full select-none overflow-hidden rounded-xl bg-[#F0F0F0] text-sm font-medium active:scale-[0.97]"
      style={{ transition: `transform 160ms ${EASE_OUT}` }}
    >
      <span className="relative z-0">Hold to confirm the meeting</span>
      <span aria-hidden className="lab-hold-fill absolute inset-0 z-10 grid place-items-center bg-[#171717] text-white" style={{ transitionDuration: undefined }}>
        Hold to confirm the meeting
      </span>
    </button>
  );
}

export function View() {
  const [tab, setTab] = useState<'buyer' | 'supplier'>('buyer');
  const [open, setOpen] = useState<string | null>('m7');
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const say = (msg: string) => {
    setToast(msg);
    setToastVisible(true);
  };
  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 2600);
    return () => clearTimeout(t);
  }, [toastVisible, toast]);

  return (
    <>
      <header className="mx-auto flex max-w-[1080px] items-center justify-between px-5 py-6">
        <span className="font-semibold tracking-tight">B2B Match</span>
        <span className="text-sm text-[#737373]">{COMPANY.name}</span>
      </header>

      <main className="mx-auto max-w-[1080px] px-5">
        <div className="lab-rise pt-10" style={{ animationDuration: '400ms' }}>
          <h1 className="max-w-[20ch] text-4xl font-semibold leading-[1.1] tracking-[-0.035em] md:text-5xl">
            Good morning, {COMPANY.person}.
          </h1>
          <p className="mt-3 max-w-[56ch] text-[17px] text-[#737373]">
            One meeting waits for your confirmation. Agents are still talking to {LIVE_NEGOTIATION.with}.
          </p>
        </div>

        {/* Segmented tabs: indicator slides, content swaps instantly. */}
        <div role="tablist" className="relative mt-10 inline-grid grid-cols-2 rounded-xl bg-[#EDEDED] p-1 text-sm font-medium">
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]"
            style={{ transform: tab === 'buyer' ? 'translateX(0)' : 'translateX(100%)', transition: `transform 200ms ${EASE_OUT}` }}
          />
          {(['buyer', 'supplier'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`relative z-10 h-9 px-5 ${tab === t ? 'text-[#171717]' : 'text-[#737373]'}`}
              style={{ transition: 'color 150ms ease' }}
            >
              {t === 'buyer' ? 'Buying' : 'Supplying'}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="min-w-0">
            {tab === 'buyer' ? (
              <ul className="overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
                {MATCHES.map((m, i) => {
                  const isOpen = open === m.id;
                  return (
                    <li key={m.id} className="lab-rise border-b border-[#F0F0F0] last:border-0" style={{ animationDelay: `${i * 50}ms`, animationDuration: '300ms' }}>
                      <button
                        onClick={() => setOpen(isOpen ? null : m.id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#FAFAFA]"
                        style={{ transition: 'background-color 150ms ease' }}
                      >
                        <span className="w-9 font-[family-name:var(--h-mono)] text-sm tabular-nums text-[#737373]">{m.score}</span>
                        <span className="flex-1">
                          <span className="block font-medium">{m.seller}</span>
                          <span className="block text-sm text-[#737373]">{problemTitle(m.problemId)}</span>
                        </span>
                        <span className="hidden text-sm text-[#737373] sm:block">{STAGE_LABEL[m.stage]}</span>
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" aria-hidden
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: `transform 200ms ${EASE_OUT}` }}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      <div className="lab-expand" data-open={isOpen}>
                        <div>
                          <div className="px-5 pb-5 pl-[4.25rem]">
                            <p className="max-w-[58ch] text-[15px] leading-relaxed text-[#404040]">{m.reasoning}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className={`rounded-md px-2 py-1 ${m.compatibility.budget === 'ok' ? 'bg-[#E8F5EC] text-[#1A6B3A]' : 'bg-[#FDECEC] text-[#A12B2B]'}`}>
                                Budget {m.compatibility.budget === 'ok' ? 'compatible' : 'gap'}
                              </span>
                              {m.compatibility.contract_formats.map((f) => (
                                <span key={f} className="rounded-md bg-[#F2F2F2] px-2 py-1 text-[#525252]">{FORMAT_LABEL[f]}</span>
                              ))}
                            </div>
                            {m.stage === 'ready' && (
                              <Button dark className="mt-4" onClick={() => say(`Agents started with ${m.seller}`)}>Start agents</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-3">
                {INCOMING.map((m) => (
                  <li key={m.id} className="rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-medium">A {m.buyer_industry.toLowerCase()} company, {m.buyer_size_hint}</p>
                      <span className="font-[family-name:var(--h-mono)] text-sm text-[#737373]">{m.score}</span>
                    </div>
                    <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-[#404040]">{m.reasoning_public}</p>
                    <div className="mt-4 flex gap-2">
                      <Button dark onClick={() => say('Interest sent. They stay anonymous until they agree.')}>Show interest</Button>
                      <Button onClick={() => say('Match declined')}>Decline</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <p className="font-medium">Agents with {LIVE_NEGOTIATION.with}</p>
                <span className="font-[family-name:var(--h-mono)] text-xs text-[#737373]">turn {LIVE_NEGOTIATION.turn}/{LIVE_NEGOTIATION.of}</span>
              </div>
              <div className="mt-4 space-y-3">
                {LIVE_NEGOTIATION.lines.map((l, i) => (
                  <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${l.speaker === 'buyer_agent' ? 'bg-[#171717] text-white' : 'ml-auto bg-[#F2F2F2]'}`}>
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
              <p className="text-sm text-[#737373]">{MEETING.when}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">{MEETING.with}</p>
              <p className="text-sm text-[#737373]">{MEETING.person}</p>
              <dl className="mt-4 space-y-2 border-t border-[#F0F0F0] pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-[#737373]">Format</dt><dd>{FORMAT_LABEL[ENVELOPE.agreed_format!]}</dd></div>
                <div className="flex justify-between"><dt className="text-[#737373]">Budget</dt><dd>Compatible</dd></div>
                <div className="flex justify-between"><dt className="text-[#737373]">Confidence</dt><dd className="font-[family-name:var(--h-mono)]">{ENVELOPE.confidence}</dd></div>
              </dl>
              <div className="mt-5">
                <HoldToConfirm done={confirmed} onDone={() => { setConfirmed(true); say('Meeting confirmed. The brief is on its way.'); }} />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
              <p className="font-medium">Your problems</p>
              <ul className="mt-3 space-y-3">
                {PROBLEMS.map((p) => (
                  <li key={p.id} className="text-sm">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-[#737373]">{p.matches} matches, {p.sealed} details kept private</p>
                  </li>
                ))}
              </ul>
              <Button className="mt-4 w-full">Describe a problem</Button>
            </div>
          </aside>
        </div>
      </main>

      {/* Toast: enters and exits from the same edge. */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-20 right-5 z-50 rounded-xl bg-[#171717] px-4 py-3 text-sm text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
        style={{
          transform: toastVisible ? 'translateY(0)' : 'translateY(calc(100% + 100px))',
          opacity: toastVisible ? 1 : 0,
          transition: `transform 400ms cubic-bezier(0.32, 0.72, 0, 1), opacity 400ms cubic-bezier(0.32, 0.72, 0, 1)`,
        }}
      >
        {toast}
      </div>
    </>
  );
}
