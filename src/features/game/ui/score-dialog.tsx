"use client";

import { useState } from "react";
import { PenLine, X } from "lucide-react";
import type { PlayerSnapshot } from "../schemas";
import { Button } from "./button";
import { Modal } from "./modal";
import { closeButtonClass, fieldClass, labelClass } from "./styles";
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
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-ink-600/80 pb-3">
          <h3
            id="score-dialog-title"
            className="flex items-center gap-2 font-display text-xl font-bold text-ink-100"
          >
            <PenLine className="h-4 w-4 text-periwinkle-300" aria-hidden />
            {strings.scoreDialog.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.common.close}
            className={closeButtonClass}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="score-player" className={labelClass}>
              {strings.scoreDialog.choosePlayer}
            </label>
            <select
              id="score-player"
              value={playerId}
              onChange={(event) => selectPlayer(event.target.value)}
              className={fieldClass}
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {strings.scoreDialog.playerOption(player.name, player.score)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="score-value" className={labelClass}>
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
              className={fieldClass}
            />
          </div>
        </div>

        {localError || error ? (
          <p className="rounded-lg border border-danger-400/50 bg-danger-400/10 p-3 text-sm font-semibold text-danger-300">
            {localError ?? error}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button variant="primary" onClick={save} disabled={busy} className="w-full">
            {strings.scoreDialog.save}
          </Button>
          <Button variant="secondary" onClick={onClose} className="w-full">
            {strings.scoreDialog.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
