import Link from 'next/link';
import { VARIANTS } from './_data';

export const metadata = { title: 'Design lab — B2B Match' };

export default function LabIndex() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 font-sans text-ink">
      <h1 className="text-2xl font-semibold">Dashboard, seven ways (F family)</h1>
      <p className="mt-2 text-ink-soft">
        Same data on every page. Each variant follows one design skill. Pick the one to roll out.
      </p>
      <ol className="mt-10 divide-y divide-line border-y border-line">
        {VARIANTS.map((v) => (
          <li key={v.slug}>
            <Link href={`/lab/${v.slug}`} className="flex items-baseline gap-4 py-4 hover:bg-surface-alt">
              <span className="w-6 font-mono text-sm uppercase text-ink-faint">{v.slug}</span>
              <span className="flex-1">
                <span className="font-medium">{v.skill}</span>
                <span className="text-ink-faint"> from {v.source}</span>
                <span className="block text-sm text-ink-soft">{v.idea}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
