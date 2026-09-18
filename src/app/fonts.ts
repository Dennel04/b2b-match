import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * The product's only typeface. Applied once on <html> in layout.tsx, so every screen
 * inherits it. Adding a second face is a decision for the whole team, not a detail of
 * one screen.
 */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

/** Kept so the login and onboarding screens keep working; it is now a no-op. */
export const premiumFont = "";
