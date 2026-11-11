import { RULES } from "../domain/rules";
import type { CategoryDto, PlayerSnapshot } from "../schemas";
import { categoryColor, playerColor, playerEmoji } from "./palette";

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
    <div className="grid grid-cols-4 gap-1.5 rounded-lg border border-ink-600 bg-ink-900/70 p-2.5 sm:grid-cols-10">
      {tiles.map((category, index) => {
        const playersOnTile = players.filter(
          (player) =>
            ((player.position % RULES.boardTiles) + RULES.boardTiles) % RULES.boardTiles === index,
        );
        const color = categoryColor(category);

        return (
          <div
            key={index}
            className="relative flex h-14 flex-col justify-between rounded-md border border-ink-600 bg-ink-800 p-1 transition-colors hover:border-ink-550 sm:h-16"
          >
            <div className="flex items-center justify-between text-[9px] font-bold text-ink-500">
              <span>#{index + 1}</span>
              <span>{category.icon}</span>
            </div>
            <div className="truncate text-[8px] font-bold" style={{ color }}>
              {category.name}
            </div>
            <div className="flex min-h-[14px] flex-wrap items-center justify-center gap-0.5">
              {playersOnTile.map((player) => (
                <span
                  key={player.id}
                  title={player.name}
                  className={`flex h-4 w-4 items-center justify-center rounded-full border border-ink-950 text-[9px] font-black text-ink-900 shadow-sm ${playerColor(player.seat).bg}`}
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
