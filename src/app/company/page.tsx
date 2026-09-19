import { redirect } from "next/navigation";
import { AppShell, initialsOf } from "@/components/layout";
import { serverClient } from "@/lib/supabase";
import { draftFromCompany } from "../onboarding/fields";
import { CompanyForm } from "./CompanyForm";

export const metadata = { title: "Company — Crossdesk" };

/** Everything sign-up did not ask. `?step=terms` scrolls to the working terms. */
export default async function CompanyPage({ searchParams }: PageProps<"/company">) {
  const { step } = await searchParams;
  const db = await serverClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  // Owner-only read (RLS companies_read_own).
  const { data: company } = await db
    .from("companies")
    .select("name, website, role, profile_json, seller_terms")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!company) redirect("/onboarding");

  return (
    <AppShell active="company" initials={initialsOf(company.name)}>
      <CompanyForm initial={draftFromCompany(company)} openTerms={step === "terms"} />
    </AppShell>
  );
}
