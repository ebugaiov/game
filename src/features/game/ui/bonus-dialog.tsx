"use client";

import { Star, X } from "lucide-react";
import type { AnswerResult, PendingTurn, PlayerSnapshot } from "../schemas";
import { Modal } from "./modal";
import { strings } from "./strings";

type BonusDialogProps = {
  open: boolean;
  turn: PendingTurn | null;
  player: PlayerSnapshot | null;
  result: AnswerResult | null;
  busy: boolean;
  onAnswer: (optionId: string) => void;
  onNext: () => void;
  onClose: () => void;
};

export function BonusDialog({
  open,
  turn,
  player,
  result,
  busy,
  onAnswer,
  onNext,
  onClose,
}: BonusDialogProps) {
  if (!turn) return null;

  return (
    <Modal
      open={open}
      onClose={result ? onNext : onClose}
      dismissible
      labelledBy="bonus-dialog-title"
      className="max-w-2xl border-amber-500/60"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <span className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
            <Star className="h-3.5 w-3.5" aria-hidden />
            {strings.game.bonusTitle}
          </span>
          <button
            type="button"
            onClick={result ? onNext : onClose}
            aria-label={strings.game.closeBonus}
            className="text-lg font-bold text-slate-400 transition hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase text-amber-400">
            {strings.game.bonusFor(player?.name ?? "")}
          </span>
          <p
            id="bonus-dialog-title"
            className="text-base font-black leading-relaxed text-white sm:text-lg"
          >
            {turn.question.prompt}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase text-amber-400">{strings.game.bonusChoose}</h4>
          <div className="grid grid-cols-1 gap-2.5">
            {turn.question.options.map((option) => {
              const correct = result?.correctOptionId === option.id;
              const stateClass = result
                ? correct
                  ? "border-emerald-500 bg-emerald-950/90 text-emerald-200"
                  : "border-amber-500/30 bg-amber-950/40 text-amber-200/70"
                : "border-amber-500/50 bg-amber-950/60 text-amber-200 hover:bg-amber-900/80";

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onAnswer(option.id)}
                  disabled={busy || result !== null}
                  className={`w-full rounded-xl border p-3 text-left text-xs font-medium transition disabled:cursor-not-allowed ${stateClass}`}
                >
                  {option.text}
                </button>
              );
            })}
          </div>
        </div>

        {result ? (
          <div
            role="status"
            className={`rounded-xl border p-3 text-center text-xs font-bold ${
              result.isCorrect
                ? "border-emerald-500 bg-emerald-950 text-emerald-300"
                : "border-rose-500 bg-rose-950 text-rose-300"
            }`}
          >
            {result.isCorrect ? strings.game.bonusCorrect : strings.game.bonusWrong}
          </div>
        ) : null}

        {result ? (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:from-amber-400 hover:to-orange-400"
            >
              {strings.game.continueGame}
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
