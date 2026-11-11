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
import { Button, buttonStyles } from "./button";
import { PageShell } from "./page-shell";
import { categoryColor } from "./palette";
import { fieldClass, labelClass, panelClass, panelRaisedClass } from "./styles";
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

  return (
    <PageShell
      maxWidth="max-w-5xl"
      actions={
        <Link href="/" className={buttonStyles("primary", "sm")}>
          <Home className="h-4 w-4" aria-hidden />
          {strings.questions.backHome}
        </Link>
      }
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-ink-600 bg-ink-700 text-gold-300">
          <Library className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-100 sm:text-3xl">
            {strings.questions.title}
          </h1>
          <p className="text-sm text-ink-400">{strings.questions.subtitle}</p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 pb-8">
        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger-400/50 bg-danger-400/10 p-3 text-sm font-semibold text-danger-300"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}

        <div role="status" aria-live="polite">
          {status ? (
            <p className="flex items-center gap-2 rounded-lg border border-success-400/50 bg-success-400/10 p-3 text-sm font-semibold text-success-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              <span>{status}</span>
            </p>
          ) : null}
        </div>

        <form onSubmit={submit} className={`${panelClass} flex flex-col gap-5 p-5 sm:p-6`}>
          <h2 className="flex items-center gap-2 border-b border-ink-600/80 pb-4 font-display text-xl font-bold text-ink-100">
            <FilePlus2 className="h-5 w-5 text-gold-300" aria-hidden />
            {strings.questions.formTitle}
          </h2>

          <div>
            <span className={labelClass}>{strings.questions.kindLabel}</span>
            <div className="grid grid-cols-2 gap-2">
              {(["regular", "bonus"] as const).map((value) => {
                const active = kind === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectKind(value)}
                    aria-pressed={active}
                    className={`rounded-lg border-2 px-2 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-periwinkle-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 ${
                      active
                        ? "border-periwinkle-400 bg-periwinkle-400/15 text-periwinkle-300"
                        : "border-ink-600 bg-ink-700 text-ink-300 hover:border-ink-550 hover:text-ink-100"
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
                <label htmlFor="question-category" className={labelClass}>
                  {strings.questions.categoryLabel}
                </label>
                <select
                  id="question-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className={fieldClass}
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
              <label htmlFor="question-difficulty" className={labelClass}>
                {strings.questions.difficultyLabel}
              </label>
              <select
                id="question-difficulty"
                value={kind === "bonus" ? "expert" : difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                disabled={kind === "bonus"}
                className={fieldClass}
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
            <label htmlFor="question-prompt" className={labelClass}>
              {strings.questions.promptLabel}
            </label>
            <textarea
              id="question-prompt"
              value={prompt}
              maxLength={500}
              rows={3}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={strings.questions.promptPlaceholder}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="question-explanation" className={labelClass}>
              {strings.questions.explanationLabel}
            </label>
            <textarea
              id="question-explanation"
              value={explanation}
              maxLength={1000}
              rows={2}
              onChange={(event) => setExplanation(event.target.value)}
              placeholder={strings.questions.explanationPlaceholder}
              className={fieldClass}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className={labelClass}>{strings.questions.optionsLabel}</legend>
            {options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                  option.isCorrect
                    ? "border-success-400/60 bg-success-400/10"
                    : "border-ink-600 bg-ink-900/80"
                }`}
              >
                <input
                  type="radio"
                  name="correct-option"
                  checked={option.isCorrect}
                  onChange={() => markCorrect(index)}
                  aria-label={`${strings.questions.correctLabel} ${index + 1}`}
                  className="h-4 w-4 shrink-0 accent-periwinkle-400"
                />
                <span className="w-4 shrink-0 text-center text-xs font-bold text-ink-500">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={option.text}
                  maxLength={200}
                  onChange={(event) => updateOptionText(index, event.target.value)}
                  placeholder={strings.questions.optionLabel(index + 1)}
                  aria-label={strings.questions.optionLabel(index + 1)}
                  className="w-full rounded-md border-2 border-ink-600 bg-ink-900 px-2.5 py-1.5 text-sm font-medium text-ink-200 outline-none transition-colors placeholder:text-ink-500 focus:border-periwinkle-400"
                />
                {option.isCorrect ? (
                  <span className="shrink-0 rounded-full border border-success-400/40 bg-success-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success-300">
                    {strings.questions.correctBadge}
                  </span>
                ) : null}
              </div>
            ))}
          </fieldset>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={busy}
              aria-busy={busy}
              className="w-full font-display uppercase tracking-[0.14em]"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              {busy ? strings.questions.saving : strings.questions.save}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={resetForm}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              {strings.questions.reset}
            </Button>
          </div>
        </form>

        <section className={`${panelClass} flex flex-col gap-4 p-5 sm:p-6`}>
          <div className="flex flex-col justify-between gap-3 border-b border-ink-600/80 pb-4 sm:flex-row sm:items-center">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink-100">
              <Library className="h-5 w-5 text-periwinkle-300" aria-hidden />
              {strings.questions.listTitle}
              <span className="rounded-full border border-periwinkle-400/30 bg-periwinkle-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-periwinkle-300">
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
                className={`${fieldClass} sm:w-auto`}
              >
                <option value="all">{strings.questions.allKinds}</option>
                <option value="regular">{strings.questions.kinds.regular}</option>
                <option value="bonus">{strings.questions.kinds.bonus}</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label={strings.questions.filterCategory}
                className={`${fieldClass} sm:w-auto`}
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
            <p className="py-8 text-center text-sm text-ink-400">{strings.questions.empty}</p>
          ) : (
            <ul className="space-y-2.5">
              {visibleQuestions.map((question) => {
                const category = question.categoryId
                  ? categoriesById.get(question.categoryId)
                  : undefined;
                const confirming = confirmId === question.id;
                const deleting = deletingId === question.id;
                const accent = category ? categoryColor(category) : null;

                return (
                  <li key={question.id} className={`${panelRaisedClass} space-y-2.5 p-3.5`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {category && accent ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: `${accent}1f`,
                              color: accent,
                              borderColor: `${accent}66`,
                            }}
                          >
                            {category.icon} {category.name}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-ink-550 bg-ink-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-300">
                          {DIFFICULTY_LABELS[question.difficulty]}
                        </span>
                        <span className="rounded-full border border-periwinkle-400/40 bg-periwinkle-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-periwinkle-300">
                          {strings.questions.kindBadge[question.kind]}
                        </span>
                        <span className="rounded-full border border-ink-550 bg-ink-900 px-2 py-0.5 font-mono text-[10px] text-ink-400">
                          {strings.questions.origin[question.origin]}
                        </span>
                      </div>

                      {confirming ? (
                        <div className="flex gap-1.5">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => void remove(question.id)}
                            disabled={deleting}
                          >
                            {strings.questions.confirmDelete}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmId(null)}
                            disabled={deleting}
                          >
                            {strings.questions.cancelDelete}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmId(question.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          {strings.questions.delete}
                        </Button>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-ink-100">{question.prompt}</p>

                    <ul className="grid gap-1 sm:grid-cols-2">
                      {question.options.map((option) => (
                        <li
                          key={option.id}
                          className={`flex items-start gap-1.5 rounded-md border px-2 py-1.5 text-xs ${
                            option.isCorrect
                              ? "border-success-400/50 bg-success-400/10 text-success-300"
                              : "border-ink-600 bg-ink-900/60 text-ink-300"
                          }`}
                        >
                          {option.isCorrect ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          ) : (
                            <span className="mt-0.5 w-3.5 shrink-0 text-center text-[10px] text-ink-500">
                              {option.position + 1}
                            </span>
                          )}
                          <span>{option.text}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-xs leading-relaxed text-ink-400">{question.explanation}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
