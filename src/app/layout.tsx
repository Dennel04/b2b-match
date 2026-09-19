import type { Metadata } from "next";
import { jakarta } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crossdesk",
  description: "A dark pool for business problems. No cold outreach.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
