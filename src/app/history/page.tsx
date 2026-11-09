import { RULES } from "@/features/game/domain/rules";
import { listGames } from "@/features/game/server/list-games";
import { FlagBackground } from "@/features/game/ui/flag-background";
import { strings } from "@/features/game/ui/strings";
import Link from "next/link";
import { ArrowRight, History, Home, Trophy, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: strings.metadata.historyTitle,
};

const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function HistoryPage() {
  const games = await listGames({ limit: 20 });

  return (
    <div className="relative flex min-h-screen flex-col p-2 text-slate-100 sm:p-4 md:p-6">
      <FlagBackground />

      <header className="glass-panel mx-auto mb-4 flex w-full max-w-5xl flex-col items-center justify-between gap-3 rounded-2xl p-3.5 shadow-2xl sm:flex-row sm:p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-amber-400 to-yellow-400 text-2xl shadow-lg glow-yellow">
            ⚙️
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-yellow-300 via-amber-200 to-cyan-300 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
              {strings.appName}
            </h1>
            <p className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <span>{strings.tagline}</span>
              <span className="rounded-full border border-cyan-500/40 bg-cyan-950 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                {strings.standardBadge}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-yellow-400/50 bg-yellow-500/30 px-3.5 py-2 text-xs font-semibold text-yellow-200 transition hover:bg-yellow-500/50"
          >
            <Home className="h-4 w-4" aria-hidden />
            {strings.history.start}
          </Link>
        </div>
      </header>

      <main className="glass-panel mx-auto w-full max-w-5xl rounded-3xl p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-700/60 pb-3">
          <History className="h-5 w-5 text-cyan-300" aria-hidden />
          <div>
            <h2 className="text-lg font-black text-slate-100">{strings.history.title}</h2>
            <p className="text-xs text-slate-300">{strings.history.subtitle}</p>
          </div>
        </div>

        {games.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Trophy className="h-10 w-10 text-slate-500" aria-hidden />
            <p className="text-sm text-slate-300">{strings.history.empty}</p>
            <Link
              href="/"
              className="rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg transition hover:from-yellow-400 hover:to-amber-400"
            >
              {strings.history.start}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-2 py-2 font-bold">{strings.history.columns.started}</th>
                  <th className="px-2 py-2 font-bold">{strings.history.columns.status}</th>
                  <th className="px-2 py-2 font-bold">{strings.history.columns.round}</th>
                  <th className="px-2 py-2 font-bold">{strings.history.columns.players}</th>
                  <th className="px-2 py-2 font-bold">{strings.history.columns.winner}</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr
                    key={game.id}
                    className="border-t border-slate-800 transition hover:bg-slate-800/50"
                  >
                    <td className="px-2 py-3 font-mono text-[11px] text-slate-300">
                      {dateFormatter.format(new Date(game.startedAt))}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          game.status === "finished"
                            ? "border-slate-600 bg-slate-800 text-slate-300"
                            : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        }`}
                      >
                        {strings.history.status[game.status]}
                      </span>
                    </td>
                    <td className="px-2 py-3 font-bold text-yellow-300">
                      {Math.min(game.round, RULES.maxRounds)}
                    </td>
                    <td className="px-2 py-3 text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" aria-hidden />
                        {strings.history.playerCount(game.playerCount)}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      {game.winner ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-100">
                          <Trophy className="h-3.5 w-3.5 text-yellow-400" aria-hidden />
                          {game.winner.name}
                          <span className="font-mono text-[10px] text-amber-400">
                            {game.winner.score}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-500">{strings.history.noWinner}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link
                        href={`/games/${game.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-600/20 px-2.5 py-1.5 text-[10px] font-bold text-cyan-200 transition hover:bg-cyan-600/40"
                      >
                        {strings.history.open}
                        <ArrowRight className="h-3 w-3" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
