import { renderProblemsList } from "./load";

export const metadata = { title: "Problems — Crossdesk" };

// The company's problems. `?demo` shows the screen on fake data, before seeding.
export default async function ProblemsPage({ searchParams }: PageProps<"/problems">) {
  const { demo, by, closed } = await searchParams;
  return renderProblemsList({
    demo: demo !== undefined,
    by: typeof by === "string" ? by : undefined,
    closed: closed === undefined ? undefined : "",
  });
}
