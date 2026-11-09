"use client";

import { useState } from "react";
import { PenLine, X } from "lucide-react";
import type { PlayerSnapshot } from "../schemas";
import { Modal } from "./modal";
import { strings } from "./strings";

type ScoreDialogProps = {
  open: boolean;
  players: PlayerSnapshot[];
  busy: boolean;
  error: string | null;
  onSave: (playerId: string, newScore: number) => void;
  onClose: () => void;
};

const MIN_SCORE = -10000;
const MAX_SCORE = 100000;

export function ScoreDialog({ open, players, busy, error, onSave, onClose }: ScoreDialogProps) {
  const firstPlayer = players[0];
  const [playerId, setPlayerId] = useState(firstPlayer?.id ?? "");
  const [score, setScore] = useState(firstPlayer ? String(firstPlayer.score) : "0");
  const [localError, setLocalError] = useState<string | null>(null);

  const selectPlayer = (nextId: string) => {
    setPlayerId(nextId);
    const player = players.find((entry) => entry.id === nextId);
    if (player) setScore(String(player.score));
  };

  const save = () => {
    const parsed = Number(score);
    if (!Number.isInteger(parsed) || parsed < MIN_SCORE || parsed > MAX_SCORE) {
      setLocalError(strings.scoreDialog.invalid);
      return;
    }
    setLocalError(null);
    onSave(playerId, parsed);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible
      labelledBy="score-dialog-title"
      className="max-w-md border-cyan-400/40"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <h3
            id="score-dialog-title"
            className="flex items-center gap-2 text-base font-bold text-white"
          >
            <PenLine className="h-4 w-4 text-cyan-400" aria-hidden />
            {strings.scoreDialog.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.common.close}
            className="text-lg font-bold text-slate-400 transition hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="score-player" className="text-xs font-semibold text-slate-300">
              {strings.scoreDialog.choosePlayer}
            </label>
            <select
              id="score-player"
              value={playerId}
              onChange={(event) => selectPlayer(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none transition focus:border-cyan-400"
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {strings.scoreDialog.playerOption(player.name, player.score)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="score-value" className="text-xs font-semibold text-slate-300">
              {strings.scoreDialog.newScore}
            </label>
            <input
              id="score-value"
              type="number"
              step={50}
              min={MIN_SCORE}
              max={MAX_SCORE}
              value={score}
              onChange={(event) => setScore(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none transition focus:border-cyan-400"
            />
          </div>
        </div>

        {localError || error ? (
          <p className="rounded-xl border border-rose-500/50 bg-rose-950/60 p-2.5 text-xs font-semibold text-rose-200">
            {localError ?? error}
          </p>
        ) : null}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="w-full rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white shadow transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {strings.scoreDialog.save}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700"
          >
            {strings.scoreDialog.cancel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
