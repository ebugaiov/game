import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import type { DbOrTx, Transaction } from "@/db/client";
import { games, players, questions, questionOptions, turns } from "@/db/schema";
import type { Game } from "@/db/schema";
import { pickWinner } from "../domain/end";
import type { FinishReason } from "../domain/types";
import type { GameSnapshot, PendingTurn } from "../schemas";
import { appErrors } from "@/lib/errors";

export async function lockGameForUpdate(tx: Transaction, gameId: string): Promise<Game> {
  const [game] = await tx.select().from(games).where(eq(games.id, gameId)).for("update");
  if (!game) throw appErrors.notFound("Game not found.");
  return game;
}

export async function findPendingTurn(db: DbOrTx, gameId: string) {
  const [pending] = await db
    .select()
    .from(turns)
    .where(and(eq(turns.gameId, gameId), isNull(turns.answeredAt)))
    .limit(1);
  return pending ?? null;
}

export async function finalizeGame(
  tx: Transaction,
  gameId: string,
  reason: FinishReason,
): Promise<void> {
  await tx
    .update(games)
    .set({
      status: "finished",
      finishedAt: new Date(),
      finishReason: reason,
    })
    .where(and(eq(games.id, gameId), eq(games.status, "in_progress")));
}

/** Throws `game_finished` when the game is over or the server clock passed `ends_at`. */
export async function ensurePlayable(tx: Transaction, game: Game): Promise<void> {
  if (game.status === "finished") throw appErrors.gameFinished();

  if (game.endsAt && game.endsAt.getTime() <= Date.now()) {
    await finalizeGame(tx, game.id, "time_up");
    throw appErrors.gameFinished();
  }
}

export async function loadGameSnapshot(db: DbOrTx, gameId: string): Promise<GameSnapshot> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game) throw appErrors.notFound("Game not found.");

  const playerRows = await db
    .select()
    .from(players)
    .where(eq(players.gameId, gameId))
    .orderBy(players.seat);

  const pending = await findPendingTurn(db, gameId);
  let pendingTurn: PendingTurn | null = null;

  if (pending) {
    const [question] = await db
      .select({
        id: questions.id,
        kind: questions.kind,
        categoryId: questions.categoryId,
        difficulty: questions.difficulty,
        prompt: questions.prompt,
      })
      .from(questions)
      .where(eq(questions.id, pending.questionId));

    if (!question) {
      throw new Error(`Pending turn references missing question ${pending.questionId}.`);
    }

    const options = await db
      .select({
        id: questionOptions.id,
        position: questionOptions.position,
        text: questionOptions.text,
      })
      .from(questionOptions)
      .where(eq(questionOptions.questionId, question.id))
      .orderBy(questionOptions.position);

    pendingTurn = {
      id: pending.id,
      playerId: pending.playerId,
      source: pending.source,
      hiddenOptionIds: pending.hiddenOptionIds,
      question: { ...question, options },
    };
  }

  const finish =
    game.status === "finished" && game.finishReason
      ? {
          reason: game.finishReason,
          winnerPlayerId: pickWinner(playerRows).id,
        }
      : null;

  return {
    id: game.id,
    status: game.status,
    round: game.round,
    currentSeat: game.currentSeat,
    difficulty: game.difficultyFilter,
    timeLimitMinutes: game.timeLimitMinutes,
    startedAt: game.startedAt.toISOString(),
    endsAt: game.endsAt ? game.endsAt.toISOString() : null,
    serverTime: new Date().toISOString(),
    finish,
    players: playerRows.map((player) => ({
      id: player.id,
      seat: player.seat,
      name: player.name,
      score: player.score,
      position: player.position,
      bonusLeft: player.bonusLeft,
    })),
    pendingTurn,
  };
}
