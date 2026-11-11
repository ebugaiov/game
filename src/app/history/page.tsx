import { RULES } from "@/features/game/domain/rules";
import { listGames } from "@/features/game/server/list-games";
import { buttonStyles } from "@/features/game/ui/button";
import { PageShell } from "@/features/game/ui/page-shell";
import { panelClass } from "@/features/game/ui/styles";
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
    <PageShell
      maxWidth="max-w-5xl"
      actions={
        <Link href="/" className={buttonStyles("primary", "sm")}>
          <Home className="h-4 w-4" aria-hidden />
          {strings.history.start}
        </Link>
      }
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-ink-600 bg-ink-700 text-gold-300">
          <History className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-100 sm:text-3xl">
            {strings.history.title}
          </h1>
          <p className="text-sm text-ink-400">{strings.history.subtitle}</p>
        </div>
      </div>

      <section className={`${panelClass} p-4 sm:p-6`}>
        {games.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Trophy className="h-10 w-10 text-ink-500" aria-hidden />
            <p className="text-sm text-ink-400">{strings.history.empty}</p>
            <Link href="/" className={buttonStyles("primary", "md")}>
              {strings.history.start}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
                  <th className="px-2 py-2.5 font-bold">{strings.history.columns.started}</th>
                  <th className="px-2 py-2.5 font-bold">{strings.history.columns.status}</th>
                  <th className="px-2 py-2.5 font-bold">{strings.history.columns.round}</th>
                  <th className="px-2 py-2.5 font-bold">{strings.history.columns.players}</th>
                  <th className="px-2 py-2.5 font-bold">{strings.history.columns.winner}</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr
                    key={game.id}
                    className="border-t border-ink-600/70 transition-colors hover:bg-ink-700/40"
                  >
                    <td className="px-2 py-3 font-mono text-xs text-ink-400">
                      {dateFormatter.format(new Date(game.startedAt))}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          game.status === "finished"
                            ? "border-ink-550 bg-ink-700 text-ink-300"
                            : "border-success-400/40 bg-success-400/10 text-success-300"
                        }`}
                      >
                        {strings.history.status[game.status]}
                      </span>
                    </td>
                    <td className="px-2 py-3 font-display text-base font-bold text-gold-300">
                      {Math.min(game.round, RULES.maxRounds)}
                    </td>
                    <td className="px-2 py-3 text-ink-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {strings.history.playerCount(game.playerCount)}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      {game.winner ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-ink-100">
                          <Trophy className="h-3.5 w-3.5 text-gold-300" aria-hidden />
                          {game.winner.name}
                          <span className="font-mono text-[11px] text-gold-300">
                            {game.winner.score}
                          </span>
                        </span>
                      ) : (
                        <span className="text-ink-500">{strings.history.noWinner}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link href={`/games/${game.id}`} className={buttonStyles("outline", "sm")}>
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
      </section>
    </PageShell>
  );
}
