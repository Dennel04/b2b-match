import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 py-10 sm:px-12 md:flex-row md:justify-between">
        <div className="max-w-[46ch]">
          <p className="font-medium">B2B Match</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
            What you write down stays with you. Vendors receive a summary, never your words, and
            only once both sides have agreed to meet.
          </p>
        </div>

        <nav className="flex gap-12 text-[13px]">
          <ul className="space-y-2">
            <li className="text-ink-faint">Product</li>
            <li><Link href="/" className="hover:text-accent">How it works</Link></li>
            <li><Link href="/problem" className="hover:text-accent">Your problems</Link></li>
          </ul>
          <ul className="space-y-2">
            <li className="text-ink-faint">Company</li>
            <li><Link href="/" className="hover:text-accent">Privacy</Link></li>
            <li><Link href="/" className="hover:text-accent">Contact</Link></li>
          </ul>
        </nav>
      </div>

      <div className="mx-auto w-full max-w-[1240px] px-4 pb-8 text-[12px] text-ink-faint sm:px-12">
        Tallinn, Estonia
      </div>
    </footer>
  );
}
