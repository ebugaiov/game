import { drawBonus } from "@/features/game/server/draw-bonus";
import { parseUuidPath, route } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export const POST = route<Context>(async (_request, { params }) => {
  const gameId = parseUuidPath((await params).id);
  const snapshot = await drawBonus({ gameId });
  return Response.json(snapshot, { status: 201 });
});
