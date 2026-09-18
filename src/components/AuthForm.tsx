"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// Not imported from @/lib/supabase: that module pulls in next/headers, which breaks client bundles.
const browserClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Mode = "login" | "signup";

const COPY = {
  login: { title: "Welcome back", subtitle: "Log in to see your matches.", cta: "Log in" },
  signup: { title: "Create your account", subtitle: "Set up your company in under two minutes.", cta: "Create account" },
} as const;

const inputClass =
  "rounded-[9px] border border-line-strong bg-bg px-3.5 py-3 text-[14.5px] text-ink outline-none placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft";

export function AuthForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(null);

  const copy = COPY[mode];

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError(null);
    setNotice(null);
    const supabase = browserClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(null);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
        setBusy(null);
        return;
      }
      // Email confirmation is on in Supabase: no session until the link is clicked.
      if (!data.session) {
        setNotice(`We sent a confirmation link to ${email}. Open it to finish signing up.`);
        setBusy(null);
        return;
      }
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function onGoogle() {
    setBusy("google");
    setError(null);
    const { error } = await browserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    // On success the browser is already navigating to Google.
    if (error) {
      setError(error.message);
      setBusy(null);
    }
  }

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-[26px]">
      <div role="tablist" className="flex rounded-[10px] border border-line bg-surface-alt p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`flex-1 cursor-pointer rounded-[7px] py-2.5 text-sm font-semibold transition-colors ${
              mode === m ? "bg-surface text-ink shadow-sm" : "text-ink-faint hover:text-ink"
            }`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-[18px] rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-[22px] font-semibold">{copy.title}</h1>
          <p className="text-[13px] text-ink-soft">{copy.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy !== null}
          className="flex cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-line-strong bg-surface px-5 py-3 text-[14.5px] font-semibold text-ink transition-colors hover:border-ink-soft disabled:cursor-default disabled:opacity-60"
        >
          <GoogleIcon />
          {busy === "google" ? "Redirecting…" : "Continue with Google"}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs text-ink-faint">or with email</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-[18px]">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-ink-soft">Work email</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-ink-soft">Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            {mode === "signup" && <span className="text-xs text-ink-faint">At least 6 characters.</span>}
          </label>

          {error && (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-[9px] bg-accent-soft px-3.5 py-3 text-[13px] text-ink">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy !== null}
            className="mt-1 cursor-pointer rounded-[9px] bg-accent px-5 py-[13px] text-[14.5px] font-semibold text-[#FCFAF3] transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
          >
            {busy === "email" ? "One moment…" : copy.cta}
          </button>
        </form>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
