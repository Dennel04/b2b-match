import { renderProblemScreen } from "../problems/load";

export const metadata = { title: "Dashboard — Crossdesk" };

// The main screen is the company's latest problem. `?demo` shows it on fake data, before seeding.
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { demo } = await searchParams;
  return renderProblemScreen({ demo: demo !== undefined });
}
