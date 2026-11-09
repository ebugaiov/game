import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { games, questionOptions } from "@/db/schema";
import type { Difficulty } from "@/features/game/domain/types";
import { createGame } from "@/features/game/server/create-game";
import { drawQuestion } from "@/features/game/server/draw-question";
import type { GameSnapshot } from "@/features/game/schemas";

export async function resetGames(): Promise<void> {
  await db.execute(sql`truncate table "games" cascade`);
}

export async function createTestGame(
  options: {
    players?: string[];
    timeLimitMinutes?: 0 | 5 | 10 | 15 | 20 | 30;
    difficulty?: Difficulty | "all";
  } = {},
): Promise<GameSnapshot> {
  return createGame({
    players: options.players ?? ["Sven Svarvare", "Gunnar Gjutare"],
    timeLimitMinutes: options.timeLimitMinutes ?? 0,
    difficulty: options.difficulty ?? "all",
  });
}

export async function drawTestQuestion(
  gameId: string,
  categoryId = "huvudsats",
): Promise<GameSnapshot> {
  return drawQuestion({ gameId, categoryId, source: "category" });
}

export async function correctOptionId(questionId: string): Promise<string> {
  const [row] = await db
    .select({ id: questionOptions.id })
    .from(questionOptions)
    .where(and(eq(questionOptions.questionId, questionId), eq(questionOptions.isCorrect, true)))
    .limit(1);
  if (!row) throw new Error("Question has no correct option.");
  return row.id;
}

export async function wrongOptionId(questionId: string): Promise<string> {
  const [row] = await db
    .select({ id: questionOptions.id })
    .from(questionOptions)
    .where(and(eq(questionOptions.questionId, questionId), eq(questionOptions.isCorrect, false)))
    .limit(1);
  if (!row) throw new Error("Question has no wrong option.");
  return row.id;
}

export async function expireGame(gameId: string): Promise<void> {
  await db
    .update(games)
    .set({ endsAt: new Date(Date.now() - 1000) })
    .where(eq(games.id, gameId));
}
