import "server-only";

import { and, eq } from "drizzle-orm";
import { players, scoreAdjustments } from "@/db/schema";
import { appErrors } from "@/lib/errors";
import type { GameSnapshot } from "../schemas";
import { loadGameSnapshot } from "./snapshot";
import { runGameMutation } from "./run-game-mutation";

export type AdjustScoreInput = {
  gameId: string;
  playerId: string;
  newScore: number;
};

export async function adjustScore({
  gameId,
  playerId,
  newScore,
}: AdjustScoreInput): Promise<GameSnapshot> {
  return runGameMutation(gameId, async (tx) => {
    const [player] = await tx
      .select()
      .from(players)
      .where(and(eq(players.id, playerId), eq(players.gameId, gameId)))
      .for("update");
    if (!player) throw appErrors.notFound("Player not found.");

    await tx.update(players).set({ score: newScore }).where(eq(players.id, player.id));

    await tx.insert(scoreAdjustments).values({
      gameId,
      playerId: player.id,
      oldScore: player.score,
      newScore,
    });

    return loadGameSnapshot(tx, gameId);
  });
}
