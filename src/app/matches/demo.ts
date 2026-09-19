import type { MatchesScreenData } from "./MatchesScreen";

/**
 * The match list on fake data, for `?demo` and for the stage. One company that both buys and
 * sells, so the screen shows both sides of the wall at once: rows where it owes an answer and
 * rows where it is waiting on someone else.
 */
export const DEMO_MATCHES: MatchesScreenData = {
  initials: "KM",
  role: "both",
  matched: [
    {
      id: "m-1",
      name: "Mooncascade",
      place: "Builds the customs integrations the paperwork would run on",
      logo: "/logos/mooncascade.png",
      context: "Customs paperwork by hand",
      state: "Ready to meet",
      yours: true,
      score: 91,
    },
    {
      id: "m-5",
      name: "A logistics company, 50–200 people",
      place: "Your warehouse integrations match what they described",
      context: "They came to you",
      state: "Interest received",
      yours: true,
      score: 88,
    },
    {
      id: "m-2",
      name: "Katrium",
      place: "Runs month-end close as a managed service",
      logo: "/logos/katrium.png",
      context: "Month-end close takes nine days",
      state: "Interest sent",
      yours: false,
      score: 74,
    },
    {
      id: "m-6",
      name: "Fortumo",
      place: "Both sides accepted — the briefing is ready",
      context: "Two warehouse systems",
      state: "Meeting confirmed",
      yours: false,
      score: 83,
    },
  ],
  awaiting: [
    {
      id: "m-3",
      name: "Finest",
      place: "Could start, but not by the date you set",
      logo: "/logos/finest.png",
      context: "Customs paperwork by hand",
      area: "Start date",
    },
    {
      id: "m-4",
      name: "Proekspert",
      place: "Takes the work, not in the contract shape you allow",
      logo: "/logos/proekspert.png",
      context: "Customs paperwork by hand",
      area: "Contract format",
    },
  ],
  declined: 11,
};
