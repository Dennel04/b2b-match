import { Instrument_Sans, Plus_Jakarta_Sans } from "next/font/google";

/** The product's only typeface. Adding a second one is a design decision, not a detail. */
export const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
});

/** Display and UI face of the login, sign-up and onboarding screens. */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

/** Put on the wrapper of a screen that uses the login/onboarding look. */
export const premiumFont = `${jakarta.variable} font-[family-name:var(--font-jakarta)]`;
