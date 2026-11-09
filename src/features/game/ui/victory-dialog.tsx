"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import type { PlayerSnapshot } from "../schemas";
import { pickWinner } from "../domain/end";
import { playerColor, playerEmoji } from "./palette";
import { Modal } from "./modal";
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
      className="max-w-2xl border-yellow-400/50 text-center"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 to-amber-600 text-4xl shadow-xl glow-yellow animate-bounce">
          <Crown className="h-10 w-10 text-slate-950" aria-hidden />
        </div>

        <div>
          <h2
            id="victory-dialog-title"
            className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-2xl font-black text-transparent sm:text-3xl"
          >
            {strings.victory.title(winner.name)}
          </h2>
          <p className="mt-1 text-xs text-slate-300 sm:text-sm">
            {strings.victory.subtitle(winner.score)}
          </p>
        </div>

        <div className="my-2 grid max-h-60 w-full grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-3">
          {sorted.map((player, index) => {
            const color = playerColor(player.seat);
            return (
              <div
                key={player.id}
                className="glass-card flex flex-col items-center gap-1.5 rounded-2xl border border-slate-700 p-3"
              >
                <span className="text-xs font-black text-yellow-400">
                  {strings.victory.medal(index + 1)}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{playerEmoji(player.seat)}</span>
                  <h4 className="text-sm font-extrabold text-slate-100">{player.name}</h4>
                </div>
                <span className={`text-lg font-black ${color.text}`}>
                  {strings.victory.coins(player.score)}
                </span>
              </div>
            );
          })}
        </div>

        <Link
          href="/"
          className="w-full rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 py-4 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl transition hover:from-yellow-400 hover:to-amber-400 glow-yellow"
        >
          {strings.victory.playAgain}
        </Link>
      </div>
    </Modal>
  );
}
