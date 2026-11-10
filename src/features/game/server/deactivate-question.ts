import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { questions } from "@/db/schema";
import { appErrors } from "@/lib/errors";
import type { QuestionSummary } from "../schemas";
import { getQuestionSummary } from "./list-questions";

// Soft delete: drawn turns reference the question, and keeping the row means
// game history stays readable. Seeding never writes is_active, so a retired
// seed question stays retired.
export async function deactivateQuestion(questionId: string): Promise<QuestionSummary> {
  const [row] = await db
    .update(questions)
    .set({ isActive: false })
    .where(eq(questions.id, questionId))
    .returning({ id: questions.id });
  if (!row) throw appErrors.notFound("Question not found.");

  const summary = await getQuestionSummary(row.id);
  if (!summary) throw appErrors.notFound("Question not found.");
  return summary;
}
