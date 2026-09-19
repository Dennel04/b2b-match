import type { Draft } from "../onboarding/fields";

/**
 * A filled profile for `/company?demo`, so the screen can be looked at without an account and
 * without saving anything. A real Estonian company of the size this product is aimed at.
 */
export const DEMO_COMPANY: Draft = {
  name: "Nordkai Logistics OÜ",
  website: "nordkai.ee",
  role: "both",
  industry: "Road freight logistics",
  size: "51–200",
  summary:
    "We move palletised freight between the Baltics and the Nordics, with our own fleet of 40 trucks and a bonded warehouse in Muuga. Customs clearance and last-mile delivery are handled in house.",
  services: [
    "Road freight",
    "Customs clearance",
    "Bonded warehousing",
    "Last-mile delivery",
  ],
  keywords: ["freight", "customs", "warehouse", "baltics", "nordics"],
  capabilities: [
    "gdpr_dpa",
    "eu_data_residency",
    "estonian_language",
    "english_language",
    "industry_refs",
  ],
  floorAmount: "5000",
  floorPeriod: "one_off",
  sellerFormats: ["fixed_price", "monthly_retainer"],
  availableFrom: new Date(Date.now() + 14 * 86_400_000)
    .toISOString()
    .slice(0, 10),
};
