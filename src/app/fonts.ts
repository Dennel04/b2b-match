import { Instrument_Sans } from "next/font/google";

/** The product's only typeface. Adding a second one is a design decision, not a detail. */
export const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
});
