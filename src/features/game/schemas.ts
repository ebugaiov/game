import { z } from "zod";
import { DIFFICULTIES, FINISH_REASONS } from "./domain/types";

export const difficultySchema = z.enum(DIFFICULTIES);
export const finishReasonSchema = z.enum(FINISH_REASONS);
export const gameStatusSchema = z.enum(["in_progress", "finished"]);
export const turnSourceSchema = z.enum(["wheel", "category", "bonus"]);
export const questionKindSchema = z.enum(["regular", "bonus"]);

const timeLimitSchema = z.union([
  z.literal(0),
  z.literal(5),
  z.literal(10),
  z.literal(15),
  z.literal(20),
  z.literal(30),
]);

export const createGameSchema = z.object({
  timeLimitMinutes: timeLimitSchema,
  difficulty: z.union([z.literal("all"), difficultySchema]),
  players: z.array(z.string().trim().max(40)).min(1).max(20),
});
export type CreateGameInput = z.infer<typeof createGameSchema>;

export const drawQuestionSchema = z.object({
  categoryId: z.string().min(1),
  source: z.enum(["wheel", "category"]),
});
export type DrawQuestionInput = z.infer<typeof drawQuestionSchema>;

export const answerQuestionSchema = z.object({
  optionId: z.uuid(),
});
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;

export const adjustScoreSchema = z.object({
  playerId: z.uuid(),
  newScore: z.number().int().min(-10000).max(100000),
});
export type AdjustScoreInput = z.infer<typeof adjustScoreSchema>;

export const listGamesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListGamesQuery = z.infer<typeof listGamesQuerySchema>;

export const gameIdSchema = z.uuid();

export const categoryDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  sortOrder: z.number().int(),
});
export type CategoryDto = z.infer<typeof categoryDtoSchema>;

const playerSnapshotSchema = z.object({
  id: z.uuid(),
  seat: z.number().int(),
  name: z.string(),
  score: z.number().int(),
  position: z.number().int(),
  bonusLeft: z.number().int(),
});
export type PlayerSnapshot = z.infer<typeof playerSnapshotSchema>;

const questionOptionSnapshotSchema = z.object({
  id: z.uuid(),
  position: z.number().int(),
  text: z.string(),
});
export type QuestionOptionSnapshot = z.infer<typeof questionOptionSnapshotSchema>;

const pendingQuestionSchema = z.object({
  id: z.uuid(),
  kind: questionKindSchema,
  categoryId: z.string().nullable(),
  difficulty: difficultySchema,
  prompt: z.string(),
  options: z.array(questionOptionSnapshotSchema),
});
export type PendingQuestion = z.infer<typeof pendingQuestionSchema>;

const pendingTurnSchema = z.object({
  id: z.uuid(),
  playerId: z.uuid(),
  source: turnSourceSchema,
  hiddenOptionIds: z.array(z.uuid()),
  question: pendingQuestionSchema,
});
export type PendingTurn = z.infer<typeof pendingTurnSchema>;

const finishSchema = z.object({
  reason: finishReasonSchema,
  winnerPlayerId: z.uuid(),
});
export type GameFinish = z.infer<typeof finishSchema>;

export const gameSnapshotSchema = z.object({
  id: z.uuid(),
  status: gameStatusSchema,
  round: z.number().int(),
  currentSeat: z.number().int(),
  difficulty: difficultySchema.nullable(),
  timeLimitMinutes: z.number().int(),
  startedAt: z.iso.datetime(),
  endsAt: z.iso.datetime().nullable(),
  serverTime: z.iso.datetime(),
  finish: finishSchema.nullable(),
  players: z.array(playerSnapshotSchema),
  pendingTurn: pendingTurnSchema.nullable(),
});
export type GameSnapshot = z.infer<typeof gameSnapshotSchema>;

export const answerResultSchema = z.object({
  turnId: z.uuid(),
  isCorrect: z.boolean(),
  correctOptionId: z.uuid(),
  explanation: z.string(),
  pointsDelta: z.number().int(),
  positionDelta: z.number().int(),
  game: gameSnapshotSchema,
});
export type AnswerResult = z.infer<typeof answerResultSchema>;

const gameSummaryWinnerSchema = z.object({
  playerId: z.uuid(),
  name: z.string(),
  score: z.number().int(),
});

export const gameSummarySchema = z.object({
  id: z.uuid(),
  startedAt: z.iso.datetime(),
  status: gameStatusSchema,
  round: z.number().int(),
  playerCount: z.number().int(),
  winner: gameSummaryWinnerSchema.nullable(),
});
export type GameSummary = z.infer<typeof gameSummarySchema>;
