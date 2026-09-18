import type { Metadata } from "next";
import { jakarta } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "B2B Match",
  description: "A dark pool for business problems. No cold outreach.",
};

// Applies the saved theme before first paint, so there is no light/dark flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
