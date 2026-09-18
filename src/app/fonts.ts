import { Plus_Jakarta_Sans } from "next/font/google";

/** Display and UI face of the high-end-visual-design screens (login, onboarding). */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

/** Put on the wrapper of a screen that uses the premium look. */
export const premiumFont = `${jakarta.variable} font-[family-name:var(--font-jakarta)]`;
