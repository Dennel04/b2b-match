import { AuthForm } from "@/components/AuthForm";

import {  } from "../fonts";

/** Shared by /login and /signup: the promise on the left, the form on the right. */
export function AuthScreen({ mode, error }: { mode: "login" | "signup"; error?: string }) {
  return (
    <div className={`flex min-h-dvh flex-col bg-bg text-ink`}>
      
      <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-14 px-4 pb-16 pt-6 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <section className="soft-in max-w-[560px]">
          <span className="text-[12px] font-medium text-ink-soft">Private by design</span>
          <h2 className="mt-6 text-[clamp(2.4rem,5vw,4.2rem)] font-extrabold leading-[1.02] tracking-[-0.045em]">
            Say what&rsquo;s broken. Only the right company hears about it.
          </h2>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-soft">
            Write down a real problem. Two AI agents check the fit and settle terms before anyone
            meets. Nobody reads your words.
          </p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["No cold outreach", "Vendors never see a list of buyers."],
              ["Budgets stay private", "We compare them and say only that they fit."],
              ["You decide", "Names are shared only when both sides agree."],
            ].map(([title, text], i) => (
              <li key={title} className="soft-in rounded-3xl bg-surface/70 p-4 ring-1 ring-ink/[0.05]" style={{ ["--i" as string]: i + 2 }}>
                <p className="text-[14px] font-semibold">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="soft-in order-first flex justify-center lg:order-none lg:justify-end" style={{ ["--i" as string]: 1 }}>
          <AuthForm initialMode={mode} initialError={error ? `Sign-in failed: ${error}` : undefined} />
        </div>
      </main>
    </div>
  );
}
