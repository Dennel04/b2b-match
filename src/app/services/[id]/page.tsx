import { renderServiceScreen } from "../load";

export const metadata = { title: "Service — Crossdesk" };

export default async function ServicePage({ params, searchParams }: PageProps<"/services/[id]">) {
  const { id } = await params;
  const { demo } = await searchParams;
  return renderServiceScreen({ serviceId: id, demo: demo !== undefined });
}
