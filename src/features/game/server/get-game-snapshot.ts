import "server-only";

import { db } from "@/db/client";
import type { GameSnapshot } from "../schemas";
import { finalizeGame, loadGameSnapshot, lockGameForUpdate } from "./snapshot";

export async function getGameSnapshot(gameId: string): Promise<GameSnapshot> {
  return db.transaction(async (tx) => {
    const game = await lockGameForUpdate(tx, gameId);

    if (game.status === "in_progress" && game.endsAt && game.endsAt.getTime() <= Date.now()) {
      await finalizeGame(tx, gameId, "time_up");
    }

    return loadGameSnapshot(tx, gameId);
  });
}
