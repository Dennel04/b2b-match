/** One row. This is a working screen, not a landing page. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-5 px-4 py-4 text-[12px] sm:px-8">
        <span className="text-ink-faint">B2B Match — Tallinn</span>
        <span className="ml-auto flex gap-4 text-ink-soft">
          <span>Privacy</span>
          <span>Security</span>
          <span>Help</span>
        </span>
      </div>
    </footer>
  );
}
