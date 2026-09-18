import { Sidebar } from "./Sidebar";
import { SiteFooter } from "./SiteFooter";

/**
 * Every signed-in screen sits in this. Sidebar on the left, the rest a column so the
 * footer can be pushed to the bottom on short pages.
 */
export function AppShell({
  current,
  children,
}: {
  current?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-bg text-ink">
      <Sidebar current={current} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export { SiteFooter };
