"use client";

import { Star, X } from "lucide-react";
import type { AnswerResult, PendingTurn, PlayerSnapshot } from "../schemas";
import { Button } from "./button";
import { Modal } from "./modal";
import { closeButtonClass } from "./styles";
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
      className="max-w-2xl border-gold-600/50"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-gold-600/30 pb-3">
          <span className="flex items-center gap-1.5 rounded-full border border-gold-600/40 bg-gold-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">
            <Star className="h-3.5 w-3.5" aria-hidden />
            {strings.game.bonusTitle}
          </span>
          <button
            type="button"
            onClick={result ? onNext : onClose}
            aria-label={strings.game.closeBonus}
            className={closeButtonClass}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-2">
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">
            {strings.game.bonusFor(player?.name ?? "")}
          </span>
          <p
            id="bonus-dialog-title"
            className="font-display text-xl font-bold leading-snug text-ink-100 sm:text-2xl"
          >
            {turn.question.prompt}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
            {strings.game.bonusChoose}
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {turn.question.options.map((option) => {
              const correct = result?.correctOptionId === option.id;
              const stateClass = result
                ? correct
                  ? "border-success-400 bg-success-400/10 text-success-300"
                  : "border-ink-600 bg-ink-900 text-ink-300 opacity-55"
                : "border-ink-600 bg-ink-900 text-ink-200 hover:border-gold-500/60 hover:bg-ink-850";

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onAnswer(option.id)}
                  disabled={busy || result !== null}
                  className={`w-full rounded-lg border-2 p-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed ${stateClass}`}
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
            className={`rounded-lg border p-3 text-center text-sm font-bold ${
              result.isCorrect
                ? "border-success-400/50 bg-success-400/10 text-success-300"
                : "border-danger-400/50 bg-danger-400/10 text-danger-300"
            }`}
          >
            {result.isCorrect ? strings.game.bonusCorrect : strings.game.bonusWrong}
          </div>
        ) : null}

        {result ? (
          <div className="flex justify-end pt-1">
            <Button
              variant="primary"
              onClick={onNext}
              className="font-display uppercase tracking-[0.12em]"
            >
              {strings.game.continueGame}
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
