/**
 * One credit, drawn. In the brand blue rather than gold: gold in this interface means withheld,
 * and a credit is not withheld from anyone — it is simply the currency.
 */
export function Coin({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={`flex-none text-brand ${className}`}>
      {/* Rim, face, then the C struck into it — the same letter as the mark in the sidebar. */}
      <circle cx="12" cy="12" r="10.5" fill="currentColor" opacity="0.22" />
      <circle cx="12" cy="12" r="8.75" fill="currentColor" />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="var(--surface)" strokeOpacity="0.35" strokeWidth="0.9" />
      <path
        d="M14.6 9.5a3.4 3.4 0 1 0 0 5"
        fill="none"
        stroke="var(--surface)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
