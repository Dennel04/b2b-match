import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="7" stroke="var(--accent)" strokeWidth="1.75" />
        <circle cx="15" cy="15" r="7" stroke="var(--seal)" strokeWidth="1.75" />
      </svg>
      <span className="font-serif text-[19px] font-semibold text-ink">B2B Match</span>
    </Link>
  );
}
