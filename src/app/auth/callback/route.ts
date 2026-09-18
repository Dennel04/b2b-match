import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";

/** Google OAuth and email-confirmation links land here with a one-time `code`. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  // Only same-site paths, so the link can't bounce users to another domain.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await serverClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
