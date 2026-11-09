import type { PlayerSnapshot } from "../schemas";
import { playerColor, playerEmoji } from "./palette";
import { strings } from "./strings";

type LeaderboardProps = {
  players: PlayerSnapshot[];
  currentSeat: number;
};

export function Leaderboard({ players, currentSeat }: LeaderboardProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {players.map((player) => {
        const isCurrent = player.seat === currentSeat;
        const color = playerColor(player.seat);

        return (
          <div
            key={player.id}
            className={`glass-card flex items-center justify-between rounded-2xl border p-2.5 transition duration-200 ${
              isCurrent
                ? "active-turn-pulse border-yellow-400 bg-slate-800/90 ring-2 ring-yellow-400/50 glow-yellow"
                : "border-slate-800"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-black text-slate-950 shadow-md ${color.bg}`}
              >
                {playerEmoji(player.seat)}
              </div>
              <div className="truncate">
                <h4 className="flex items-center gap-1 truncate text-xs font-extrabold text-slate-100">
                  {player.name}
                </h4>
                <span
                  className={`block text-[9px] ${
                    isCurrent ? "font-black text-yellow-300" : "text-slate-400"
                  }`}
                >
                  {isCurrent
                    ? `👉 ${strings.game.turnHere}`
                    : strings.game.tile(player.position + 1)}
                </span>
              </div>
            </div>
            <div className="ml-1 flex-shrink-0 text-right">
              <span className={`text-sm font-black ${color.text}`}>{player.score}</span>
              <span className="block text-[9px] font-semibold text-slate-400">
                {strings.game.coins}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
