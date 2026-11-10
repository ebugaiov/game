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
import { AppLogo } from "./app-logo";
import { BoardTrack } from "./board-track";
import { BonusDialog } from "./bonus-dialog";
import { Confetti } from "./confetti";
import { FlagBackground } from "./flag-background";
import { Leaderboard } from "./leaderboard";
import { QuestionDialog } from "./question-dialog";
import { RulesDialog } from "./rules-dialog";
import { ScoreDialog } from "./score-dialog";
import { VictoryDialog } from "./victory-dialog";
import { Wheel } from "./wheel";
import { playerColor, playerEmoji } from "./palette";
import { difficultyLabel, strings } from "./strings";
import { useCountdown } from "./use-countdown";
import { useFullscreen } from "./use-fullscreen";
import { useSound } from "./use-sound";

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
    <div className="relative flex min-h-screen flex-col p-2 text-slate-100 sm:p-4 md:p-6">
      <FlagBackground />
      <Confetti active={victoryOpen} />

      <header className="glass-panel mx-auto mb-3 flex w-full max-w-7xl flex-col items-center justify-between gap-3 rounded-2xl p-3.5 shadow-2xl sm:flex-row sm:p-4">
        <div className="flex items-center gap-3">
          <AppLogo />
          <div>
            <h1 className="bg-gradient-to-r from-yellow-300 via-amber-200 to-cyan-300 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
              {strings.appName}
            </h1>
            <p className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <span>{strings.tagline}</span>
              <span className="rounded-full border border-cyan-500/40 bg-cyan-950 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                {strings.standardBadge}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {snapshot.timeLimitMinutes > 0 && !isFinished ? (
            <div
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-950/90 px-3 py-2 font-mono text-xs font-bold text-amber-300"
              title={strings.game.timerLabel}
            >
              <Clock className="h-4 w-4 animate-pulse text-amber-400" aria-hidden />
              <span>{countdown.label}</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void fullscreen.toggle()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-yellow-300 transition hover:bg-slate-700"
          >
            {fullscreen.isFullscreen ? (
              <Minimize className="h-4 w-4" aria-hidden />
            ) : (
              <Maximize className="h-4 w-4" aria-hidden />
            )}
            <span className="hidden sm:inline">
              {fullscreen.isFullscreen ? strings.nav.exitFullscreen : strings.nav.fullscreen}
            </span>
          </button>

          <button
            type="button"
            onClick={sound.toggle}
            aria-pressed={sound.enabled}
            className="glass-card flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            {sound.enabled ? (
              <Volume2 className="h-4 w-4" aria-hidden />
            ) : (
              <VolumeX className="h-4 w-4" aria-hidden />
            )}
            <span className="hidden sm:inline">
              {sound.enabled ? strings.nav.soundOn : strings.nav.soundOff}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-600/40 px-3 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-600/60"
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{strings.nav.rules}</span>
          </button>

          <Link
            href="/history"
            className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-600/30 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-600/50"
          >
            <History className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{strings.nav.history}</span>
          </Link>

          <Link
            href="/questions"
            className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800/90 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-slate-700"
          >
            <BookPlus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{strings.nav.questions}</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-yellow-400/50 bg-yellow-500/30 px-3 py-2 text-xs font-semibold text-yellow-200 transition hover:bg-yellow-500/50"
          >
            <Settings className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{strings.nav.newGame}</span>
          </Link>
        </div>
      </header>

      {error ? (
        <div
          role="alert"
          className="mx-auto mb-3 flex w-full max-w-7xl items-center justify-between gap-3 rounded-xl border border-rose-500/50 bg-rose-950/80 px-3.5 py-2.5 text-xs font-semibold text-rose-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label={strings.common.dismiss}
            className="text-rose-300 transition hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <div
        className="glass-panel active-turn-pulse mx-auto mb-4 flex w-full max-w-7xl items-center justify-between gap-4 rounded-2xl border-2 border-yellow-400/80 p-3.5"
        onPointerDown={sound.init}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black text-slate-950 shadow-md ${
              currentPlayer ? playerColor(currentPlayer.seat).bg : "bg-yellow-400"
            }`}
          >
            {currentPlayer ? playerEmoji(currentPlayer.seat) : "⚙️"}
          </div>
          <div>
            <span className="block text-[10px] font-black uppercase tracking-widest text-yellow-300">
              {strings.game.activePlayer}
            </span>
            <h2 className="text-base font-extrabold text-slate-100 sm:text-xl">
              {currentPlayer ? strings.game.turnBanner(currentPlayer.name) : ""}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {currentPlayer && currentPlayer.bonusLeft > 0 && !isFinished ? (
            <button
              type="button"
              onClick={openBonus}
              disabled={busy || pendingTurn !== null || answerResult !== null}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-md transition hover:from-amber-400 hover:to-orange-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Star className="h-3.5 w-3.5" aria-hidden />
              {strings.game.bonusButton}
            </button>
          ) : null}

          {bonusDismissed ? (
            <button
              type="button"
              onClick={() => setDismissedBonusId(null)}
              className="rounded-xl border border-amber-400/60 bg-amber-500/20 px-3.5 py-2 text-xs font-black text-amber-200 transition hover:bg-amber-500/30"
            >
              {strings.game.resumeBonus}
            </button>
          ) : null}

          <span className="rounded-xl border border-yellow-500/40 bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-yellow-300">
            {strings.game.round(Math.min(snapshot.round, RULES.maxRounds))}
          </span>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5">
        <Leaderboard players={snapshot.players} currentSeat={snapshot.currentSeat} />

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <section className="glass-panel relative flex flex-col items-center justify-center rounded-3xl p-4 sm:p-5 lg:col-span-5">
            <div className="mb-2 flex w-full items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
                {strings.game.wheelLabel}
              </span>
              <span className="rounded-full border border-yellow-500/40 bg-yellow-500/20 px-2.5 py-1 text-xs font-black text-yellow-300">
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

          <section className="glass-panel flex flex-col gap-4 rounded-3xl p-4 sm:p-5 lg:col-span-7">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
                🗺️ {strings.game.boardTitle}
              </h2>
              <p className="text-xs text-slate-300">{strings.game.boardSubtitle}</p>
            </div>

            <BoardTrack categories={categories} players={snapshot.players} />

            <div className="mt-1">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {strings.game.categoriesTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setScoreOpen(true);
                  }}
                  disabled={isFinished}
                  className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 transition hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <PenLine className="h-3 w-3" aria-hidden />
                  {strings.game.manualScore}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => startQuestion(category.id, "category")}
                    disabled={actionsDisabled}
                    className="glass-card group flex items-center gap-2 rounded-xl border border-slate-800 p-2 text-left transition hover:border-yellow-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-base transition duration-200 group-hover:scale-110">
                      {category.icon}
                    </span>
                    <span className="overflow-hidden">
                      <span
                        className="block truncate text-xs font-bold"
                        style={{ color: category.color }}
                      >
                        {category.name}
                      </span>
                      <span className="block text-[8px] font-medium text-slate-400">
                        {strings.game.categorySubtitle}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

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
    </div>
  );
}
