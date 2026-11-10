import { deactivateQuestion } from "@/features/game/server/deactivate-question";
import { parseUuidPath, route } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export const DELETE = route<Context>(async (_request, { params }) => {
  const questionId = parseUuidPath((await params).id);
  return Response.json(await deactivateQuestion(questionId));
});
