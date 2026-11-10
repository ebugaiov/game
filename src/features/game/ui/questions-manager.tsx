"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  FilePlus2,
  Home,
  Library,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import * as api from "../api-client";
import { ApiError } from "../api-client";
import type { Difficulty } from "../domain/types";
import type { CategoryDto, QuestionSummary } from "../schemas";
import { createQuestionSchema } from "../schemas";
import { FlagBackground } from "./flag-background";
import { DIFFICULTY_LABELS, strings } from "./strings";

const OPTION_COUNT = 4;
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

type OptionDraft = { text: string; isCorrect: boolean };

function emptyOptions(): OptionDraft[] {
  return Array.from({ length: OPTION_COUNT }, () => ({ text: "", isCorrect: false }));
}

type QuestionsManagerProps = {
  initialCategories: CategoryDto[];
  initialQuestions: QuestionSummary[];
};

export function QuestionsManager({ initialCategories, initialQuestions }: QuestionsManagerProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [kind, setKind] = useState<QuestionSummary["kind"]>("regular");
  const [categoryId, setCategoryId] = useState(initialCategories[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>(emptyOptions);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<"all" | QuestionSummary["kind"]>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");

  const categoriesById = useMemo(
    () => new Map(initialCategories.map((category) => [category.id, category])),
    [initialCategories],
  );

  const visibleQuestions = useMemo(
    () =>
      questions.filter(
        (question) =>
          (kindFilter === "all" || question.kind === kindFilter) &&
          (categoryFilter === "all" || question.categoryId === categoryFilter),
      ),
    [questions, kindFilter, categoryFilter],
  );

  const resetForm = () => {
    setPrompt("");
    setExplanation("");
    setOptions(emptyOptions());
  };

  const selectKind = (nextKind: QuestionSummary["kind"]) => {
    setKind(nextKind);
    setDifficulty(nextKind === "bonus" ? "expert" : "medium");
    setError(null);
    setStatus(null);
  };

  const markCorrect = (index: number) => {
    setOptions((current) =>
      current.map((option, position) => ({ ...option, isCorrect: position === index })),
    );
  };

  const updateOptionText = (index: number, text: string) => {
    setOptions((current) =>
      current.map((option, position) => (position === index ? { ...option, text } : option)),
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    setError(null);
    setStatus(null);

    const trimmedPrompt = prompt.trim();
    const trimmedExplanation = explanation.trim();
    const trimmedOptions = options.map((option) => ({
      text: option.text.trim(),
      isCorrect: option.isCorrect,
    }));

    if (!trimmedPrompt || !trimmedExplanation || trimmedOptions.some((option) => !option.text)) {
      setError(strings.questions.formInvalid);
      return;
    }
    if (trimmedOptions.filter((option) => option.isCorrect).length !== 1) {
      setError(strings.questions.oneCorrect);
      return;
    }
    if (kind === "regular" && !categoryId) {
      setError(strings.questions.categoryRequired);
      return;
    }

    const candidate =
      kind === "regular"
        ? {
            kind,
            categoryId,
            difficulty,
            prompt: trimmedPrompt,
            explanation: trimmedExplanation,
            options: trimmedOptions,
          }
        : {
            kind,
            difficulty: "expert" as const,
            prompt: trimmedPrompt,
            explanation: trimmedExplanation,
            options: trimmedOptions,
          };

    const parsed = createQuestionSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(strings.questions.formInvalid);
      return;
    }

    setBusy(true);
    try {
      const created = await api.createQuestion(parsed.data);
      setQuestions((current) => [created, ...current]);
      setConfirmId(null);
      resetForm();
      setStatus(strings.questions.created);
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof ApiError ? caught.message : strings.questions.createFailed);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (questionId: string) => {
    if (deletingId) return;

    setDeletingId(questionId);
    setError(null);
    setStatus(null);

    try {
      const updated = await api.deleteQuestion(questionId);
      setQuestions((current) => current.filter((question) => question.id !== updated.id));
      setConfirmId(null);
      setStatus(strings.questions.deleted);
    } catch (caught) {
      console.error(caught);
      setError(strings.questions.deleteFailed);
    } finally {
      setDeletingId(null);
    }
  };

  const fieldClassName =
    "w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 outline-none transition focus:border-yellow-400";

  return (
    <div className="relative flex min-h-screen flex-col p-2 text-slate-100 sm:p-4 md:p-6">
      <FlagBackground />

      <header className="glass-panel mx-auto mb-4 flex w-full max-w-5xl flex-col items-center justify-between gap-3 rounded-2xl p-3.5 shadow-2xl sm:flex-row sm:p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-amber-400 to-yellow-400 text-2xl shadow-lg glow-yellow">
            ⚙️
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-yellow-300 via-amber-200 to-cyan-300 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
              {strings.questions.title}
            </h1>
            <p className="text-xs font-medium text-slate-300">{strings.questions.subtitle}</p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-yellow-400/50 bg-yellow-500/30 px-3.5 py-2 text-xs font-semibold text-yellow-200 transition hover:bg-yellow-500/50"
        >
          <Home className="h-4 w-4" aria-hidden />
          {strings.questions.backHome}
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 pb-8">
        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-500/50 bg-rose-950/70 p-2.5 text-xs font-semibold text-rose-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}

        <div role="status" aria-live="polite">
          {status ? (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/60 p-2.5 text-xs font-semibold text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              <span>{status}</span>
            </p>
          ) : null}
        </div>

        <form
          onSubmit={submit}
          className="glass-panel flex flex-col gap-4 rounded-3xl p-5 shadow-2xl sm:p-6"
        >
          <h2 className="flex items-center gap-2 border-b border-slate-700/60 pb-3 text-lg font-black text-yellow-300">
            <FilePlus2 className="h-5 w-5" aria-hidden />
            {strings.questions.formTitle}
          </h2>

          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase text-slate-300">
              {strings.questions.kindLabel}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["regular", "bonus"] as const).map((value) => {
                const active = kind === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectKind(value)}
                    aria-pressed={active}
                    className={`rounded-xl border border-slate-700 bg-slate-800 px-2 py-2 text-xs font-bold text-slate-200 transition ${
                      active ? "bg-slate-700 ring-2 ring-yellow-400" : ""
                    }`}
                  >
                    {strings.questions.kinds[value]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {kind === "regular" ? (
              <div>
                <label
                  htmlFor="question-category"
                  className="mb-1.5 block text-xs font-bold uppercase text-slate-300"
                >
                  {strings.questions.categoryLabel}
                </label>
                <select
                  id="question-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className={fieldClassName}
                >
                  {initialCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label
                htmlFor="question-difficulty"
                className="mb-1.5 block text-xs font-bold uppercase text-slate-300"
              >
                {strings.questions.difficultyLabel}
              </label>
              <select
                id="question-difficulty"
                value={kind === "bonus" ? "expert" : difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                disabled={kind === "bonus"}
                className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {DIFFICULTIES.map((value) => (
                  <option key={value} value={value}>
                    {DIFFICULTY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="question-prompt"
              className="mb-1.5 block text-xs font-bold uppercase text-slate-300"
            >
              {strings.questions.promptLabel}
            </label>
            <textarea
              id="question-prompt"
              value={prompt}
              maxLength={500}
              rows={3}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={strings.questions.promptPlaceholder}
              className={fieldClassName}
            />
          </div>

          <div>
            <label
              htmlFor="question-explanation"
              className="mb-1.5 block text-xs font-bold uppercase text-slate-300"
            >
              {strings.questions.explanationLabel}
            </label>
            <textarea
              id="question-explanation"
              value={explanation}
              maxLength={1000}
              rows={2}
              onChange={(event) => setExplanation(event.target.value)}
              placeholder={strings.questions.explanationPlaceholder}
              className={fieldClassName}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-xs font-bold uppercase text-slate-300">
              {strings.questions.optionsLabel}
            </legend>
            {options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 rounded-xl border p-2 ${
                  option.isCorrect
                    ? "border-emerald-500/60 bg-emerald-950/30"
                    : "border-slate-700 bg-slate-900/90"
                }`}
              >
                <input
                  type="radio"
                  name="correct-option"
                  checked={option.isCorrect}
                  onChange={() => markCorrect(index)}
                  aria-label={`${strings.questions.correctLabel} ${index + 1}`}
                  className="h-4 w-4 shrink-0 accent-emerald-400"
                />
                <span className="w-4 shrink-0 text-center text-xs font-black text-slate-400">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={option.text}
                  maxLength={200}
                  onChange={(event) => updateOptionText(index, event.target.value)}
                  placeholder={strings.questions.optionLabel(index + 1)}
                  aria-label={strings.questions.optionLabel(index + 1)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-100 outline-none transition focus:border-yellow-400"
                />
                {option.isCorrect ? (
                  <span className="shrink-0 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    {strings.questions.correctBadge}
                  </span>
                ) : null}
              </div>
            ))}
          </fieldset>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl transition hover:from-yellow-400 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60 glow-yellow"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              {busy ? strings.questions.saving : strings.questions.save}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={busy}
              className="w-full rounded-2xl border border-slate-600 bg-slate-800 py-3 text-xs font-bold text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5"
            >
              {strings.questions.reset}
            </button>
          </div>
        </form>

        <section className="glass-panel flex flex-col gap-3 rounded-3xl p-5 shadow-2xl sm:p-6">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-700/60 pb-3 sm:flex-row sm:items-center">
            <h2 className="flex items-center gap-2 text-lg font-black text-cyan-300">
              <Library className="h-5 w-5" aria-hidden />
              {strings.questions.listTitle}
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/20 px-2 py-0.5 text-xs font-extrabold text-cyan-200">
                {strings.questions.listCount(visibleQuestions.length)}
              </span>
            </h2>

            <div className="flex flex-wrap gap-2">
              <select
                value={kindFilter}
                onChange={(event) =>
                  setKindFilter(event.target.value as "all" | QuestionSummary["kind"])
                }
                aria-label={strings.questions.filterKind}
                className={fieldClassName}
              >
                <option value="all">{strings.questions.allKinds}</option>
                <option value="regular">{strings.questions.kinds.regular}</option>
                <option value="bonus">{strings.questions.kinds.bonus}</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label={strings.questions.filterCategory}
                className={fieldClassName}
              >
                <option value="all">{strings.questions.allCategories}</option>
                {initialCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visibleQuestions.length === 0 ? (
            <p className="py-6 text-center text-xs font-semibold text-slate-400">
              {strings.questions.empty}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {visibleQuestions.map((question) => {
                const category = question.categoryId
                  ? categoriesById.get(question.categoryId)
                  : undefined;
                const confirming = confirmId === question.id;
                const deleting = deletingId === question.id;

                return (
                  <li
                    key={question.id}
                    className="space-y-2.5 rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {category ? (
                          <span
                            className="rounded-md border px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: `${category.color}25`,
                              color: category.color,
                              borderColor: `${category.color}60`,
                            }}
                          >
                            {category.icon} {category.name}
                          </span>
                        ) : null}
                        <span className="rounded-md border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                          {DIFFICULTY_LABELS[question.difficulty]}
                        </span>
                        <span className="rounded-md border border-indigo-500/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-200">
                          {strings.questions.kindBadge[question.kind]}
                        </span>
                        <span className="rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                          {strings.questions.origin[question.origin]}
                        </span>
                      </div>

                      {confirming ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => void remove(question.id)}
                            disabled={deleting}
                            className="rounded-lg border border-rose-500/50 bg-rose-600/40 px-2.5 py-1 text-[10px] font-bold text-rose-100 transition hover:bg-rose-600/60 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {strings.questions.confirmDelete}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            disabled={deleting}
                            className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300 transition hover:bg-slate-700"
                          >
                            {strings.questions.cancelDelete}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(question.id)}
                          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300 transition hover:border-rose-500/50 hover:text-rose-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          {strings.questions.delete}
                        </button>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-slate-100">{question.prompt}</p>

                    <ul className="grid gap-1 sm:grid-cols-2">
                      {question.options.map((option) => (
                        <li
                          key={option.id}
                          className={`flex items-start gap-1.5 rounded-lg border px-2 py-1 text-xs ${
                            option.isCorrect
                              ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-200"
                              : "border-slate-800 bg-slate-950/60 text-slate-300"
                          }`}
                        >
                          {option.isCorrect ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          ) : (
                            <span className="mt-0.5 w-3.5 shrink-0 text-center text-[10px] text-slate-500">
                              {option.position + 1}
                            </span>
                          )}
                          <span>{option.text}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-xs text-slate-400">{question.explanation}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
