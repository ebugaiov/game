import type {
  AdjustScoreInput,
  AnswerResult,
  CategoryDto,
  CreateGameInput,
  CreateQuestionInput,
  DrawQuestionInput,
  GameSnapshot,
  GameSummary,
  QuestionSummary,
} from "./schemas";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request<ResponseBody>(path: string, init?: RequestInit): Promise<ResponseBody> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(
      error?.error?.code ?? "internal_error",
      response.status,
      error?.error?.message ?? "The request failed.",
    );
  }

  return payload as ResponseBody;
}

export function createGame(input: CreateGameInput): Promise<GameSnapshot> {
  return request<GameSnapshot>("/api/games", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getGame(gameId: string): Promise<GameSnapshot> {
  return request<GameSnapshot>(`/api/games/${gameId}`);
}

export function listGames(limit = 20): Promise<GameSummary[]> {
  return request<GameSummary[]>(`/api/games?limit=${limit}`);
}

export function drawQuestion(gameId: string, input: DrawQuestionInput): Promise<GameSnapshot> {
  return request<GameSnapshot>(`/api/games/${gameId}/turns`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function drawBonus(gameId: string): Promise<GameSnapshot> {
  return request<GameSnapshot>(`/api/games/${gameId}/bonus`, {
    method: "POST",
  });
}

export function useFiftyFifty(gameId: string, turnId: string): Promise<GameSnapshot> {
  return request<GameSnapshot>(`/api/games/${gameId}/turns/${turnId}/fifty-fifty`, {
    method: "POST",
  });
}

export function answerQuestion(
  gameId: string,
  turnId: string,
  optionId: string,
): Promise<AnswerResult> {
  return request<AnswerResult>(`/api/games/${gameId}/turns/${turnId}/answer`, {
    method: "POST",
    body: JSON.stringify({ optionId }),
  });
}

export function adjustScore(gameId: string, input: AdjustScoreInput): Promise<GameSnapshot> {
  return request<GameSnapshot>(`/api/games/${gameId}/adjust-score`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function finishGame(gameId: string): Promise<GameSnapshot> {
  return request<GameSnapshot>(`/api/games/${gameId}/finish`, {
    method: "POST",
  });
}

export function listCategories(): Promise<CategoryDto[]> {
  return request<CategoryDto[]>("/api/categories");
}

export function listQuestions(): Promise<QuestionSummary[]> {
  return request<QuestionSummary[]>("/api/questions");
}

export function createQuestion(input: CreateQuestionInput): Promise<QuestionSummary> {
  return request<QuestionSummary>("/api/questions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteQuestion(questionId: string): Promise<QuestionSummary> {
  return request<QuestionSummary>(`/api/questions/${questionId}`, {
    method: "DELETE",
  });
}
