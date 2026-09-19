"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PillButton } from "@/components/premium";
import { Icon } from "@/components/ui";

/**
 * The first thing a seller sees: one question, one box — the mirror of the buyer's hero. Real
 * services type themselves into the placeholder so the box says what it wants without a
 * paragraph of instructions.
 *
 * The line above the box is the one thing that differs from the buyer's screen, and it differs
 * on purpose: a problem is private, a service is what you want read.
 */
const EXAMPLES = [
  "We run an outsourced call centre: twelve agents, Estonian and English, inbound and outbound.",
  "We install fibre to business premises and support it for two years afterwards.",
  "We take over month-end close for companies that have outgrown their bookkeeper.",
  "We put certified engineers on site, scheduled or on call.",
  "We migrate legacy PBX systems to cloud telephony without downtime.",
];

export function Hero({ onStart, form }: { onStart: (text: string) => void; form: React.ReactNode }) {
  const [text, setText] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  const typed = useTypedExample(text.length === 0);

  // The box grows with the answer instead of scrolling inside itself.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [text]);

  const ready = text.trim().length >= 12;
  const start = () => ready && onStart(text.trim());

  return (
    <main className="relative bg-bg">
      <Aurora />
      <div className="relative flex min-h-dvh flex-col">
        <header className="relative z-10 flex items-center gap-2 px-5 py-5 md:px-9">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-ink">
            <Icon name="chevron-left" size={15} />
            Services
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-[880px] flex-1 flex-col justify-center px-5 pb-16 md:px-8">
          <span className="soft-in inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-[12px] font-medium text-ink-soft backdrop-blur">
            <Icon name="handshake" size={12} />
            Shown to buyers. Your figures are not
          </span>

          <h1 className="soft-in mt-5 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[64px]" style={{ "--i": 1 } as React.CSSProperties}>
            Describe what you ship
          </h1>
          <p className="soft-in mt-3 max-w-[54ch] text-[15px] leading-relaxed text-ink-soft md:text-[16.5px]" style={{ "--i": 2 } as React.CSSProperties}>
            One service at a time. Say what it is. The rest is a few questions.
          </p>

          <div
            className="soft-in mt-8 rounded-[24px] border border-line bg-surface/85 p-4 shadow-[0_24px_60px_-32px_rgba(23,47,69,0.35)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300 focus-within:border-accent/45 focus-within:shadow-[0_28px_70px_-30px_rgba(47,109,82,0.4)] md:p-5"
            style={{ "--i": 3, viewTransitionName: "interview" } as React.CSSProperties}
          >
            <div className="flex items-end gap-3">
              <div className="relative min-w-0 flex-1">
                {text.length === 0 && (
                  <p aria-hidden className="pointer-events-none absolute inset-0 select-none text-[17px] leading-relaxed text-ink-faint md:text-[19px]">
                    {typed}
                    <span className="caret ml-[1px] inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-ink-faint align-middle" />
                  </p>
                )}
                <textarea
                  ref={box}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      start();
                    }
                  }}
                  rows={3}
                  aria-label="Your service"
                  className="relative w-full resize-none bg-transparent text-[17px] leading-relaxed text-ink outline-none md:text-[19px]"
                />
              </div>
              <PillButton onClick={start} disabled={!ready}>
                Start
              </PillButton>
            </div>
          </div>
        </div>

        <a href="#form" className="relative z-10 mx-auto mb-8 flex flex-col items-center gap-1.5 text-[12.5px] text-ink-soft transition-colors hover:text-ink">
          Or fill it in yourself
          <span aria-hidden className="nudge grid h-8 w-8 place-items-center rounded-full border border-line bg-surface/70 backdrop-blur">
            <Icon name="chevron-left" size={16} className="-rotate-90" />
          </span>
        </a>
      </div>

      <section id="form" className="mx-auto w-full max-w-[1180px] scroll-mt-8 px-5 pb-20 md:px-9">
        {form}
      </section>
    </main>
  );
}

/** The ground, moving. Two soft fields of the product's own accent and seal, nothing else. */
function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="aurora absolute -left-[20%] -top-[30%] h-[80vh] w-[80vw] rounded-full opacity-70 blur-[110px]"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 26%, transparent), transparent 68%)" }}
      />
      <div
        className="aurora absolute -right-[15%] top-[10%] h-[70vh] w-[70vw] rounded-full opacity-60 blur-[120px]"
        style={{
          animationDelay: "-9s",
          background: "radial-gradient(circle, color-mix(in oklab, var(--seal) 22%, transparent), transparent 68%)",
        }}
      />
      <div
        className="aurora absolute bottom-[-25%] left-[20%] h-[70vh] w-[75vw] rounded-full opacity-50 blur-[130px]"
        style={{
          animationDelay: "-17s",
          background: "radial-gradient(circle, color-mix(in oklab, var(--ink) 16%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}

/** One example types itself, holds, deletes, and the next one follows. Off when motion is reduced. */
function useTypedExample(on: boolean) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!on) return;
    let i = 0;
    let cut = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = () => {
      const full = EXAMPLES[i];
      if (still) return setShown(full);
      cut += deleting ? -1 : 1;
      setShown(full.slice(0, cut));
      let wait = deleting ? 16 : 32;
      if (!deleting && cut === full.length) {
        deleting = true;
        wait = 2200;
      } else if (deleting && cut === 0) {
        deleting = false;
        i = (i + 1) % EXAMPLES.length;
        wait = 340;
      }
      timer = setTimeout(step, wait);
    };
    timer = setTimeout(step, 600);
    return () => clearTimeout(timer);
  }, [on]);

  return shown;
}
