import Link from "next/link";

/** The mark and the wordmark: "Cross" heavy, "desk" light — two halves of one name. */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG mark, nothing to optimise */}
      <img src="/crossdesk-icon.svg" alt="" width={40} height={40} className="h-10 w-10" />
      <span className="text-[20px] tracking-[-0.02em] text-ink">
        <span className="font-extrabold">Cross</span>
        <span className="font-normal">desk</span>
      </span>
    </Link>
  );
}
