import Link from "next/link";
import { AppLogo } from "@/features/game/ui/app-logo";
import { FlagBackground } from "@/features/game/ui/flag-background";
import { strings } from "@/features/game/ui/strings";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 text-slate-100">
      <FlagBackground />
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 text-center">
        <AppLogo className="mx-auto mb-4 h-16 w-16" />
        <h1 className="text-xl font-black text-yellow-300">{strings.common.gameNotFound}</h1>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg transition hover:from-yellow-400 hover:to-amber-400"
        >
          {strings.history.backHome}
        </Link>
      </div>
    </div>
  );
}
