import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { domainFromEmail } from "@/lib/scrape";
import { serverClient } from "@/lib/supabase";
import { premiumFont } from "../fonts";
import { draftFromCompany } from "./fields";
import { Wizard } from "./Wizard";

export const metadata = { title: "Set up your company — Crossdesk" };

/** Company setup on one screen. Answers prefill from a saved company; a work email autofills. */
export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  // ?step=terms opens the working terms: the dashboard links a missing answer to it.
  const { step } = await searchParams;
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Owner-only read (RLS companies_read_own), so this returns the viewer's own company or nothing.
  const { data: company } = await supabase
    .from("companies")
    .select("name, website, role, profile_json, seller_terms")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  return (
    <div className={`${premiumFont} flex min-h-dvh flex-col bg-bg text-ink`}>
      <SiteHeader />
      <Wizard
        initial={draftFromCompany(company)}
        autoSite={user.email ? domainFromEmail(user.email) : null}
        openTerms={step === "terms"}
      />
    </div>
  );
}
