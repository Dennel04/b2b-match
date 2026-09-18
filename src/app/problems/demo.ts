import type { ProblemScreenData } from "./ProblemScreen";

/** The reference screen's content (drafts/design/problem-page.html), word for word. */
export const DEMO: ProblemScreenData = {
  caseRef: "PRB-4f21",
  status: "Matching",
  initials: "KM",
  offers: 2,
  title: "Customs paperwork by hand across three warehouses",
  summary: "Two people, about 60 hours a month, two filing fines this year. A freelancer did not stick.",
  terms: ["Ceiling €4,000 / month", "Start by 15 Nov 2026", "Pilot first or retainer", "DPA, Estonian"],
  matched: [
    { id: "m-1", name: "Mooncascade", place: "Tartu", logo: "/logos/mooncascade.png", state: "Ready to meet", ready: true, score: 91 },
    { id: "m-2", name: "Katrium", place: "Tallinn", logo: "/logos/katrium.png", state: "Still talking", ready: false, score: 74 },
  ],
  awaiting: [
    { id: "m-3", name: "Finest", place: "Tallinn", logo: "/logos/finest.png", area: "Deadline" },
    { id: "m-4", name: "Proekspert", place: "Tallinn", logo: "/logos/proekspert.png", area: "Contract format" },
  ],
  declined: 7,
};
