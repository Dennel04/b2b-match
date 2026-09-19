import { AppShell } from "./AppShell";

/**
 * What a nav segment shows the instant it is clicked, from its `loading.tsx`. The sidebar is
 * the real one — only the page body is a placeholder — so the frame does not blink and the
 * active item is already marked while the server is still reading.
 *
 * Shapes, never a spinner: the bars sit where the real title and rows will sit, so nothing
 * jumps when the content arrives.
 */
export function ScreenSkeleton({
  active,
  rows = 5,
}: {
  active?: React.ComponentProps<typeof AppShell>["active"];
  /** Placeholder rows. Match the screen's usual length, so the page height barely moves. */
  rows?: number;
}) {
  return (
    <AppShell active={active} initials="·">
      <main aria-busy="true" aria-live="polite" className="flex-1">
        <span className="sr-only">Loading</span>
        <section className="mx-auto w-full max-w-[1200px] px-4 pt-6 md:px-9 md:pt-8">
          <Bar className="h-[34px] w-[220px]" />
          <Bar className="mt-3 h-[14px] w-[140px]" />
          <div className="mt-6 border-b border-line pb-3">
            <Bar className="h-[14px] w-[260px]" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-4 md:px-9">
          <div className="pb-2.5 pt-2">
            <Bar className="h-[13px] w-[120px]" />
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center gap-6 border-b border-line px-4 py-[18px] last:border-b-0 md:px-5">
                <div className="min-w-0 flex-1">
                  {/* Titles are not all one length; three widths keep the block from reading as a table. */}
                  <Bar className={`h-[15px] ${["w-[54%]", "w-[38%]", "w-[46%]"][i % 3]}`} />
                  <Bar className="mt-2 h-[13px] w-[28%]" />
                </div>
                <Bar className="h-[22px] w-[110px] flex-none rounded-[7px]" />
                <Bar className="hidden h-[13px] w-[56px] flex-none md:block" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

/** One placeholder bar. Ink at 6% so it reads as paper, not as a disabled control. */
function Bar({ className }: { className: string }) {
  return <span aria-hidden className={`block animate-pulse rounded bg-ink/[0.06] motion-reduce:animate-none ${className}`} />;
}
