import { createQuestionSchema } from "@/features/game/schemas";
import { createQuestion } from "@/features/game/server/create-question";
import { listQuestions } from "@/features/game/server/list-questions";
import { parseJsonBody, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => Response.json(await listQuestions()));

export const POST = route(async (request: Request) => {
  const input = await parseJsonBody(request, createQuestionSchema);
  const question = await createQuestion(input);
  return Response.json(question, { status: 201 });
});
