import { parseJsonBody, parseQuery, route } from "@/lib/http";
import { createGame } from "@/features/game/server/create-game";
import { listGames } from "@/features/game/server/list-games";
import { createGameSchema, listGamesQuerySchema } from "@/features/game/schemas";

export const POST = route(async (request: Request) => {
  const input = await parseJsonBody(request, createGameSchema);
  const snapshot = await createGame(input);
  return Response.json(snapshot, { status: 201 });
});

export const GET = route(async (request: Request) => {
  const query = parseQuery(request, listGamesQuerySchema);
  return Response.json(await listGames({ limit: query.limit }));
});
