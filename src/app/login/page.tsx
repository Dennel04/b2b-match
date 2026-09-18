import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Log in — B2B Match" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center bg-bg text-ink">
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col items-center justify-center gap-[26px] px-4 py-6">
        <AuthForm initialError={typeof error === "string" ? `Sign-in failed: ${error}` : undefined} />
        <p className="max-w-[420px] text-center text-[13px] leading-relaxed text-ink-faint">
          The problems you write down are withheld from every other company. Vendors only ever
          see a summary, and only after you say yes.
        </p>
      </main>
    </div>
  );
}
