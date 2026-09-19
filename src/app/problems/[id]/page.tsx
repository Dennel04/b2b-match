import { renderProblemScreen } from "../load";

export const metadata = { title: "Problem — Crossdesk" };

export default async function ProblemPage({ params }: PageProps<"/problems/[id]">) {
  const { id } = await params;
  return renderProblemScreen({ problemId: id });
}
