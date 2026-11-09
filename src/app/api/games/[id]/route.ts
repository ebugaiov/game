import { getGameSnapshot } from "@/features/game/server/get-game-snapshot";
import { parseUuidPath, route } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export const GET = route<Context>(async (_request, { params }) => {
  const gameId = parseUuidPath((await params).id);
  return Response.json(await getGameSnapshot(gameId));
});
