/**
 * 60px bar above the content. Left: where you are and the control acting on that state.
 * Right: page-level controls, the privacy marker, the avatar.
 */
export function TopBar({
  left,
  right,
  initials,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  initials?: string;
}) {
  return (
    <header className="flex h-[60px] flex-none items-center gap-3 border-b border-line bg-surface px-4 sm:px-8">
      {left}
      <div className="ml-auto flex items-center gap-3">
        {right}
        <span className="hidden text-[12px] text-ink-soft sm:inline">Private to you</span>
        {initials && (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] font-semibold text-bg">
            {initials}
          </span>
        )}
      </div>
    </header>
  );
}
