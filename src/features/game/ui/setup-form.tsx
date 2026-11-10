"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookPlus, History, Loader2, Plus, Rocket, Settings, Trash2 } from "lucide-react";
import { createGame } from "../api-client";
import type { Difficulty } from "../domain/types";
import { playerColor, playerEmoji } from "./palette";
import { AppLogo } from "./app-logo";
import { FlagBackground } from "./flag-background";
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
  all: "text-slate-200",
  easy: "text-emerald-400",
  medium: "text-amber-400",
  hard: "text-orange-400",
  expert: "text-rose-400",
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
    <div className="relative flex min-h-screen flex-col p-2 text-slate-100 sm:p-4 md:p-6">
      <FlagBackground />

      <header className="glass-panel mx-auto mb-4 flex w-full max-w-3xl flex-col items-center justify-between gap-3 rounded-2xl p-3.5 shadow-2xl sm:flex-row sm:p-4">
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
          <Link
            href="/history"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-600/40 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-600/60"
          >
            <History className="h-4 w-4" aria-hidden />
            {strings.nav.history}
          </Link>
          <Link
            href="/questions"
            className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-600/30 px-3.5 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-600/50"
          >
            <BookPlus className="h-4 w-4" aria-hidden />
            {strings.nav.questions}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 items-start justify-center">
        <form
          onSubmit={submit}
          className="glass-panel flex w-full flex-col gap-5 rounded-3xl p-5 shadow-2xl sm:p-6"
        >
          <div className="border-b border-slate-700/60 pb-3 text-center">
            <h2 className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-300 via-amber-300 to-cyan-300 bg-clip-text text-2xl font-black text-transparent">
              <Settings className="h-6 w-6 text-yellow-300" aria-hidden />
              {strings.setup.title}
            </h2>
            <p className="mt-1 text-xs text-slate-300">{strings.setup.subtitle}</p>
          </div>

          <div>
            <label
              htmlFor="time-limit"
              className="mb-1.5 block text-xs font-bold uppercase text-slate-300"
            >
              ⏱️ {strings.setup.timeLabel}
            </label>
            <select
              id="time-limit"
              value={timeLimit}
              onChange={(event) => setTimeLimit(Number(event.target.value) as TimeLimitMinutes)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white outline-none transition focus:border-yellow-400"
            >
              {TIME_LIMIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase text-slate-300">
              {strings.setup.presetsLabel}
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 8, 12].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setNames(presetNames(count))}
                  className="rounded-xl border border-slate-600 bg-slate-800 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
                >
                  {strings.setup.presetCount(count)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-300">
                {strings.setup.playersLabel}
              </span>
              <span className="rounded-md border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 text-xs font-extrabold text-yellow-400">
                {strings.setup.playerCount(names.length)}
              </span>
            </div>

            <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {names.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-1.5"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-slate-950 shadow-md ${playerColor(index).bg}`}
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
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-100 outline-none transition focus:border-yellow-400"
                  />
                  {names.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      title={strings.setup.removePlayer}
                      aria-label={strings.setup.removePlayer}
                      className="p-1 text-xs font-bold text-rose-400 transition hover:text-rose-200"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : (
                    <span className="w-5" />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addPlayer}
              disabled={names.length >= MAX_PLAYERS}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-yellow-400/60 bg-yellow-500/10 py-2.5 text-xs font-bold text-yellow-300 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {strings.setup.addPlayer}
            </button>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase text-slate-300">
              {strings.setup.difficultyLabel}
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {DIFFICULTY_ORDER.map((value) => {
                const active = difficulty === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDifficulty(value)}
                    aria-pressed={active}
                    className={`rounded-xl border border-slate-700 bg-slate-800 px-1 py-2 text-xs font-bold transition ${DIFFICULTY_TEXT[value]} ${
                      active ? "bg-slate-700 ring-2 ring-yellow-400" : ""
                    }`}
                  >
                    {DIFFICULTY_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-500/50 bg-rose-950/60 p-2.5 text-xs font-semibold text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 py-3.5 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl transition hover:from-yellow-400 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60 glow-yellow"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Rocket className="h-4 w-4" aria-hidden />
            )}
            {busy ? strings.setup.loading : strings.setup.start}
          </button>
        </form>
      </main>
    </div>
  );
}
