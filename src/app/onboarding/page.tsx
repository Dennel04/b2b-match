import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase";
import {  } from "../fonts";
import { draftFromCompany } from "./fields";
import { Wizard } from "./Wizard";

export const metadata = { title: "Set up your company — B2B Match" };

/** Company setup. Every step is optional and skippable; answers prefill from a saved company. */
export default async function OnboardingPage() {
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
    <div className={`flex min-h-dvh flex-col bg-bg text-ink`}>
      
      <Wizard initial={draftFromCompany(company)} email={user.email ?? ""} />
    </div>
  );
}
