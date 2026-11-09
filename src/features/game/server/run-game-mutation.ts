import "server-only";

import type { Transaction } from "@/db/client";
import { db } from "@/db/client";
import type { Game } from "@/db/schema";
import { appErrors } from "@/lib/errors";
import { finalizeGame, lockGameForUpdate } from "./snapshot";

type MutationOutcome<Result> = { finished: true } | { finished: false; value: Result };

/**
 * Runs a game mutation under the games row lock. If the match timer has
 * expired, the game is finalized first and the transaction is committed;
 * only then does the caller receive `game_finished`.
 */
export async function runGameMutation<Result>(
  gameId: string,
  handler: (tx: Transaction, game: Game) => Promise<Result>,
): Promise<Result> {
  const outcome = await db.transaction(async (tx): Promise<MutationOutcome<Result>> => {
    const game = await lockGameForUpdate(tx, gameId);

    if (game.status === "finished") return { finished: true };

    if (game.endsAt && game.endsAt.getTime() <= Date.now()) {
      await finalizeGame(tx, gameId, "time_up");
      return { finished: true };
    }

    return { finished: false, value: await handler(tx, game) };
  });

  if (outcome.finished) throw appErrors.gameFinished();
  return outcome.value;
}
