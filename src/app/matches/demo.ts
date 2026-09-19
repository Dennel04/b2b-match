import type { MatchesScreenData } from "./MatchesScreen";

/**
 * The match list on fake data, for `?demo` and for the stage. One company that both buys and
 * sells, so the screen shows both sides of the wall at once: buyers who came to its services,
 * and vendors found for the problems it wrote.
 */
export const DEMO_MATCHES: MatchesScreenData = {
  initials: "KM",
  unseen: 2,
  role: "both",
  matched: [
    {
      // The one row the stage is for: a buyer who has said they want to meet, still unopened.
      id: "m-5",
      side: "selling",
      name: "Parcel logistics, ~90 people",
      place: "Needs delivery capacity on the Latvian routes your fleet already covers",
      context: "Last-mile delivery across the Baltics",
      state: "Interest received",
      yours: true,
      score: 88,
      locked: true,
      blurred: true,
      anon: true,
    },
    {
      id: "m-7",
      side: "selling",
      name: "Fortumo",
      place: "Both sides accepted - the briefing is ready",
      logo: "/logos/fortumo.png",
      context: "Contract warehousing in Tallinn and Riga",
      state: "Meeting confirmed",
      yours: false,
      score: 83,
    },
    {
      id: "m-1",
      side: "buying",
      name: "Mooncascade",
      place: "Builds the customs integrations the paperwork would run on",
      logo: "/logos/mooncascade.png",
      context: "Customs paperwork by hand",
      state: "Ready to meet",
      yours: true,
      score: 91,
    },
    {
      id: "m-2",
      side: "buying",
      name: "Katrium",
      place: "Runs month-end close as a managed service",
      logo: "/logos/katrium.png",
      context: "Month-end close takes nine days",
      state: "Interest sent",
      yours: false,
      score: 74,
    },
  ],
  awaiting: [
    {
      id: "m-3",
      side: "buying",
      name: "Finest",
      place: "Could start, but not by the date you set",
      logo: "/logos/finest.png",
      context: "Customs paperwork by hand",
      area: "Start date",
    },
    {
      id: "m-4",
      side: "buying",
      name: "Proekspert",
      place: "Takes the work, not in the contract shape you allow",
      logo: "/logos/proekspert.png",
      context: "Customs paperwork by hand",
      area: "Contract format",
    },
  ],
  declined: { selling: 2, buying: 9 },
};
