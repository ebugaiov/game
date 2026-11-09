import "server-only";

import { z } from "zod";
import { AppError, appErrors } from "@/lib/errors";

type RouteHandler<Context> = (request: Request, context: Context) => Promise<Response>;

export function route<Context>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("Unhandled API error", error);
  return Response.json(
    { error: { code: "internal_error", message: "An unexpected error occurred." } },
    { status: 500 },
  );
}

export function parseUuidPath(value: string): string {
  const result = z.uuid().safeParse(value);
  if (!result.success) throw appErrors.notFound();
  return result.data;
}

export async function parseJsonBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<z.infer<Schema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw appErrors.validation("The request body must be valid JSON.");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw appErrors.validation(formatIssues(result.error));
  }
  return result.data;
}

export function parseQuery<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): z.infer<Schema> {
  const params = new URL(request.url).searchParams;
  const raw: Record<string, string> = {};
  for (const [key, value] of params.entries()) raw[key] = value;

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw appErrors.validation(formatIssues(result.error));
  }
  return result.data;
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");
}
