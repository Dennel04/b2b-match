import Link from "next/link";
import { redirect } from "next/navigation";
import { Bezel, Eyebrow } from "@/components/premium";
import { SiteHeader } from "@/components/SiteHeader";
import { serverClient } from "@/lib/supabase";
import { premiumFont } from "../fonts";
import { draftFromCompany, readiness } from "../onboarding/fields";

export const metadata = { title: "Dashboard — B2B Match" };

// Placeholder until matches exist: shows how ready the company is for the matcher.
export default async function DashboardPage() {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies")
    .select("name, website, role, profile_json, seller_terms")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  const checklist = readiness(draftFromCompany(company));
  const missing = checklist.filter((c) => !c.done);

  return (
    <div className={`${premiumFont} flex min-h-dvh flex-col bg-bg text-ink`}>
      <SiteHeader>
        <form action="/auth/signout" method="post">
          <button type="submit" className="cursor-pointer rounded-full bg-ink/[0.05] px-4 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-ink/[0.08] hover:text-ink">
            Log out
          </button>
        </form>
      </SiteHeader>

      <main className="mx-auto w-full max-w-[1120px] px-4 pb-24 pt-6 md:px-8">
        <div className="soft-in">
          <Eyebrow>{company?.name ?? user.email}</Eyebrow>
          <h1 className="mt-5 max-w-[20ch] text-[clamp(2.2rem,5vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.045em]">
            {missing.length ? "A few answers and the matcher can start." : "Your profile is ready for matching."}
          </h1>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-12">
          <Bezel className="soft-in md:col-span-7" inner="p-7 md:p-9">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[22px] font-bold tracking-[-0.02em]">Matcher readiness</h2>
              <span className="text-[15px] font-semibold text-ink-soft">
                {checklist.length - missing.length} / {checklist.length}
              </span>
            </div>
            <div className="mt-3 flex gap-1" aria-hidden>
              {checklist.map((c) => <span key={c.label} className={`h-1.5 flex-1 rounded-full ${c.done ? "bg-accent" : "bg-ink/10"}`} />)}
            </div>
            <ul className="mt-6 divide-y divide-line">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-start gap-4 py-3.5">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${c.done ? "bg-accent text-surface" : "bg-ink/[0.06]"}`}>
                    {c.done ? "✓" : ""}
                  </span>
                  <div>
                    <p className={`font-semibold ${c.done ? "text-ink-soft" : ""}`}>{c.label}</p>
                    {!c.done && <p className="text-[13px] text-ink-soft">{c.why}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/onboarding"
              className="group mt-7 inline-flex items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-[14.5px] font-semibold text-surface transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              {company ? "Edit company setup" : "Set up your company"}
              <span className="grid h-8 w-8 place-items-center rounded-full bg-surface/15 transition-transform duration-500 group-hover:translate-x-0.5">↗</span>
            </Link>
          </Bezel>

          <Bezel className="soft-in md:col-span-5" inner="flex h-full flex-col p-7 md:p-9">
            <h2 className="text-[22px] font-bold tracking-[-0.02em]">What happens next</h2>
            <ol className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink-soft">
              <li><span className="font-semibold text-ink">Describe a problem.</span> A short AI interview. Only you can read it.</li>
              <li><span className="font-semibold text-ink">Agents negotiate.</span> Yours and the supplier&rsquo;s, before anyone meets.</li>
              <li><span className="font-semibold text-ink">You both say yes.</span> Then names are shared and a brief is written.</li>
            </ol>
            <Link href="/problem" className="mt-auto pt-8 text-[14px] font-semibold text-accent underline-offset-4 hover:underline">
              See what a match looks like
            </Link>
          </Bezel>
        </div>
      </main>
    </div>
  );
}
