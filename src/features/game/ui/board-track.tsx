import { RULES } from "../domain/rules";
import type { CategoryDto, PlayerSnapshot } from "../schemas";
import { playerColor, playerEmoji } from "./palette";

type BoardTrackProps = {
  categories: CategoryDto[];
  players: PlayerSnapshot[];
};

export function BoardTrack({ categories, players }: BoardTrackProps) {
  if (categories.length === 0) return null;

  const tiles = Array.from(
    { length: RULES.boardTiles },
    (_, index) => categories[index % categories.length]!,
  );

  return (
    <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-slate-800 bg-slate-950/70 p-2.5 sm:grid-cols-10">
      {tiles.map((category, index) => {
        const playersOnTile = players.filter(
          (player) =>
            ((player.position % RULES.boardTiles) + RULES.boardTiles) % RULES.boardTiles === index,
        );

        return (
          <div
            key={index}
            className="relative flex h-14 flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-1 transition hover:border-slate-700 sm:h-16"
          >
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
              <span>#{index + 1}</span>
              <span>{category.icon}</span>
            </div>
            <div className="truncate text-[8px] font-extrabold" style={{ color: category.color }}>
              {category.name}
            </div>
            <div className="flex min-h-[14px] flex-wrap items-center justify-center gap-0.5">
              {playersOnTile.map((player) => (
                <span
                  key={player.id}
                  title={player.name}
                  className={`flex h-4 w-4 items-center justify-center rounded-full border border-slate-950 text-[9px] font-black text-slate-950 shadow-md ${playerColor(player.seat).bg}`}
                >
                  {playerEmoji(player.seat)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
