import type { PlayerSnapshot } from "../schemas";
import { playerColor, playerEmoji } from "./palette";
import { strings } from "./strings";

type LeaderboardProps = {
  players: PlayerSnapshot[];
  currentSeat: number;
};

export function Leaderboard({ players, currentSeat }: LeaderboardProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {players.map((player) => {
        const isCurrent = player.seat === currentSeat;
        const color = playerColor(player.seat);

        return (
          <div
            key={player.id}
            className={`flex items-center justify-between gap-2 rounded-lg border bg-ink-800 p-2.5 transition-colors ${
              isCurrent ? "border-periwinkle-400 ring-1 ring-periwinkle-400/40" : "border-ink-600"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-black text-ink-900 shadow-sm ${color.bg}`}
              >
                {playerEmoji(player.seat)}
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-xs font-bold text-ink-100">{player.name}</h4>
                <span
                  className={`block truncate text-[9px] font-semibold uppercase tracking-wider ${
                    isCurrent ? "text-periwinkle-300" : "text-ink-500"
                  }`}
                >
                  {isCurrent
                    ? `👉 ${strings.game.turnHere}`
                    : strings.game.tile(player.position + 1)}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className={`font-display text-base font-bold ${color.text}`}>
                {player.score}
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-wider text-ink-500">
                {strings.game.coins}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
