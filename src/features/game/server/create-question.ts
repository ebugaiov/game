import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, questionOptions, questions } from "@/db/schema";
import { appErrors } from "@/lib/errors";
import type { CreateQuestionInput, QuestionSummary } from "../schemas";
import { getQuestionSummary } from "./list-questions";

export async function createQuestion(input: CreateQuestionInput): Promise<QuestionSummary> {
  const questionId = await db.transaction(async (tx) => {
    if (input.kind === "regular") {
      const [category] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, input.categoryId));
      if (!category) throw appErrors.notFound("Category not found.");
    }

    const [row] = await tx
      .insert(questions)
      .values({
        // A null seed key marks the question as authored in the app, so seeding
        // never touches it.
        kind: input.kind,
        categoryId: input.kind === "regular" ? input.categoryId : null,
        difficulty: input.difficulty,
        prompt: input.prompt,
        explanation: input.explanation,
      })
      .returning({ id: questions.id });
    if (!row) throw new Error("Failed to insert question.");

    await tx.insert(questionOptions).values(
      input.options.map((option, position) => ({
        questionId: row.id,
        position,
        text: option.text,
        isCorrect: option.isCorrect,
      })),
    );

    return row.id;
  });

  const summary = await getQuestionSummary(questionId);
  if (!summary) throw new Error("Failed to load the created question.");
  return summary;
}
