import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex w-full items-center justify-between px-4 py-5 sm:px-12 sm:py-[26px]">
      <Logo />
      <div className="flex items-center gap-3">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
