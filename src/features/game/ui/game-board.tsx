"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  BookPlus,
  Clock,
  History,
  Maximize,
  Minimize,
  PenLine,
  Settings,
  Star,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import * as api from "../api-client";
import { ApiError } from "../api-client";
import { RULES } from "../domain/rules";
import type { AnswerResult, CategoryDto, GameSnapshot, PendingTurn } from "../schemas";
import { BoardTrack } from "./board-track";
import { BonusDialog } from "./bonus-dialog";
import { Button, buttonStyles } from "./button";
import { Confetti } from "./confetti";
import { Leaderboard } from "./leaderboard";
import { PageShell } from "./page-shell";
import { categoryColor, playerColor, playerEmoji } from "./palette";
import { QuestionDialog } from "./question-dialog";
import { RulesDialog } from "./rules-dialog";
import { ScoreDialog } from "./score-dialog";
import { badgeClass, panelClass, panelRaisedClass } from "./styles";
import { difficultyLabel, strings } from "./strings";
import { useCountdown } from "./use-countdown";
import { useFullscreen } from "./use-fullscreen";
import { useSound } from "./use-sound";
import { VictoryDialog } from "./victory-dialog";
import { Wheel } from "./wheel";

type GameBoardProps = {
  initialSnapshot: GameSnapshot;
  categories: CategoryDto[];
};

export function GameBoard({ initialSnapshot, categories }: GameBoardProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [answeredTurn, setAnsweredTurn] = useState<PendingTurn | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [dismissedBonusId, setDismissedBonusId] = useState<string | null>(null);

  const sound = useSound();
  const fullscreen = useFullscreen();
  const victorySoundPlayed = useRef(false);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const currentPlayer =
    snapshot.players.find((player) => player.seat === snapshot.currentSeat) ??
    snapshot.players[0] ??
    null;

  const isFinished = snapshot.status === "finished";
  const pendingTurn = snapshot.pendingTurn;

  useEffect(() => {
    if (!isFinished || victorySoundPlayed.current) return;
    victorySoundPlayed.current = true;
    sound.play("victory");
  }, [isFinished, sound]);

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await api.getGame(snapshot.id));
    } catch (caught) {
      console.error(caught);
      setError(strings.common.genericError);
    }
  }, [snapshot.id]);

  const handleError = useCallback(
    async (caught: unknown) => {
      if (caught instanceof ApiError) {
        if (caught.code === "game_finished") {
          await refresh();
          return;
        }
        setError(caught.message || strings.common.genericError);
        return;
      }

      console.error(caught);
      setError(strings.common.genericError);
    },
    [refresh],
  );

  const run = useCallback(
    async <Result,>(action: () => Promise<Result>, onSuccess: (value: Result) => void) => {
      setBusy(true);
      setError(null);
      try {
        onSuccess(await action());
      } catch (caught) {
        await handleError(caught);
      } finally {
        setBusy(false);
      }
    },
    [handleError],
  );

  const expire = useCallback(() => {
    void api
      .finishGame(snapshot.id)
      .then((next) => {
        setSnapshot((current) => (current.status === "finished" ? current : next));
      })
      .catch(async (caught: unknown) => {
        if (caught instanceof ApiError && caught.code === "time_not_elapsed") return;
        await handleError(caught);
      });
  }, [snapshot.id, handleError]);

  const countdown = useCountdown({
    endsAt: snapshot.endsAt,
    serverTime: snapshot.serverTime,
    enabled: !isFinished && snapshot.timeLimitMinutes > 0,
    onExpire: expire,
  });

  const startQuestion = (categoryId: string, source: "wheel" | "category") => {
    if (busy || isFinished || pendingTurn || answerResult) return;

    void run(
      () => api.drawQuestion(snapshot.id, { categoryId, source }),
      (next) => {
        setSnapshot(next);
        setDismissedBonusId(null);
      },
    );
  };

  const openBonus = () => {
    if (busy || isFinished || pendingTurn || answerResult) return;

    void run(
      () => api.drawBonus(snapshot.id),
      (next) => {
        setSnapshot(next);
        setDismissedBonusId(null);
      },
    );
  };

  const answer = (optionId: string) => {
    const turn = answerResult ? answeredTurn : pendingTurn;
    if (!turn || busy) return;

    void run(
      () => api.answerQuestion(snapshot.id, turn.id, optionId),
      (result) => {
        setAnsweredTurn(turn);
        setSelectedOptionId(optionId);
        setAnswerResult(result);
        sound.play(result.isCorrect ? "correct" : "wrong");
      },
    );
  };

  const useFiftyFifty = () => {
    if (!pendingTurn || busy) return;

    void run(
      () => api.useFiftyFifty(snapshot.id, pendingTurn.id),
      (next) => {
        setSnapshot(next);
        sound.play("tick");
      },
    );
  };

  const next = () => {
    if (!answerResult) return;

    const nextGame = answerResult.game;
    setSnapshot((current) =>
      current.status === "finished" && nextGame.status !== "finished" ? current : nextGame,
    );
    setAnswerResult(null);
    setAnsweredTurn(null);
    setSelectedOptionId(null);
  };

  const saveScore = (playerId: string, newScore: number) => {
    void run(
      () => api.adjustScore(snapshot.id, { playerId, newScore }),
      (next) => {
        setSnapshot(next);
        setScoreOpen(false);
      },
    );
  };

  const isRegularResult = answerResult !== null && answeredTurn?.source !== "bonus";
  const questionTurn = isRegularResult
    ? answeredTurn
    : pendingTurn && pendingTurn.source !== "bonus"
      ? pendingTurn
      : null;
  const questionResult = isRegularResult ? answerResult : null;
  const questionCategory =
    questionTurn?.question.categoryId != null
      ? (categoriesById.get(questionTurn.question.categoryId) ?? null)
      : null;
  const questionPlayer =
    questionTurn != null
      ? (snapshot.players.find((player) => player.id === questionTurn.playerId) ?? null)
      : null;

  const isBonusResult = answerResult !== null && answeredTurn?.source === "bonus";
  const bonusTurn = isBonusResult
    ? answeredTurn
    : pendingTurn && pendingTurn.source === "bonus" && !isFinished
      ? pendingTurn
      : null;
  const bonusResult = isBonusResult ? answerResult : null;
  const bonusPlayer =
    bonusTurn != null
      ? (snapshot.players.find((player) => player.id === bonusTurn.playerId) ?? null)
      : null;

  const questionOpen = questionTurn !== null && (questionResult !== null || !isFinished);
  const bonusOpen =
    bonusTurn !== null && (bonusResult !== null || dismissedBonusId !== bonusTurn.id);
  const victoryOpen = isFinished && answerResult === null;
  const bonusDismissed = pendingTurn?.source === "bonus" && dismissedBonusId === pendingTurn.id;

  const actionsDisabled = busy || isFinished || pendingTurn !== null || answerResult !== null;

  return (
    <PageShell
      actions={
        <>
          {snapshot.timeLimitMinutes > 0 && !isFinished ? (
            <div
              className="flex min-h-8 items-center gap-1.5 rounded-full border border-gold-600/40 bg-gold-500/10 px-3 py-1.5 font-mono text-xs font-bold text-gold-300"
              title={strings.game.timerLabel}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden />
              <span>{countdown.label}</span>
            </div>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fullscreen.toggle()}
            aria-label={
              fullscreen.isFullscreen ? strings.nav.exitFullscreen : strings.nav.fullscreen
            }
            title={fullscreen.isFullscreen ? strings.nav.exitFullscreen : strings.nav.fullscreen}
          >
            {fullscreen.isFullscreen ? (
              <Minimize className="h-4 w-4" aria-hidden />
            ) : (
              <Maximize className="h-4 w-4" aria-hidden />
            )}
            <span className="hidden xl:inline">
              {fullscreen.isFullscreen ? strings.nav.exitFullscreen : strings.nav.fullscreen}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={sound.toggle}
            aria-pressed={sound.enabled}
            aria-label={sound.enabled ? strings.nav.soundOn : strings.nav.soundOff}
            title={sound.enabled ? strings.nav.soundOn : strings.nav.soundOff}
          >
            {sound.enabled ? (
              <Volume2 className="h-4 w-4" aria-hidden />
            ) : (
              <VolumeX className="h-4 w-4" aria-hidden />
            )}
            <span className="hidden xl:inline">
              {sound.enabled ? strings.nav.soundOn : strings.nav.soundOff}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setRulesOpen(true)}
            aria-label={strings.nav.rules}
            title={strings.nav.rules}
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            <span className="hidden xl:inline">{strings.nav.rules}</span>
          </Button>

          <Link
            href="/history"
            aria-label={strings.nav.history}
            title={strings.nav.history}
            className={buttonStyles("outline", "sm")}
          >
            <History className="h-4 w-4" aria-hidden />
            <span className="hidden xl:inline">{strings.nav.history}</span>
          </Link>

          <Link
            href="/questions"
            aria-label={strings.nav.questions}
            title={strings.nav.questions}
            className={buttonStyles("outline", "sm")}
          >
            <BookPlus className="h-4 w-4" aria-hidden />
            <span className="hidden xl:inline">{strings.nav.questions}</span>
          </Link>

          <Link
            href="/"
            aria-label={strings.nav.newGame}
            title={strings.nav.newGame}
            className={buttonStyles("primary", "sm")}
          >
            <Settings className="h-4 w-4" aria-hidden />
            <span className="hidden xl:inline">{strings.nav.newGame}</span>
          </Link>
        </>
      }
    >
      <Confetti active={victoryOpen} />

      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-danger-400/50 bg-danger-400/10 px-3.5 py-2.5 text-sm font-semibold text-danger-300"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label={strings.common.dismiss}
            className="rounded p-1 text-danger-300 transition-colors hover:bg-danger-400/15 hover:text-ink-100"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <section
        className="active-turn-pulse mb-5 flex flex-col gap-4 rounded-xl border border-gold-600/40 bg-ink-800 p-4 sm:flex-row sm:items-center sm:justify-between"
        onPointerDown={sound.init}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl font-black text-ink-900 shadow-md ${
              currentPlayer ? playerColor(currentPlayer.seat).bg : "bg-gold-500"
            }`}
          >
            {currentPlayer ? playerEmoji(currentPlayer.seat) : "⚙️"}
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300">
              {strings.game.activePlayer}
            </span>
            <h2 className="truncate font-display text-xl font-bold text-ink-100 sm:text-2xl">
              {currentPlayer ? strings.game.turnBanner(currentPlayer.name) : ""}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {currentPlayer && currentPlayer.bonusLeft > 0 && !isFinished ? (
            <Button
              variant="primary"
              size="sm"
              onClick={openBonus}
              disabled={busy || pendingTurn !== null || answerResult !== null}
            >
              <Star className="h-3.5 w-3.5" aria-hidden />
              {strings.game.bonusButton}
            </Button>
          ) : null}

          {bonusDismissed ? (
            <Button variant="outline" size="sm" onClick={() => setDismissedBonusId(null)}>
              {strings.game.resumeBonus}
            </Button>
          ) : null}

          <span className="rounded-full border border-gold-600/40 bg-gold-500/10 px-3 py-1.5 text-xs font-bold text-gold-300">
            {strings.game.round(Math.min(snapshot.round, RULES.maxRounds))}
          </span>
        </div>
      </section>

      <Leaderboard players={snapshot.players} currentSeat={snapshot.currentSeat} />

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <section
          className={`${panelClass} flex flex-col items-center justify-center p-4 sm:p-5 lg:col-span-5`}
        >
          <div className="mb-2 flex w-full items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-periwinkle-300">
              <span className="h-1.5 w-1.5 rounded-full bg-periwinkle-400" />
              {strings.game.wheelLabel}
            </span>
            <span className={badgeClass}>
              {strings.game.difficultyBadge(difficultyLabel(snapshot.difficulty))}
            </span>
          </div>

          <Wheel
            categories={categories}
            currentPlayerName={currentPlayer?.name ?? ""}
            disabled={actionsDisabled}
            onSpinEnd={(categoryId) => startQuestion(categoryId, "wheel")}
            onTick={() => sound.play("tick")}
          />
        </section>

        <section className={`${panelClass} flex flex-col gap-4 p-4 sm:p-5 lg:col-span-7`}>
          <div>
            <h2 className="font-display text-xl font-bold text-ink-100">
              {strings.game.boardTitle}
            </h2>
            <p className="mt-1 text-sm text-ink-400">{strings.game.boardSubtitle}</p>
          </div>

          <BoardTrack categories={categories} players={snapshot.players} />

          <div className="mt-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">
                {strings.game.categoriesTitle}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setScoreOpen(true);
                }}
                disabled={isFinished}
                className="flex items-center gap-1 text-xs font-semibold text-periwinkle-300 underline-offset-2 transition-colors hover:text-periwinkle-200 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PenLine className="h-3 w-3" aria-hidden />
                {strings.game.manualScore}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((category) => {
                const color = categoryColor(category);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => startQuestion(category.id, "category")}
                    disabled={actionsDisabled}
                    className={`${panelRaisedClass} group flex items-center gap-2 p-2.5 text-left transition-colors hover:border-periwinkle-400/60 hover:bg-ink-650 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span
                      aria-hidden
                      className="h-7 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-base transition-transform duration-200 group-hover:scale-110">
                      {category.icon}
                    </span>
                    <span className="min-w-0 overflow-hidden">
                      <span className="block truncate text-xs font-bold" style={{ color }}>
                        {category.name}
                      </span>
                      <span className="block text-[9px] font-medium text-ink-500">
                        {strings.game.categorySubtitle}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <QuestionDialog
        open={questionOpen}
        turn={questionTurn}
        category={questionCategory}
        player={questionPlayer}
        result={questionResult}
        selectedOptionId={selectedOptionId}
        busy={busy}
        onFiftyFifty={useFiftyFifty}
        onAnswer={answer}
        onNext={next}
      />

      <BonusDialog
        open={bonusOpen}
        turn={bonusTurn}
        player={bonusPlayer}
        result={bonusResult}
        busy={busy}
        onAnswer={answer}
        onNext={next}
        onClose={() => {
          if (bonusTurn) setDismissedBonusId(bonusTurn.id);
        }}
      />

      <ScoreDialog
        key={scoreOpen ? "open" : "closed"}
        open={scoreOpen}
        players={snapshot.players}
        busy={busy}
        error={error}
        onSave={saveScore}
        onClose={() => setScoreOpen(false)}
      />

      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />

      <VictoryDialog open={victoryOpen} players={snapshot.players} />
    </PageShell>
  );
}
