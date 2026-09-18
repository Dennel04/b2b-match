'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VARIANTS } from './_data';

/** Floating bar to flip between design variants. Deliberately neutral so it biases none of them. */
export function Switcher() {
  const path = usePathname();
  const current = VARIANTS.find((v) => path.endsWith(`/lab/${v.slug}`));

  return (
    <nav
      aria-label="Design variants"
      className="fixed bottom-4 left-1/2 z-[100] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-lg border border-black/15 bg-white/95 p-1 font-mono text-[12px] text-neutral-800 shadow-[0_4px_20px_rgba(0,0,0,0.18)]"
    >
      <Link href="/lab" className="px-2.5 py-1.5 text-neutral-500 hover:text-neutral-900">
        Lab
      </Link>
      {VARIANTS.map((v) => (
        <Link
          key={v.slug}
          href={`/lab/${v.slug}`}
          title={v.skill}
          aria-current={current?.slug === v.slug ? 'page' : undefined}
          className={`rounded-md px-2.5 py-1.5 uppercase ${
            current?.slug === v.slug ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'
          }`}
        >
          {v.slug}
        </Link>
      ))}
      {current && <span className="whitespace-nowrap px-2.5 text-neutral-500">{current.skill}</span>}
    </nav>
  );
}
