import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { myCredits } from "@/actions/credits";
import { CreditsProvider } from "@/components/layout";
import { jakarta } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crossdesk",
  description: "A dark pool for business problems. No cold outreach.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Read here rather than in the pill: this layout is above every screen and a client navigation
  // never re-runs it, so the balance is in the first HTML and then simply stays put.
  const credits = await myCredits();

  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <CreditsProvider initial={credits}>{children}</CreditsProvider>
        {/* Page views in Vercel → Analytics. No cookies, no personal data; off outside Vercel. */}
        <Analytics />
      </body>
    </html>
  );
}
