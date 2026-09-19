import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";

/** Google OAuth and email-confirmation links land here with a one-time `code`. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  // Only same-site paths, so the link can't bounce users to another domain.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  // Supabase or Google refused before issuing a code (bad client secret, user cancelled, ...).
  let reason = searchParams.get("error_description") ?? searchParams.get("error");

  if (code) {
    const supabase = await serverClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
    reason = error.message;
  }

  reason ??= "No login code was returned.";
  console.error("[auth/callback]", reason);
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);
}
