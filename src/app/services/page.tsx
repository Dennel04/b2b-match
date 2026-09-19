import { renderServicesList } from "./load";

export const metadata = { title: "Services — Crossdesk" };

// What the company sells, one row per service. `?demo` shows the screen on fake data.
export default async function ServicesPage({ searchParams }: PageProps<"/services">) {
  const { demo, by, paused } = await searchParams;
  return renderServicesList({
    demo: demo !== undefined,
    by: typeof by === "string" ? by : undefined,
    paused: paused === undefined ? undefined : "",
  });
}
