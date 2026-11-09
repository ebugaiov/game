import "server-only";

import { and, desc, eq, inArray, isNotNull, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { games, players } from "@/db/schema";
import { pickWinner } from "../domain/end";
import type { GameSummary } from "../schemas";
import { finalizeGame } from "./snapshot";

export type ListGamesInput = {
  limit: number;
};

export async function listGames({ limit }: ListGamesInput): Promise<GameSummary[]> {
  return db.transaction(async (tx) => {
    const now = new Date();

    // Listing is still a read: expired games are finalized before they are shown.
    const expired = await tx
      .select({ id: games.id })
      .from(games)
      .where(and(eq(games.status, "in_progress"), isNotNull(games.endsAt), lte(games.endsAt, now)))
      .for("update");

    for (const game of expired) {
      await finalizeGame(tx, game.id, "time_up");
    }

    const gameRows = await tx
      .select({
        id: games.id,
        startedAt: games.startedAt,
        status: games.status,
        round: games.round,
      })
      .from(games)
      .orderBy(desc(games.startedAt))
      .limit(limit);

    if (gameRows.length === 0) return [];

    const playerRows = await tx
      .select({
        id: players.id,
        gameId: players.gameId,
        seat: players.seat,
        name: players.name,
        score: players.score,
      })
      .from(players)
      .where(
        inArray(
          players.gameId,
          gameRows.map((game) => game.id),
        ),
      )
      .orderBy(players.seat);

    const playersByGame = new Map<string, typeof playerRows>();
    for (const player of playerRows) {
      const list = playersByGame.get(player.gameId);
      if (list) list.push(player);
      else playersByGame.set(player.gameId, [player]);
    }

    return gameRows.map((game) => {
      const gamePlayers = playersByGame.get(game.id) ?? [];
      const winner =
        game.status === "finished" && gamePlayers.length > 0 ? pickWinner(gamePlayers) : null;

      return {
        id: game.id,
        startedAt: game.startedAt.toISOString(),
        status: game.status,
        round: game.round,
        playerCount: gamePlayers.length,
        winner: winner ? { playerId: winner.id, name: winner.name, score: winner.score } : null,
      };
    });
  });
}
