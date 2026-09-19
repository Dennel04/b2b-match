import { redirect } from "next/navigation";
import { claimCheckout, myCredits } from "@/actions/credits";
import { AppShell, SyncBalance, initialsOf } from "@/components/layout";
import { Coin, Icon } from "@/components/ui";
import { PACKS, UNLOCK_COST, euros } from "@/lib/credits";
import { currentUser, serverClient } from "@/lib/supabase";

export const metadata = { title: "Credits — Crossdesk" };

/**
 * The balance and the three ways to refill it.
 *
 * Buying a credit is not buying a lead: matching, negotiating and being listed stay free, and a
 * credit is spent only on a counterparty that already came to you. The page says so once and
 * then gets out of the way.
 */
export default async function CreditsPage({ searchParams }: PageProps<"/credits">) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const db = await serverClient();
  const { data: company } = await db.from("companies").select("name").eq("owner_id", user.id).limit(1).maybeSingle();
  if (!company) redirect("/onboarding");

  // Coming back from Stripe. Granting here rather than in a webhook, and keyed on the session
  // id, so a reload of this URL adds nothing a second time.
  const { paid } = await searchParams;
  const claim = typeof paid === "string" ? await claimCheckout(paid) : null;
  const credits = claim?.ok ? claim.data : ((await myCredits()) ?? 0);

  return (
    <AppShell initials={initialsOf(company.name)}>
      {/* This screen has just read the balance — a top-up must not wait for a reload to show. */}
      <SyncBalance credits={credits} />
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 md:px-9 md:pt-8">
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">Credits</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Matching is free. {UNLOCK_COST} credits open one counterparty.
        </p>

        {claim && !claim.ok && (
          <p className="mt-5 flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-3 text-[13.5px] text-danger">
            <Icon name="circle-x" size={15} />
            {claim.message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-5 rounded-[10px] border border-line bg-surface px-5 py-[22px]">
          <Coin size={40} />
          <div>
            <p className="text-[32px] font-semibold leading-none tabular-nums tracking-[-0.03em]">{credits}</p>
            <p className="mt-1.5 text-[13px] text-ink-soft">
              {credits >= UNLOCK_COST
                ? `Opens ${Math.floor(credits / UNLOCK_COST)} ${Math.floor(credits / UNLOCK_COST) === 1 ? "counterparty" : "counterparties"}`
                : "Not enough for a counterparty"}
            </p>
          </div>
          {claim?.ok && (
            <span className="ml-auto flex items-center gap-1.5 rounded-[7px] bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent-strong">
              <Icon name="circle-dot" size={13} />
              Payment received
            </span>
          )}
        </div>

        <h2 className="mt-9 text-[15px] font-semibold tracking-[-0.01em]">Top up</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {PACKS.map((pack) => (
            <form
              key={pack.credits}
              action="/api/checkout"
              method="post"
              className="flex flex-col gap-4 rounded-[10px] border border-line bg-surface p-5"
            >
              <input type="hidden" name="credits" value={pack.credits} />
              <div className="flex items-center gap-2.5">
                <Coin size={22} />
                <span className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]">{pack.credits}</span>
              </div>
              <div>
                <p className="text-[19px] font-semibold tabular-nums tracking-[-0.02em]">{euros(pack.cents)}</p>
                <p className="mt-1 text-[12.5px] text-ink-faint">
                  {euros(Math.round((pack.cents * UNLOCK_COST) / pack.credits))} per counterparty
                </p>
              </div>
              <button
                type="submit"
                className="mt-auto cursor-pointer rounded-[8px] bg-brand px-4 py-2 text-[13px] font-semibold text-surface transition-colors hover:bg-brand-strong"
              >
                Buy
              </button>
            </form>
          ))}
        </div>

      </main>
    </AppShell>
  );
}
