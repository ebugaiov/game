import { adjustScore } from "@/features/game/server/adjust-score";
import { adjustScoreSchema } from "@/features/game/schemas";
import { parseJsonBody, parseUuidPath, route } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export const POST = route<Context>(async (request, { params }) => {
  const gameId = parseUuidPath((await params).id);
  const input = await parseJsonBody(request, adjustScoreSchema);
  const snapshot = await adjustScore({ gameId, ...input });
  return Response.json(snapshot);
});
