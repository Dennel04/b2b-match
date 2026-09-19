import { renderProblemScreen } from "../load";

export const metadata = { title: "Problem — Crossdesk" };

// `?demo` shows the reference problem on fake data, so the demo path works without seeding.
export default async function ProblemPage({ params, searchParams }: PageProps<"/problems/[id]">) {
  const [{ id }, { demo }] = await Promise.all([params, searchParams]);
  return renderProblemScreen({ problemId: id, demo: demo !== undefined });
}
