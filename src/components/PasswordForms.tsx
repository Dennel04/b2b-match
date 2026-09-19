"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Bezel, Field, PillButton, PillLink, inputClass } from "./premium";

// Not imported from @/lib/supabase: that module pulls in next/headers, which breaks client bundles.
const browserClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

/** Same entry as the log-in form's messages. */
const ENTER =
  "transition-[opacity,translate] duration-200 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0";

/** The card both password screens share, the log-in form's size and padding. */
function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Bezel className="w-full max-w-[460px]" inner="flex flex-col gap-5 p-6 sm:p-8">
      <Link
        href="/login"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Back to log in
      </Link>
      <div>
        <h1 className="text-[26px] font-bold tracking-[-0.03em]">{title}</h1>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{subtitle}</p>
      </div>
      {children}
    </Bezel>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className={`rounded-2xl bg-danger/10 px-4 py-3 text-[13.5px] text-danger ${ENTER}`}>
      {children}
    </p>
  );
}

/**
 * Step 1: the email. The link in the message goes through /auth/callback, which turns its code
 * into a session and sends the person on to /reset-password. The reply is the same whether or not
 * an account exists, so the form cannot be used to find out who is registered.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await browserClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    // A rate limit or a bad address is worth saying; "no such user" is never reported by Supabase.
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <Card title="Check your inbox" subtitle={`If an account exists for ${email}, a link to set a new password is on its way.`}>
        <p className={`rounded-2xl bg-surface-alt px-4 py-3 text-[13.5px] leading-relaxed text-ink-soft ${ENTER}`}>
          The link works once, in this browser. Nothing arrived in a few minutes? Look in spam, then{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="cursor-pointer font-semibold text-ink underline-offset-4 hover:underline"
          >
            send it again
          </button>
          .
        </p>
      </Card>
    );
  }

  return (
    <Card title="Forgot your password?" subtitle="Enter your work email and we send a link to set a new one.">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="Work email">
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@company.ee"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        {error && <Alert>{error}</Alert>}
        <PillButton type="submit" disabled={busy} className="mt-1 w-full justify-between">
          {busy ? "One moment…" : "Send the link"}
        </PillButton>
      </form>
    </Card>
  );
}

/**
 * Step 2: the new password. The page is reached signed in, through the link's one-time session;
 * without one the link has expired or was already used, and the page says so instead of a form.
 */
export function ResetPasswordForm({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <Card title="This link has expired" subtitle="A reset link works once and for a limited time. Ask for a new one.">
        <PillLink href="/forgot-password" className="w-full justify-between">
          Send a new link
        </PillLink>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== repeat) {
      setError("The two passwords are different.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await browserClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <Card title="Set a new password" subtitle="Then you go straight to your dashboard.">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="New password" help="At least 6 characters.">
          <input
            type="password"
            required
            autoFocus
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Repeat it">
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            className={inputClass}
          />
        </Field>
        {error && <Alert>{error}</Alert>}
        <PillButton type="submit" disabled={busy} className="mt-1 w-full justify-between">
          {busy ? "One moment…" : "Save and log in"}
        </PillButton>
      </form>
    </Card>
  );
}
