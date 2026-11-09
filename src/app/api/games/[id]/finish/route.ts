import { finishGame } from "@/features/game/server/finish-game";
import { parseUuidPath, route } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export const POST = route<Context>(async (_request, { params }) => {
  const gameId = parseUuidPath((await params).id);
  return Response.json(await finishGame({ gameId }));
});
