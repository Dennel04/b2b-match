import { redirect } from "next/navigation";

import { serverClient } from "@/lib/supabase";
import { Compose } from "./Compose";

export const metadata = { title: "Describe a problem — Crossdesk" };

/**
 * saveProblem() keeps working after it has answered: the first matching pass runs in an
 * after() on this route's invocation, and that time is charged here. Scoring is 7-25 s, so the
 * ceiling is headroom rather than a target.
 */
export const maxDuration = 300;

/** Writing a problem down. Account only: the interview needs the company's profile to ask
 * sharper questions, and a problem is saved against a company. */
export default async function NewProblemPage() {
  const db = await serverClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await db
    .from("companies")
    .select("id, name, profile_json")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!company) redirect("/onboarding");

  return (
    <Compose
      companyId={company.id}
      profile={company.profile_json}
    />
  );
}
