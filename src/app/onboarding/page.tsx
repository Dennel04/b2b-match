import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { serverClient } from "@/lib/supabase";
import { premiumFont } from "../fonts";
import { draftFromCompany } from "./fields";
import { Wizard, type StepId } from "./Wizard";

const STEP_IDS: StepId[] = ["company", "offer", "terms", "buying", "ready"];

export const metadata = { title: "Set up your company — Crossdesk" };

/** Company setup. Every step is optional and skippable; answers prefill from a saved company. */
export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  // ?step=terms opens that step directly: the dashboard links each missing answer to its step.
  const { step } = await searchParams;
  const initialStep = STEP_IDS.find((s) => s === step);
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
      <Wizard initial={draftFromCompany(company)} email={user.email ?? ""} initialStep={initialStep} />
    </div>
  );
}
