import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG mark, nothing to optimise */}
      <img src="/crossdesk-icon.svg" alt="" width={24} height={24} className="h-6 w-6" />
      <span className="text-[19px] font-bold tracking-[-0.02em] text-ink">Crossdesk</span>
    </Link>
  );
}
