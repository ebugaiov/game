import Link from "next/link";
import type { ReactNode } from "react";
import { AppLogo } from "./app-logo";
import { BlueprintBackground } from "./blueprint-background";
import { strings } from "./strings";

type PageShellProps = {
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
};

export function PageShell({ actions, children, maxWidth = "max-w-7xl" }: PageShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <BlueprintBackground />

      <header className="sticky top-0 z-30 border-b border-ink-600/80 bg-ink-750/90 backdrop-blur-md">
        <div
          className={`mx-auto flex w-full items-center justify-between gap-3 px-3 py-2.5 sm:px-6 ${maxWidth}`}
        >
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-periwinkle-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-750"
          >
            <AppLogo className="h-9 w-9" />
            <span className="hidden min-w-0 flex-col sm:flex">
              <span className="truncate font-display text-base font-bold leading-tight text-ink-100 transition-colors group-hover:text-gold-300">
                {strings.appName}
              </span>
              <span className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-ink-400">
                {strings.tagline}
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">{actions}</div>
        </div>
      </header>

      <main className={`mx-auto flex w-full flex-1 flex-col px-3 py-5 sm:px-6 sm:py-8 ${maxWidth}`}>
        {children}
      </main>
    </div>
  );
}
