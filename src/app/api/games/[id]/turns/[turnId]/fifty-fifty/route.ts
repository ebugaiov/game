import { useFiftyFifty } from "@/features/game/server/use-fifty-fifty";
import { parseUuidPath, route } from "@/lib/http";

type Context = { params: Promise<{ id: string; turnId: string }> };

export const POST = route<Context>(async (_request, { params }) => {
  const { id, turnId } = await params;
  const snapshot = await useFiftyFifty({
    gameId: parseUuidPath(id),
    turnId: parseUuidPath(turnId),
  });
  return Response.json(snapshot);
});
