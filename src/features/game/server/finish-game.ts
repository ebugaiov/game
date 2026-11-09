import "server-only";

import { db } from "@/db/client";
import { appErrors } from "@/lib/errors";
import type { GameSnapshot } from "../schemas";
import { finalizeGame, loadGameSnapshot, lockGameForUpdate } from "./snapshot";

export type FinishGameInput = {
  gameId: string;
};

export async function finishGame({ gameId }: FinishGameInput): Promise<GameSnapshot> {
  return db.transaction(async (tx) => {
    const game = await lockGameForUpdate(tx, gameId);

    // The client may call this repeatedly while the timer hits zero.
    if (game.status === "finished") return loadGameSnapshot(tx, gameId);

    if (!game.endsAt || game.endsAt.getTime() > Date.now()) {
      throw appErrors.timeNotElapsed();
    }

    await finalizeGame(tx, gameId, "time_up");
    return loadGameSnapshot(tx, gameId);
  });
}
