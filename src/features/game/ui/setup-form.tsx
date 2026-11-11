"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookPlus, History, Loader2, Plus, Rocket, Trash2 } from "lucide-react";
import { createGame } from "../api-client";
import type { Difficulty } from "../domain/types";
import { AppLogo } from "./app-logo";
import { Button, buttonStyles } from "./button";
import { PageShell } from "./page-shell";
import { playerColor, playerEmoji } from "./palette";
import { badgeClass, fieldClass, labelClass, panelClass } from "./styles";
import {
  DIFFICULTY_LABELS,
  PLAYER_PRESETS,
  TIME_LIMIT_OPTIONS,
  strings,
  type TimeLimitMinutes,
} from "./strings";

const MAX_PLAYERS = 20;

const DIFFICULTY_ORDER: Array<Difficulty | "all"> = ["all", "easy", "medium", "hard", "expert"];

const DIFFICULTY_TEXT: Record<Difficulty | "all", string> = {
  all: "text-ink-200",
  easy: "text-success-300",
  medium: "text-gold-300",
  hard: "text-hazard-400",
  expert: "text-danger-300",
};

function presetNames(count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => PLAYER_PRESETS[index] ?? strings.setup.defaultPlayerName(index + 1),
  );
}

export function SetupForm() {
  const router = useRouter();
  const [names, setNames] = useState<string[]>(() => presetNames(2));
  const [timeLimit, setTimeLimit] = useState<TimeLimitMinutes>(10);
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateName = (index: number, value: string) => {
    setNames((current) => current.map((name, i) => (i === index ? value : name)));
  };

  const addPlayer = () => {
    setNames((current) => {
      if (current.length >= MAX_PLAYERS) return current;
      return [...current, strings.setup.defaultPlayerName(current.length + 1)];
    });
  };

  const removePlayer = (index: number) => {
    setNames((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const snapshot = await createGame({
        timeLimitMinutes: timeLimit,
        difficulty,
        players: names,
      });
      router.push(`/games/${snapshot.id}`);
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : strings.setup.startFailed);
      setBusy(false);
    }
  };

  return (
    <PageShell
      maxWidth="max-w-6xl"
      actions={
        <>
          <Link href="/history" className={buttonStyles("outline", "sm")}>
            <History className="h-4 w-4" aria-hidden />
            <span>{strings.nav.history}</span>
          </Link>
          <Link href="/questions" className={buttonStyles("outline", "sm")}>
            <BookPlus className="h-4 w-4" aria-hidden />
            <span>{strings.nav.questions}</span>
          </Link>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        <section className="flex flex-col items-center pt-4 text-center sm:pt-8">
          <AppLogo className="mb-6 h-20 w-20 sm:h-24 sm:w-24" />
          <span className={badgeClass}>{strings.standardBadge}</span>
          <h1 className="mt-5 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.02] text-ink-100 sm:text-5xl">
            {strings.appName}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-400 sm:text-base">
            {strings.tagline}
          </p>
        </section>

        <form className={`${panelClass} mt-8 flex flex-col gap-6 p-5 sm:p-7`} onSubmit={submit}>
          <div className="border-b border-ink-600/80 pb-4">
            <h2 className="font-display text-2xl font-bold text-ink-100">{strings.setup.title}</h2>
            <p className="mt-1 text-sm text-ink-400">{strings.setup.subtitle}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="time-limit" className={labelClass}>
                {strings.setup.timeLabel}
              </label>
              <select
                id="time-limit"
                value={timeLimit}
                onChange={(event) => setTimeLimit(Number(event.target.value) as TimeLimitMinutes)}
                className={fieldClass}
              >
                {TIME_LIMIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className={labelClass}>{strings.setup.difficultyLabel}</span>
              <div className="grid grid-cols-5 gap-1.5">
                {DIFFICULTY_ORDER.map((value) => {
                  const active = difficulty === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDifficulty(value)}
                      aria-pressed={active}
                      className={`rounded-lg border-2 px-1 py-2.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-periwinkle-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 ${
                        active
                          ? "border-periwinkle-400 bg-periwinkle-400/15 text-periwinkle-300"
                          : `border-ink-600 bg-ink-700 hover:border-ink-550 ${DIFFICULTY_TEXT[value]}`
                      }`}
                    >
                      {DIFFICULTY_LABELS[value]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className={`${labelClass} mb-0`}>{strings.setup.playersLabel}</span>
              <span className="rounded-full border border-periwinkle-400/30 bg-periwinkle-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-periwinkle-300">
                {strings.setup.playerCount(names.length)}
              </span>
            </div>

            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {names.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-700 p-1.5"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-black text-ink-900 ${playerColor(index).bg}`}
                  >
                    {playerEmoji(index)}
                  </span>
                  <input
                    type="text"
                    value={name}
                    maxLength={40}
                    onChange={(event) => updateName(index, event.target.value)}
                    placeholder={strings.setup.playerPlaceholder}
                    aria-label={`${strings.setup.playerPlaceholder} ${index + 1}`}
                    className="w-full rounded-md border-2 border-ink-600 bg-ink-900 px-2.5 py-1.5 text-sm font-medium text-ink-200 outline-none transition-colors placeholder:text-ink-500 focus:border-periwinkle-400"
                  />
                  {names.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      title={strings.setup.removePlayer}
                      aria-label={strings.setup.removePlayer}
                      className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-danger-400/10 hover:text-danger-300"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : (
                    <span className="w-7" />
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addPlayer}
              disabled={names.length >= MAX_PLAYERS}
              className="mt-2.5 w-full border-dashed"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {strings.setup.addPlayer}
            </Button>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-danger-400/50 bg-danger-400/10 p-3 text-sm font-semibold text-danger-300"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={busy}
            className="w-full font-display uppercase tracking-[0.14em]"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Rocket className="h-4 w-4" aria-hidden />
            )}
            {busy ? strings.setup.loading : strings.setup.start}
          </Button>
        </form>
      </div>
    </PageShell>
  );
}
