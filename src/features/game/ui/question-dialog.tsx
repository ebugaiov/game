"use client";

import { CheckCircle2, Lightbulb, Sparkles } from "lucide-react";
import { BASE_POINTS } from "../domain/rules";
import type { AnswerResult, CategoryDto, PendingTurn, PlayerSnapshot } from "../schemas";
import { Button } from "./button";
import { Modal } from "./modal";
import { categoryColor, DIFFICULTY_STYLES, playerColor, playerEmoji } from "./palette";
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
  "flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left text-sm font-medium transition-colors";

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
  const accent = category ? categoryColor(category) : null;

  return (
    <Modal
      open={open}
      onClose={onNext}
      dismissible={result !== null}
      labelledBy="question-dialog-title"
      className="max-w-2xl border-gold-600/40"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-600/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={
                accent
                  ? {
                      backgroundColor: `${accent}1f`,
                      color: accent,
                      borderColor: `${accent}66`,
                    }
                  : undefined
              }
            >
              {category ? `${category.icon} ${category.name}` : strings.game.categoryBadgeFallback}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${DIFFICULTY_STYLES[question.difficulty]}`}
            >
              {difficultyLabel(question.difficulty)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="periwinkle"
              size="sm"
              onClick={onFiftyFifty}
              disabled={fiftyFiftyUsed || result !== null || busy}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {fiftyFiftyUsed ? strings.game.fiftyFiftyUsed : strings.game.fiftyFifty}
            </Button>
            <span className="rounded-full border border-gold-600/40 bg-gold-500/10 px-2.5 py-1 text-xs font-bold text-gold-300">
              {fiftyFiftyUsed ? strings.game.fiftyFiftyPoints : strings.game.points(points)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-lg border border-ink-600 bg-ink-700 p-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {player ? (
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-black text-ink-900 ${playerColor(player.seat).bg}`}
              >
                {playerEmoji(player.seat)}
              </span>
            ) : null}
            <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-ink-300">
              {strings.game.currentPlayerLabel} {player?.name ?? ""}
            </span>
          </div>
          <span className="shrink-0 font-mono text-xs font-bold text-gold-300">
            {player ? `${player.score} ${strings.game.coinsWithIcon}` : ""}
          </span>
        </div>

        <div>
          <h3
            id="question-dialog-title"
            className="mb-2 font-display text-xl font-bold leading-snug text-ink-100 sm:text-2xl"
          >
            {question.prompt}
          </h3>
          <p className="border-l-2 border-periwinkle-400/60 pl-3 text-sm font-medium text-ink-400">
            {strings.game.chooseOption}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {question.options.map((option) => {
            const hidden = hiddenIds.has(option.id);
            const isCorrectOption = result?.correctOptionId === option.id;
            const isSelected = selectedOptionId === option.id;

            let stateClass =
              "border-ink-600 bg-ink-900 text-ink-200 hover:border-periwinkle-400/60 hover:bg-ink-850";

            if (hidden && !result) {
              stateClass = "invisible border-ink-600 bg-ink-900 text-ink-200";
            } else if (result) {
              if (isCorrectOption) {
                stateClass =
                  "border-success-400 bg-success-400/10 font-bold text-success-300 shadow-[0_0_0_1px_rgba(87,242,135,0.35)]";
              } else if (isSelected) {
                stateClass = "border-danger-400 bg-danger-400/10 font-medium text-danger-300";
              } else {
                stateClass = "border-ink-600 bg-ink-900 text-ink-200 opacity-55";
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
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ink-550 bg-ink-700 text-xs font-bold text-periwinkle-300">
                  {LETTERS[option.position] ?? option.position + 1}
                </span>
                <span className="flex-1 leading-snug">{option.text}</span>
                {result && isCorrectOption ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success-300" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>

        {result ? (
          <div className="rounded-lg border-l-4 border-periwinkle-400 bg-periwinkle-400/5 p-4">
            <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-periwinkle-300">
              <Lightbulb className="h-4 w-4" aria-hidden />
              {strings.game.explanationTitle}
            </div>
            <p className="text-sm leading-relaxed text-ink-200">{result.explanation}</p>
          </div>
        ) : null}

        {result ? (
          <div className="flex items-center justify-end pt-1">
            <Button
              variant="primary"
              onClick={onNext}
              className="font-display uppercase tracking-[0.12em]"
            >
              {strings.game.nextPlayer}
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
