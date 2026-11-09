import "server-only";

import { and, eq } from "drizzle-orm";
import { players, questions, turns } from "@/db/schema";
import { appErrors } from "@/lib/errors";
import type { GameSnapshot } from "../schemas";
import { findPendingTurn, loadGameSnapshot } from "./snapshot";
import { runGameMutation } from "./run-game-mutation";

export type DrawBonusInput = {
  gameId: string;
};

export async function drawBonus({ gameId }: DrawBonusInput): Promise<GameSnapshot> {
  return runGameMutation(gameId, async (tx, game) => {
    if (await findPendingTurn(tx, gameId)) throw appErrors.pendingTurnExists();

    const [player] = await tx
      .select({ id: players.id, bonusLeft: players.bonusLeft })
      .from(players)
      .where(and(eq(players.gameId, gameId), eq(players.seat, game.currentSeat)));
    if (!player) throw appErrors.notFound("Current player not found.");
    if (player.bonusLeft <= 0) throw appErrors.bonusExhausted();

    const bonusQuestions = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.kind, "bonus"), eq(questions.isActive, true)));
    if (bonusQuestions.length === 0) throw appErrors.noQuestionsAvailable();

    const chosen = bonusQuestions[Math.floor(Math.random() * bonusQuestions.length)]!;

    await tx.insert(turns).values({
      gameId,
      playerId: player.id,
      questionId: chosen.id,
      source: "bonus",
    });

    return loadGameSnapshot(tx, gameId);
  });
}
