import "server-only";

import { db } from "@/db/client";
import { games, players } from "@/db/schema";
import { appErrors } from "@/lib/errors";
import { RULES } from "../domain/rules";
import type { CreateGameInput, GameSnapshot } from "../schemas";
import { loadGameSnapshot } from "./snapshot";

export async function createGame(input: CreateGameInput): Promise<GameSnapshot> {
  if (input.players.length < 1 || input.players.length > RULES.maxPlayers) {
    throw appErrors.validation(`A game needs between 1 and ${RULES.maxPlayers} players.`);
  }

  const names = input.players.map((name, index) => {
    const trimmed = name.trim();
    if (trimmed.length > 40) {
      throw appErrors.validation("Player names may be at most 40 characters.");
    }
    return trimmed.length > 0 ? trimmed : `Spelare ${index + 1}`;
  });

  const startedAt = new Date();
  const endsAt =
    input.timeLimitMinutes > 0
      ? new Date(startedAt.getTime() + input.timeLimitMinutes * 60_000)
      : null;

  return db.transaction(async (tx) => {
    const [game] = await tx
      .insert(games)
      .values({
        difficultyFilter: input.difficulty === "all" ? null : input.difficulty,
        timeLimitMinutes: input.timeLimitMinutes,
        startedAt,
        endsAt,
      })
      .returning();

    if (!game) throw new Error("Failed to create game.");

    await tx.insert(players).values(
      names.map((name, seat) => ({
        gameId: game.id,
        seat,
        name,
      })),
    );

    return loadGameSnapshot(tx, game.id);
  });
}
