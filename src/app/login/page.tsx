import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Log in — B2B Match" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center bg-bg text-ink">
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col items-center justify-center gap-[26px] px-4 py-6">
        <AuthForm initialError={error ? "Sign-in failed. Please try again." : undefined} />
        <Link href="/" className="text-[13px] text-ink-faint hover:text-ink-soft">
          ← Back to homepage
        </Link>
      </main>
    </div>
  );
}
