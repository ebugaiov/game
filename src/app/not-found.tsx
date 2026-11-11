import Link from "next/link";
import { AppLogo } from "@/features/game/ui/app-logo";
import { buttonStyles } from "@/features/game/ui/button";
import { PageShell } from "@/features/game/ui/page-shell";
import { strings } from "@/features/game/ui/strings";

export default function NotFound() {
  return (
    <PageShell maxWidth="max-w-md">
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
        <AppLogo className="mb-5 h-16 w-16" />
        <h1 className="font-display text-2xl font-bold text-ink-100">
          {strings.common.gameNotFound}
        </h1>
        <Link href="/" className={`${buttonStyles("primary", "md")} mt-6`}>
          {strings.history.backHome}
        </Link>
      </div>
    </PageShell>
  );
}
