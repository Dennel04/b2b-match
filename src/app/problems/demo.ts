import type { ProblemScreenData } from "./ProblemScreen";
import type { ProblemsScreenData } from "./ProblemsScreen";

/** The reference screen's content (drafts/design/problem-page.html), word for word. */
export const DEMO: ProblemScreenData = {
  caseRef: "PRB-4f21",
  status: "matching",
  initials: "KM",
  matches: 2,
  title: "Customs paperwork by hand across three warehouses",
  summary: "Two people, about 60 hours a month, two filing fines this year. A freelancer did not stick.",
  terms: ["Up to €4,000 / month", "Start by 15 Nov 2026", "Pilot first or retainer", "DPA, Estonian"],
  matched: [
    { id: "m-1", name: "Mooncascade", place: "Tartu", logo: "/logos/mooncascade.png", state: "Ready to meet", ready: true, score: 91 },
    { id: "m-2", name: "Katrium", place: "Tallinn", logo: "/logos/katrium.png", state: "Still talking", ready: false, score: 74 },
  ],
  awaiting: [
    { id: "m-3", name: "Finest", place: "Tallinn", logo: "/logos/finest.png", area: "Start date" },
    { id: "m-4", name: "Proekspert", place: "Tallinn", logo: "/logos/proekspert.png", area: "Contract format" },
  ],
  declined: 7,
};

/** The list screen on fake data, before seeding: one company's problems across its departments. */
export const DEMO_LIST: ProblemsScreenData = {
  initials: "KM",
  matches: 2,
  rows: [
    {
      id: "p-1",
      title: "Customs paperwork by hand across three warehouses",
      area: "Operations",
      state: "ready",
      matched: 2,
      awaiting: 2,
      startBy: "2026-11-15",
      terms: "Up to €4,000 / month",
    },
    {
      id: "p-2",
      title: "Month-end close takes nine working days",
      area: "Finance & accounting",
      state: "matching",
      matched: 3,
      awaiting: 1,
      startBy: "2026-10-20",
      terms: "Up to €25,000 / project",
    },
    {
      id: "p-3",
      title: "Two warehouse systems that do not talk to each other",
      area: "IT",
      state: "matching",
      matched: 1,
      awaiting: 4,
      startBy: "2027-02-01",
      terms: "Up to €60,000 / project",
    },
    {
      id: "p-4",
      title: "Supplier contracts reviewed by one lawyer on retainer",
      area: "Legal",
      state: "searching",
      matched: 0,
      awaiting: 0,
      startBy: null,
      terms: "Up to €2,000 / month",
    },
    {
      id: "p-5",
      title: "Drivers rostered in a spreadsheet, overtime found too late",
      area: "Operations",
      state: "matching",
      matched: 2,
      awaiting: 0,
      startBy: "2026-12-01",
      terms: "Up to €1,500 / month",
    },
    {
      id: "p-6",
      title: "No one owns the warehouse safety training record",
      area: "People",
      state: "searching",
      matched: 0,
      awaiting: 0,
      startBy: null,
      terms: "No budget ceiling",
    },
    {
      id: "p-7",
      title: "Pallet labels printed twice for the Finnish route",
      area: "Operations",
      state: "closed",
      matched: 1,
      awaiting: 0,
      startBy: "2026-06-01",
      terms: "Up to €800 / month",
    },
  ],
};
