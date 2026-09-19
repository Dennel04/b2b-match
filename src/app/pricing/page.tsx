import Link from "next/link";
import { Card, Icon } from "@/components/ui";

export const metadata = { title: "Pricing — Crossdesk" };

/**
 * What a vendor pays, and the one moment it is charged. The page exists because the price is
 * the argument: every other platform in this market sells access to a buyer — a lead, a seat, a
 * subscription — and is therefore paid whether or not the introduction was worth making. Paying
 * only for an accepted meeting is the single arrangement where spamming a buyer earns a vendor
 * nothing (docs/RESEARCH.md §4.4).
 *
 * The button opens a real Stripe Checkout session in test mode. What it does not yet do is
 * recorded in STRIPE_INTEGRATION_TODO.md.
 */
export default function PricingPage() {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-5 py-14 md:py-20">
      <header className="flex flex-col gap-3">
        <Link href="/" className="text-[13px] text-ink-soft transition-colors hover:text-ink">
          ← Crossdesk
        </Link>
        <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
          You pay when a meeting is accepted
        </h1>
        <p className="max-w-[54ch] text-[16.5px] leading-relaxed text-ink-soft">
          Not per lead, not per month, not for being shown. Buyers pay nothing, ever.
        </p>
      </header>

      <Card className="flex flex-col gap-6 p-7 sm:p-9">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[44px] font-extrabold leading-none tracking-[-0.04em]">€49</span>
          <span className="text-[15px] text-ink-soft">per accepted meeting</span>
        </div>

        <ul className="flex flex-col gap-3 text-[14.5px]">
          {[
            "Charged once, when both sides have agreed to meet",
            "The briefing is written before you are charged",
            "Declined by the buyer, or by your own agent? Nothing is charged",
            "Listing services, being matched and negotiating are free",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <span className="mt-0.5 text-accent">
                <Icon name="circle-dot" size={15} />
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {/* A plain form, so the redirect to Stripe works without any client JavaScript. */}
        <form action="/api/checkout" method="post" className="border-t border-line pt-6">
          <button
            type="submit"
            className="cursor-pointer rounded-[10px] bg-accent px-5 py-3 text-[14.5px] font-semibold text-surface transition-colors hover:bg-accent-strong"
          >
            Pay an introduction fee
          </button>
        </form>
      </Card>

      <p className="max-w-[60ch] text-[14px] leading-relaxed text-ink-soft">
        Why this way round: a platform paid per lead earns more the more vendors it puts in front
        of a buyer, which is the incentive that turned every other marketplace into a spam
        channel. Charging for the meeting itself pays us only when the introduction was worth
        making — the same test the buyer applies.
      </p>
    </main>
  );
}
