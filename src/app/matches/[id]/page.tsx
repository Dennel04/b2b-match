import { renderMatchScreen } from "../load";

export const metadata = { title: "Match — Crossdesk" };

// One counterparty, as this viewer may see them. getMatchView() decides what that is.
export default async function MatchPage({ params }: PageProps<"/matches/[id]">) {
  const { id } = await params;
  return renderMatchScreen(id);
}
