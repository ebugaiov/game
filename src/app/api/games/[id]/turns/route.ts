import { drawQuestion } from "@/features/game/server/draw-question";
import { drawQuestionSchema } from "@/features/game/schemas";
import { parseJsonBody, parseUuidPath, route } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export const POST = route<Context>(async (request, { params }) => {
  const gameId = parseUuidPath((await params).id);
  const input = await parseJsonBody(request, drawQuestionSchema);
  const snapshot = await drawQuestion({ gameId, ...input });
  return Response.json(snapshot, { status: 201 });
});
