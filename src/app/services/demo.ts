import type { ServiceScreenData } from "./ServiceScreen";
import type { ServicesScreenData } from "./ServicesScreen";

/**
 * The selling side on fake data. One operator with several unrelated things to sell, which is
 * the whole point of listing them apart: the call centre and the fibre install share a company
 * and nothing else — not the price, not the lead time, not the buyer.
 */
export const DEMO_SERVICES: ServicesScreenData = {
  initials: "TE",
  rows: [
    {
      id: "s-1",
      title: "Business call centre",
      area: "Customer service",
      state: "interested",
      matched: 2,
      awaiting: 1,
      availableFrom: "2026-10-01",
      terms: "From €2,400 / month",
    },
    {
      id: "s-2",
      title: "Fibre to the premises",
      area: "Connectivity",
      state: "talking",
      matched: 1,
      awaiting: 2,
      availableFrom: "2026-11-10",
      terms: "From €18,000 / project",
    },
    {
      id: "s-3",
      title: "On-site engineers",
      area: "Field work",
      state: "talking",
      matched: 0,
      awaiting: 3,
      availableFrom: "2026-09-18",
      terms: "From €65 / hour",
    },
    {
      id: "s-4",
      title: "Television packages for venues",
      area: "Media",
      state: "listed",
      matched: 0,
      awaiting: 0,
      availableFrom: null,
      terms: "From €300 / month, per site",
    },
    {
      id: "s-5",
      title: "Legacy PBX migration",
      area: "Connectivity",
      state: "paused",
      matched: 0,
      awaiting: 0,
      availableFrom: null,
      terms: "From €9,000 / project",
    },
  ],
};

/** One service open: who arrived, who is a term away, and where the rest fell off. */
export const DEMO_SERVICE: ServiceScreenData = {
  caseRef: "SRV-8c30",
  status: "Live",
  initials: "TE",
  title: "Business call centre",
  summary:
    "Twelve agents in Tallinn, Estonian and English, inbound and outbound. Takes over an existing number range in about three weeks; reporting into the buyer's own CRM.",
  terms: ["From €2,400 / month", "Monthly retainer or paid pilot", "Available from 1 Oct 2026", "DPA, ISO 27001"],
  matched: [
    {
      id: "m-11",
      name: "A logistics company, 50–200 people",
      place: "Handles customer calls in two languages, wants them off their own staff",
      state: "Interest received",
      yours: true,
      score: 89,
    },
    {
      id: "m-12",
      name: "A retail chain, 200–500 people",
      place: "Seasonal call volume they cannot staff for",
      state: "Waiting on the buyer",
      yours: false,
      score: 81,
    },
  ],
  awaiting: [
    {
      id: "m-13",
      name: "A healthcare provider, 50–200 people",
      place: "Fits what you do, needs it running sooner than you can start",
      area: "Deadline",
    },
  ],
  declined: 6,
  declinedReasons: "4 on price, 2 on the deadline",
};
