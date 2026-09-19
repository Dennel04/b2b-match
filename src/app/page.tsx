import { Bezel, Eyebrow, PillLink } from "@/components/premium";
import { SiteHeader } from "@/components/SiteHeader";
import { script } from "./fonts";
import { Headline } from "./login/Headline";
import { Negotiation } from "./Negotiation";

export const metadata = { title: "Crossdesk — say what's broken, privately" };

/**
 * What Crossdesk does, on one screen and a scroll: the promise and a live negotiation, the three
 * beats from docs/JUDGING.md, the two sides, and the closing line. Signed-in visitors never see
 * it — the proxy sends them to /dashboard. Signed-out density (`premium`), like /login.
 */
export default function Landing() {
  return (
    <div className={`${script.variable} flex min-h-dvh flex-col bg-bg text-ink`}>
      <SiteHeader>
        <PillLink href="/login" variant="soft" icon={false}>
          Log in
        </PillLink>
        <PillLink href="/signup" className="max-sm:hidden">
          Get started
        </PillLink>
      </SiteHeader>

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-24 px-4 pb-16 pt-6 md:gap-32 md:px-8">
        {/* The promise, and the product doing it. */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="soft-in max-w-[560px]">
            <Headline as="h1" />
            <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-soft">
              Write down a real problem. Two AI agents check the fit and settle terms before anyone
              meets. Nobody reads your words.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PillLink href="/signup">Get started</PillLink>
              <PillLink href="/login" variant="soft" icon={false}>
                Log in
              </PillLink>
            </div>
          </div>
          <div className="soft-in" style={{ ["--i" as string]: 2 }}>
            <Bezel>
              <Negotiation />
            </Bezel>
          </div>
        </section>

        {/* The three beats. */}
        <section aria-labelledby="how" className="flex flex-col gap-10">
          <div className="reveal max-w-[640px]">
            <Eyebrow>How it works</Eyebrow>
            <h2 id="how" className="mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.035em]">
              People meet only after the terms fit.
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            <Step n="01" title="Describe your problem" visual={<PrivateVisual />}>
              A short interview turns what hurts into a problem and its terms: budget ceiling, start
              date, contract format. Nobody but the platform reads it.
            </Step>
            <Step n="02" title="Two agents negotiate" visual={<FilterVisual />}>
              Vendors who miss on money, timing or format are filtered out first. Your agent talks
              to the rest. The vendor&rsquo;s agent never receives your problem.
            </Step>
            <Step n="03" title="Meet with a brief" visual={<StatusVisual />}>
              You say Interested, the vendor accepts. Names are shared once both agree, with a brief:
              what the agents settled, what is left, three opening questions.
            </Step>
          </ol>
        </section>

        {/* Two sides, one shape — the same words the sidebar uses. */}
        <section aria-labelledby="sides" className="flex flex-col gap-10">
          <div className="reveal max-w-[640px]">
            <Eyebrow>Both sides</Eyebrow>
            <h2 id="sides" className="mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.035em]">
              Buy with a problem. Sell with a service.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Side
              label="Problems"
              title="Describe your problem"
              rows={[
                ["What hurts", "Private"],
                ["Budget ceiling", "Private"],
                ["Start date", "Private"],
              ]}
            >
              What is not working, what you would pay, when it must start. Private in full.
            </Side>
            <Side
              label="Services"
              title="Describe what you ship"
              rows={[
                ["What you sell", "Public"],
                ["Who it is for", "Public"],
                ["Price floor", "Private"],
              ]}
            >
              Each service is matched on its own terms. The storefront is public; your figures are
              not. A buyer is told that they fit, never what they are.
            </Side>
          </div>
        </section>

        {/* The closing line from the pitch. */}
        <section className="reveal flex flex-col items-center gap-8 py-8 text-center">
          <p className="max-w-[20ch] text-[clamp(2rem,4.4vw,3.4rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
            We don&rsquo;t show the numbers.{" "}
            <span className="font-[family-name:var(--font-script)] font-normal italic tracking-[-0.02em]">
              We show that they match.
            </span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <PillLink href="/signup">Get started</PillLink>
            <PillLink href="/login" variant="soft" icon={false}>
              Log in
            </PillLink>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-[1200px] px-4 pb-6 text-[12px] text-ink-faint md:px-8">
        © 2026 Crossdesk
      </footer>
    </div>
  );
}

function Step({ n, title, visual, children }: { n: string; title: string; visual: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="reveal">
      <Bezel className="h-full" inner="flex flex-col gap-5 p-6">
        <div className="grid h-28 place-items-center rounded-2xl bg-surface-alt">{visual}</div>
        <div>
          <p className="text-[12px] font-semibold tabular-nums text-ink-faint">{n}</p>
          <h3 className="mt-1 text-[18px] font-bold tracking-[-0.02em]">{title}</h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{children}</p>
        </div>
      </Bezel>
    </li>
  );
}

/** A written problem with its lines blacked out: nobody reads your words. */
function PrivateVisual() {
  return (
    <div aria-hidden className="w-[62%] rounded-xl bg-surface p-3 shadow-[0_8px_20px_-12px_rgba(23,47,69,0.3)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ink-soft">Your problem</span>
        <span className="rounded-[7px] bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">Private</span>
      </div>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {["w-[88%]", "w-[70%]", "w-[80%]"].map((w, i) => (
          <span key={w} className={`land-redact h-1.5 rounded-full bg-ink ${w}`} style={{ ["--n" as string]: i }} />
        ))}
      </div>
    </div>
  );
}

/** Vendors checked on terms: most fall away, one is left to talk to. */
function FilterVisual() {
  return (
    <div aria-hidden className="flex items-center gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`land-filter grid h-9 w-9 place-items-center rounded-full bg-surface ring-1 ring-line ${i === 2 ? "land-keep" : ""}`}
          style={{ ["--n" as string]: i }}
        >
          <span className="h-2 w-2 rounded-full bg-ink" />
        </span>
      ))}
    </div>
  );
}

/** The double opt-in in the product's own status names. */
function StatusVisual() {
  return (
    <div aria-hidden className="flex flex-col items-center gap-1.5">
      {["New match", "Interest sent", "Meeting confirmed"].map((s, i) => (
        <span
          key={s}
          className={`land-status rounded-[7px] px-2.5 py-1 text-[11.5px] font-semibold ${
            i === 2 ? "bg-accent-soft text-accent" : "bg-surface text-ink-soft ring-1 ring-line"
          }`}
          style={{ ["--n" as string]: i }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function Side({ label, title, rows, children }: { label: string; title: string; rows: [string, string][]; children: React.ReactNode }) {
  return (
    <div className="reveal">
      <Bezel className="h-full" inner="flex flex-col gap-5 p-6 sm:p-8">
        <div>
          <p className="text-[12px] font-semibold text-ink-faint">{label}</p>
          <h3 className="mt-1 text-[22px] font-bold tracking-[-0.025em]">{title}</h3>
          <p className="mt-2 max-w-[48ch] text-[14.5px] leading-relaxed text-ink-soft">{children}</p>
        </div>
        <ul className="flex flex-col divide-y divide-line rounded-2xl bg-surface-alt px-4">
          {rows.map(([name, who]) => (
            <li key={name} className="flex items-center justify-between py-3 text-[14px]">
              <span className="font-medium">{name}</span>
              <span className={`text-[12.5px] font-semibold ${who === "Private" ? "text-ink" : "text-ink-faint"}`}>{who}</span>
            </li>
          ))}
        </ul>
      </Bezel>
    </div>
  );
}
