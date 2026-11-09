"use client";

import { CheckCircle2, Lightbulb, Sparkles } from "lucide-react";
import { BASE_POINTS } from "../domain/rules";
import type { AnswerResult, CategoryDto, PendingTurn, PlayerSnapshot } from "../schemas";
import { DIFFICULTY_STYLES, playerColor, playerEmoji } from "./palette";
import { Modal } from "./modal";
import { difficultyLabel, strings } from "./strings";

type QuestionDialogProps = {
  open: boolean;
  turn: PendingTurn | null;
  category: CategoryDto | null;
  player: PlayerSnapshot | null;
  result: AnswerResult | null;
  selectedOptionId: string | null;
  busy: boolean;
  onFiftyFifty: () => void;
  onAnswer: (optionId: string) => void;
  onNext: () => void;
};

const LETTERS = ["A", "B", "C", "D"];

const OPTION_BASE =
  "option-btn flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-xs font-medium transition sm:text-sm";

export function QuestionDialog({
  open,
  turn,
  category,
  player,
  result,
  selectedOptionId,
  busy,
  onFiftyFifty,
  onAnswer,
  onNext,
}: QuestionDialogProps) {
  if (!turn) return null;

  const question = turn.question;
  const hiddenIds = new Set(turn.hiddenOptionIds);
  const fiftyFiftyUsed = turn.hiddenOptionIds.length > 0;
  const points = BASE_POINTS[question.difficulty];

  return (
    <Modal
      open={open}
      onClose={onNext}
      dismissible={result !== null}
      labelledBy="question-dialog-title"
      className="max-w-2xl border-yellow-500/40"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider"
              style={
                category
                  ? {
                      backgroundColor: `${category.color}25`,
                      color: category.color,
                      borderColor: `${category.color}60`,
                    }
                  : undefined
              }
            >
              {category ? `${category.icon} ${category.name}` : strings.game.categoryBadgeFallback}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${DIFFICULTY_STYLES[question.difficulty]}`}
            >
              {difficultyLabel(question.difficulty)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFiftyFifty}
              disabled={fiftyFiftyUsed || result !== null || busy}
              className="flex items-center gap-1 rounded-xl border border-purple-400/50 bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 text-xs font-extrabold text-white shadow transition hover:from-purple-500 hover:to-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {fiftyFiftyUsed ? strings.game.fiftyFiftyUsed : strings.game.fiftyFifty}
            </button>
            <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
              {fiftyFiftyUsed ? strings.game.fiftyFiftyPoints : strings.game.points(points)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-yellow-400/50 bg-slate-900 p-2.5">
          <div className="flex items-center gap-2">
            {player ? (
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-black text-slate-950 ${playerColor(player.seat).bg}`}
              >
                {playerEmoji(player.seat)}
              </span>
            ) : null}
            <span className="text-xs font-bold uppercase tracking-wide text-yellow-300">
              {strings.game.currentPlayerLabel} {player?.name ?? ""}
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-amber-400">
            {player ? `${player.score} ${strings.game.coinsWithIcon}` : ""}
          </span>
        </div>

        <div>
          <h3
            id="question-dialog-title"
            className="mb-2 text-base font-bold leading-snug text-slate-100 sm:text-lg"
          >
            {question.prompt}
          </h3>
          <p className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-xs font-medium text-yellow-200/90">
            {strings.game.chooseOption}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {question.options.map((option) => {
            const hidden = hiddenIds.has(option.id);
            const isCorrectOption = result?.correctOptionId === option.id;
            const isSelected = selectedOptionId === option.id;

            let stateClass =
              "border-slate-800 bg-slate-900 text-slate-100 hover:border-yellow-400/60 hover:bg-slate-800/80";

            if (hidden && !result) {
              stateClass = "invisible border-slate-800 bg-slate-900 text-slate-100";
            } else if (result) {
              if (isCorrectOption) {
                stateClass =
                  "border-2 border-emerald-400 bg-emerald-950/90 font-bold text-emerald-200 shadow-lg ring-2 ring-emerald-400";
              } else if (isSelected) {
                stateClass =
                  "border-2 border-rose-400 bg-rose-950/90 font-medium text-rose-200 opacity-80";
              } else {
                stateClass = "border-slate-800 bg-slate-900 text-slate-100 opacity-60";
              }
            }

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onAnswer(option.id)}
                disabled={busy || result !== null || hidden}
                className={`${OPTION_BASE} ${stateClass}`}
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-yellow-300">
                  {LETTERS[option.position] ?? option.position + 1}
                </span>
                <span className="flex-1 leading-snug">{option.text}</span>
                {result && isCorrectOption ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-300" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>

        {result ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-indigo-400/50 bg-indigo-950/90 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Lightbulb className="h-4 w-4" aria-hidden />
              {strings.game.explanationTitle}
            </div>
            <p className="text-xs leading-relaxed text-slate-200 sm:text-sm">
              {result.explanation}
            </p>
          </div>
        ) : null}

        {result ? (
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:from-emerald-400 hover:to-teal-500 active:scale-95 sm:text-sm"
            >
              {strings.game.nextPlayer}
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
