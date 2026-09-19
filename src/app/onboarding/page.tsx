import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { domainFromEmail } from "@/lib/scrape";
import { serverClient } from "@/lib/supabase";
import { premiumFont } from "../fonts";
import { Wizard } from "./Wizard";

export const metadata = { title: "Set up your company — Crossdesk" };

/** First visit only: three answers. A company that already exists edits itself on /company. */
export default async function OnboardingPage() {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Owner-only read (RLS companies_read_own).
  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
  if (company) redirect("/company");

  return (
    <div className={`${premiumFont} flex min-h-dvh flex-col bg-bg text-ink`}>
      {/* Every signed-in screen redirects here until a company exists, so this is the only way out. */}
      <SiteHeader>
        <span className="hidden text-[13px] text-ink-faint sm:inline">{user.email}</span>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-semibold text-ink-soft ring-1 ring-ink/10 transition-colors hover:bg-surface hover:text-ink"
          >
            Log out
          </button>
        </form>
      </SiteHeader>
      <Wizard autoSite={user.email ? domainFromEmail(user.email) : null} />
    </div>
  );
}
