import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, questionOptions, questions } from "@/db/schema";
import type { QuestionSummary } from "../schemas";

const DIFFICULTY_ORDER: Record<QuestionSummary["difficulty"], number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  expert: 3,
};

const KIND_ORDER: Record<QuestionSummary["kind"], number> = {
  regular: 0,
  bonus: 1,
};

type QuestionRow = {
  id: string;
  seedKey: string | null;
  kind: QuestionSummary["kind"];
  categoryId: string | null;
  categorySortOrder: number | null;
  difficulty: QuestionSummary["difficulty"];
  prompt: string;
  explanation: string;
  isActive: boolean;
  optionId: string;
  optionPosition: number;
  optionText: string;
  optionIsCorrect: boolean;
};

function selectQuestionRows() {
  return db
    .select({
      id: questions.id,
      seedKey: questions.seedKey,
      kind: questions.kind,
      categoryId: questions.categoryId,
      categorySortOrder: categories.sortOrder,
      difficulty: questions.difficulty,
      prompt: questions.prompt,
      explanation: questions.explanation,
      isActive: questions.isActive,
      optionId: questionOptions.id,
      optionPosition: questionOptions.position,
      optionText: questionOptions.text,
      optionIsCorrect: questionOptions.isCorrect,
    })
    .from(questions)
    .leftJoin(categories, eq(categories.id, questions.categoryId))
    .innerJoin(questionOptions, eq(questionOptions.questionId, questions.id));
}

function groupRows(rows: QuestionRow[]): Array<{
  summary: QuestionSummary;
  categorySortOrder: number | null;
}> {
  const byId = new Map<string, { summary: QuestionSummary; categorySortOrder: number | null }>();

  for (const row of rows) {
    const existing = byId.get(row.id);
    const option = {
      id: row.optionId,
      position: row.optionPosition,
      text: row.optionText,
      isCorrect: row.optionIsCorrect,
    };

    if (existing) {
      existing.summary.options.push(option);
      continue;
    }

    byId.set(row.id, {
      categorySortOrder: row.categorySortOrder,
      summary: {
        id: row.id,
        origin: row.seedKey === null ? "user" : "seed",
        kind: row.kind,
        categoryId: row.categoryId,
        difficulty: row.difficulty,
        prompt: row.prompt,
        explanation: row.explanation,
        isActive: row.isActive,
        options: [option],
      },
    });
  }

  const grouped = [...byId.values()];
  for (const entry of grouped) {
    entry.summary.options.sort((a, b) => a.position - b.position);
  }
  return grouped;
}

export async function listQuestions(): Promise<QuestionSummary[]> {
  const rows = await selectQuestionRows().where(eq(questions.isActive, true));

  // Stable order for the authoring list: regular before bonus, then by wheel
  // order (bonus questions last), difficulty and prompt.
  return groupRows(rows)
    .sort(
      (a, b) =>
        KIND_ORDER[a.summary.kind] - KIND_ORDER[b.summary.kind] ||
        (a.categorySortOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.categorySortOrder ?? Number.MAX_SAFE_INTEGER) ||
        DIFFICULTY_ORDER[a.summary.difficulty] - DIFFICULTY_ORDER[b.summary.difficulty] ||
        a.summary.prompt.localeCompare(b.summary.prompt, "sv"),
    )
    .map((entry) => entry.summary);
}

export async function getQuestionSummary(questionId: string): Promise<QuestionSummary | null> {
  const rows = await selectQuestionRows().where(eq(questions.id, questionId));
  return groupRows(rows)[0]?.summary ?? null;
}
