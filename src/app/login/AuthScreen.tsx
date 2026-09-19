import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { premiumFont, script } from "../fonts";
import { MatchDiagram } from "./MatchDiagram";

const BROKEN = "what’s broken.";

/** One span per letter, so the "rw" loop in globals.css can type them in one at a time. */
function Typed({ text, className }: { text: string; className: string }) {
  return (
    <span className={className} aria-hidden>
      {[...text].map((ch, i) => (
        <span key={i} className="rw-char" style={{ ["--c" as string]: i }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/** A plain block eraser; its shape and motion are in globals.css. */
function Eraser() {
  return (
    <span className="rw-eraser" aria-hidden>
      <span className="rw-hand">
        <span>
          <span />
        </span>
      </span>
    </span>
  );
}

/** Shared by /login and /signup: the promise on the left, the form on the right. */
export function AuthScreen({ mode, error }: { mode: "login" | "signup"; error?: string }) {
  return (
    <div className={`${premiumFont} ${script.variable} flex min-h-dvh flex-col bg-bg text-ink`}>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-start gap-14 px-4 pb-16 pt-6 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <section className="soft-in max-w-[560px]">
          <h2 className="text-[clamp(2.4rem,5vw,4.2rem)] font-extrabold leading-[1.02] tracking-[-0.045em]">
            Say{" "}
            <span className="rw">
              <span className="sr-only">what&rsquo;s broken.</span>
              <Typed className="rw-layer" text={BROKEN} />
              <Typed className="rw-layer rw-italic" text={BROKEN} />
              <Eraser />
            </span>{" "}
            Only the right company hears about it.
          </h2>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-soft">
            Write down a real problem. Two AI agents check the fit and settle terms before anyone
            meets. Nobody reads your words.
          </p>
          <MatchDiagram />
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
