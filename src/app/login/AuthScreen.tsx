import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { premiumFont, script } from "../fonts";
import { Headline } from "./Headline";
import { MatchDiagram } from "./MatchDiagram";

/**
 * Shared by /login, /signup and the password screens: the promise on the left, a form on the
 * right. `children` takes the log-in form's place, so every signed-out form sits in one spot.
 */
export function AuthScreen({
  mode = "login",
  error,
  children,
}: {
  mode?: "login" | "signup";
  error?: string;
  children?: React.ReactNode;
}) {
  // One screen on desktop: nothing to scroll to. Phones stack the form above the promise and scroll.
  return (
    <div className={`${premiumFont} ${script.variable} flex min-h-dvh flex-col bg-bg text-ink lg:h-dvh lg:overflow-hidden`}>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-start gap-14 px-4 pb-8 pt-6 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <section className="soft-in max-w-[560px]">
          <Headline />
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-soft">
            Write down a real problem. Two AI agents check the fit and settle terms before anyone
            meets. Nobody reads your words.
          </p>
          <MatchDiagram />
        </section>

        <div className="soft-in order-first flex justify-center lg:order-none lg:justify-end" style={{ ["--i" as string]: 1 }}>
          {children ?? <AuthForm initialMode={mode} initialError={error ? `Login failed: ${error}` : undefined} />}
        </div>
      </main>
    </div>
  );
}
