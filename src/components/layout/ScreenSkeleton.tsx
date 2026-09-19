/**
 * What a nav segment shows the instant it is clicked, from its `loading.tsx`. The sidebar is
 * the real one — only the page body is a placeholder — so the frame does not blink and the
 * active item is already marked while the server is still reading.
 *
 * Shapes, never a spinner: the bars sit where the real title and rows will sit, so nothing
 * jumps when the content arrives. The body enters with `.screen-in`, the same 180ms the real
 * screen enters with, so the two sides of the swap move alike.
 */
export function ScreenSkeleton({ rows = 5 }: {
  /** Placeholder rows. Match the screen's usual length, so the page height barely moves. */
  rows?: number;
}) {
  return (
    <>
      <main aria-busy="true" aria-live="polite" className="flex-1">
        <span className="sr-only">Loading</span>
        <section className="mx-auto w-full max-w-[1200px] px-4 pt-6 md:px-9 md:pt-8">
          <Bar className="h-[34px] w-[220px]" />
          <Bar className="mt-3 h-[14px] w-[140px]" i={1} />
          <div className="mt-6 border-b border-line pb-3">
            <Bar className="h-[14px] w-[260px]" i={2} />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-4 md:px-9">
          <div className="pb-2.5 pt-2">
            <Bar className="h-[13px] w-[120px]" i={3} />
          </div>
          <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center gap-6 border-b border-line px-4 py-[18px] last:border-b-0 md:px-5">
                <div className="min-w-0 flex-1">
                  {/* Titles are not all one length; three widths keep the block from reading as a table. */}
                  <Bar className={`h-[15px] ${["w-[54%]", "w-[38%]", "w-[46%]"][i % 3]}`} i={i + 4} />
                  <Bar className="mt-2 h-[13px] w-[28%]" i={i + 5} />
                </div>
                <Bar className="h-[22px] w-[110px] flex-none rounded-[7px]" i={i + 6} />
                <Bar className="hidden h-[13px] w-[56px] flex-none md:block" i={i + 7} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

/** One placeholder bar. `--i` offsets its breathing, so the page does not blink in unison. */
function Bar({ className, i = 0 }: { className: string; i?: number }) {
  return <span aria-hidden style={{ "--i": i } as React.CSSProperties} className={`skeleton-bar block rounded ${className}`} />;
}
