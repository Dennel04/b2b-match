import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";

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

/**
 * An editorial italic serif for one decorative word on the login screen ("what's broken",
 * rewritten in a notary's hand). Thin, high-contrast, document-like: it fits the "confidential
 * document" idea in the b2b-match-ui skill. Not a product typeface: nothing else uses it.
 */
export const script = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-script",
});
