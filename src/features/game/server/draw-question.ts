import "server-only";

import { and, eq } from "drizzle-orm";
import { categories, players, questions, turns } from "@/db/schema";
import { appErrors } from "@/lib/errors";
import { selectQuestion } from "../domain/selection";
import type { GameSnapshot } from "../schemas";
import { findPendingTurn, loadGameSnapshot } from "./snapshot";
import { runGameMutation } from "./run-game-mutation";

export type DrawQuestionInput = {
  gameId: string;
  categoryId: string;
  source: "wheel" | "category";
};

export async function drawQuestion({
  gameId,
  categoryId,
  source,
}: DrawQuestionInput): Promise<GameSnapshot> {
  return runGameMutation(gameId, async (tx, game) => {
    const [category] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryId));
    if (!category) throw appErrors.notFound("Category not found.");

    if (await findPendingTurn(tx, gameId)) throw appErrors.pendingTurnExists();

    const candidates = await tx
      .select({ id: questions.id, difficulty: questions.difficulty })
      .from(questions)
      .where(
        and(
          eq(questions.kind, "regular"),
          eq(questions.categoryId, categoryId),
          eq(questions.isActive, true),
        ),
      );

    const usedRows = await tx
      .select({ questionId: turns.questionId })
      .from(turns)
      .where(eq(turns.gameId, gameId));
    const usedIds = new Set(usedRows.map((row) => row.questionId));

    const selected = selectQuestion({
      candidates,
      usedIds,
      filter: game.difficultyFilter,
      rng: Math.random,
    });
    if (!selected) throw appErrors.noQuestionsAvailable();

    const [player] = await tx
      .select({ id: players.id })
      .from(players)
      .where(and(eq(players.gameId, gameId), eq(players.seat, game.currentSeat)));
    if (!player) throw appErrors.notFound("Current player not found.");

    await tx.insert(turns).values({
      gameId,
      playerId: player.id,
      questionId: selected.id,
      source,
    });

    return loadGameSnapshot(tx, gameId);
  });
}
