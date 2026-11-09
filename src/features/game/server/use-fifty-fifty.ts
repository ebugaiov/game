import "server-only";

import { and, eq } from "drizzle-orm";
import { questionOptions, turns } from "@/db/schema";
import { appErrors } from "@/lib/errors";
import type { GameSnapshot } from "../schemas";
import { loadGameSnapshot } from "./snapshot";
import { runGameMutation } from "./run-game-mutation";

export type UseFiftyFiftyInput = {
  gameId: string;
  turnId: string;
};

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export async function useFiftyFifty({ gameId, turnId }: UseFiftyFiftyInput): Promise<GameSnapshot> {
  return runGameMutation(gameId, async (tx) => {
    const [turn] = await tx
      .select()
      .from(turns)
      .where(and(eq(turns.id, turnId), eq(turns.gameId, gameId)))
      .for("update");
    if (!turn) throw appErrors.notFound("Turn not found.");
    if (turn.answeredAt) throw appErrors.turnAlreadyAnswered();

    // The lifeline is once per question; a repeat call is a safe no-op.
    if (turn.fiftyFiftyUsed) return loadGameSnapshot(tx, gameId);

    const wrongOptions = await tx
      .select({ id: questionOptions.id })
      .from(questionOptions)
      .where(
        and(eq(questionOptions.questionId, turn.questionId), eq(questionOptions.isCorrect, false)),
      );

    const hiddenOptionIds = shuffled(wrongOptions)
      .slice(0, 2)
      .map((option) => option.id);

    await tx
      .update(turns)
      .set({ fiftyFiftyUsed: true, hiddenOptionIds })
      .where(eq(turns.id, turn.id));

    return loadGameSnapshot(tx, gameId);
  });
}
