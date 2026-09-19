import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { myCredits } from "@/actions/credits";
import { openMatchCount } from "@/actions/match";
import { CreditsProvider, ShellProvider, initialsOf } from "@/components/layout";
import { currentUser, serverClient } from "@/lib/supabase";
import { jakarta } from "./fonts";
import "./globals.css";

/** The sidebar's own facts: who is signed in, and how many matches are open. */
async function readFrame() {
  const user = await currentUser();
  if (!user) return { initials: "\u00b7", matches: null };

  const db = await serverClient();
  const [{ data: company }, matches] = await Promise.all([
    db.from("companies").select("name").eq("owner_id", user.id).limit(1).maybeSingle(),
    openMatchCount(),
  ]);
  return { initials: initialsOf(company?.name), matches };
}

export const metadata: Metadata = {
  title: "Crossdesk",
  description: "A dark pool for business problems. No cold outreach.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Read here rather than in the pill: this layout is above every screen and a client navigation
  // never re-runs it, so the balance is in the first HTML and then simply stays put.
  const [credits, frame] = await Promise.all([myCredits(), readFrame()]);

  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <CreditsProvider initial={credits}>
          <ShellProvider initial={frame}>{children}</ShellProvider>
        </CreditsProvider>
        {/* Page views in Vercel → Analytics. No cookies, no personal data; off outside Vercel. */}
        <Analytics />
      </body>
    </html>
  );
}
