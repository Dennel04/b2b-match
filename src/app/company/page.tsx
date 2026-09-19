import { redirect } from "next/navigation";

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
      <>
        <CompanyForm initial={DEMO_COMPANY} demo />
      </>
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
    <>
      <CompanyForm initial={draftFromCompany(company)} />
    </>
  );
}
