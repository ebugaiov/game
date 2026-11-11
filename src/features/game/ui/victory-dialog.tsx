"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import type { PlayerSnapshot } from "../schemas";
import { pickWinner } from "../domain/end";
import { buttonStyles } from "./button";
import { Modal } from "./modal";
import { playerColor, playerEmoji } from "./palette";
import { strings } from "./strings";

type VictoryDialogProps = {
  open: boolean;
  players: PlayerSnapshot[];
};

export function VictoryDialog({ open, players }: VictoryDialogProps) {
  if (players.length === 0) return null;

  const winner = pickWinner(players);
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <Modal
      open={open}
      dismissible={false}
      labelledBy="victory-dialog-title"
      className="max-w-2xl border-gold-600/50 text-center"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold-600 bg-gold-500 text-ink-900 shadow-[0_18px_45px_-20px_rgba(229,174,60,0.9)]">
          <Crown className="h-9 w-9" aria-hidden />
        </div>

        <div>
          <h2
            id="victory-dialog-title"
            className="text-balance font-display text-3xl font-bold leading-tight text-ink-100 sm:text-4xl"
          >
            {strings.victory.title(winner.name)}
          </h2>
          <p className="mt-2 text-sm text-ink-400 sm:text-base">
            {strings.victory.subtitle(winner.score)}
          </p>
        </div>

        <div className="my-2 grid max-h-60 w-full grid-cols-1 gap-2.5 overflow-y-auto sm:grid-cols-3">
          {sorted.map((player, index) => {
            const color = playerColor(player.seat);
            return (
              <div
                key={player.id}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-900/70 p-3"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">
                  {strings.victory.medal(index + 1)}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{playerEmoji(player.seat)}</span>
                  <h4 className="text-sm font-bold text-ink-100">{player.name}</h4>
                </div>
                <span className={`font-display text-lg font-bold ${color.text}`}>
                  {strings.victory.coins(player.score)}
                </span>
              </div>
            );
          })}
        </div>

        <Link
          href="/"
          className={`${buttonStyles("primary", "lg")} w-full font-display uppercase tracking-[0.14em]`}
        >
          {strings.victory.playAgain}
        </Link>
      </div>
    </Modal>
  );
}
