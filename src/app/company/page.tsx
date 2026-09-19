import { redirect } from "next/navigation";
import { AppShell, initialsOf } from "@/components/layout";
import { serverClient } from "@/lib/supabase";
import { draftFromCompany } from "../onboarding/fields";
import { CompanyForm } from "./CompanyForm";
import { DEMO_COMPANY } from "./mock";

export const metadata = { title: "Company — Crossdesk" };

/** Everything sign-up did not ask, read as a profile. */
export default async function CompanyPage({
  searchParams,
}: PageProps<"/company">) {
  const { demo } = await searchParams;

  // `?demo` shows a filled profile without an account. Nothing it edits is stored.
  if (demo !== undefined)
    return (
      <AppShell active="company" initials={initialsOf(DEMO_COMPANY.name)}>
        <CompanyForm initial={DEMO_COMPANY} demo />
      </AppShell>
    );

  const db = await serverClient();
  const {
    data: { user },
  } = await db.auth.getUser();
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
      <CompanyForm initial={draftFromCompany(company)} />
    </AppShell>
  );
}
