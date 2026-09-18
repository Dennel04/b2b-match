import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { serverClient } from "@/lib/supabase";

export const metadata = { title: "Dashboard — B2B Match" };

// Placeholder until onboarding and matches exist: proves the session works end to end.
export default async function DashboardPage() {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col items-center bg-bg text-ink">
      <SiteHeader>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="cursor-pointer rounded-sm border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
          >
            Log out
          </button>
        </form>
      </SiteHeader>
      <main className="flex w-full flex-1 items-center justify-center px-4 py-6">
        <div className="flex w-full max-w-[420px] flex-col gap-2 rounded-sm border border-line bg-surface p-6 sm:p-8">
          <h1 className="font-serif text-[22px] font-semibold">You&apos;re in</h1>
          <p className="text-[13px] text-ink-soft">
            Signed in as <span className="font-semibold text-ink">{user.email}</span>.
          </p>
          <p className="text-[13px] text-ink-faint">Company setup and matches are coming next.</p>
          <Link href="/preview" className="mt-2 text-[13px] font-semibold text-accent hover:text-accent-strong">
            See what a match looks like
          </Link>
        </div>
      </main>
    </div>
  );
}
