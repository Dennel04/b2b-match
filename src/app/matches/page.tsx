import { renderMatchesList } from "./load";

export const metadata = { title: "Matches — Crossdesk" };

// Every counterparty across the company's problems. `?demo` shows the screen on fake data.
export default async function MatchesPage({ searchParams }: PageProps<"/matches">) {
  const { demo } = await searchParams;
  return renderMatchesList({ demo: demo !== undefined });
}
