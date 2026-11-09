import { answerQuestion } from "@/features/game/server/answer-question";
import { answerQuestionSchema } from "@/features/game/schemas";
import { parseJsonBody, parseUuidPath, route } from "@/lib/http";

type Context = { params: Promise<{ id: string; turnId: string }> };

export const POST = route<Context>(async (request, { params }) => {
  const { id, turnId } = await params;
  const input = await parseJsonBody(request, answerQuestionSchema);
  const result = await answerQuestion({
    gameId: parseUuidPath(id),
    turnId: parseUuidPath(turnId),
    optionId: input.optionId,
  });
  return Response.json(result);
});
