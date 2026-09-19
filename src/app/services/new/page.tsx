import { redirect } from "next/navigation";
import { initialsOf } from "@/components/layout";
import { serverClient } from "@/lib/supabase";
import { Compose } from "./Compose";

export const metadata = { title: "Describe what you ship — Crossdesk" };

/** Listing a service. Account only: a service is saved against a company. */
export default async function NewServicePage() {
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await db
    .from("companies")
    .select("id, name, profile_json")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!company) redirect("/onboarding");

  return <Compose companyId={company.id} profile={company.profile_json} initials={initialsOf(company.name)} />;
}
