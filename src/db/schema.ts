import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard", "expert"]);
export const questionKindEnum = pgEnum("question_kind", ["regular", "bonus"]);
export const gameStatusEnum = pgEnum("game_status", ["in_progress", "finished"]);
export const turnSourceEnum = pgEnum("turn_source", ["wheel", "category", "bonus"]);
export const finishReasonEnum = pgEnum("finish_reason", ["score_target", "round_limit", "time_up"]);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    icon: text("icon").notNull(),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [
    uniqueIndex("categories_sort_order_unique").on(table.sortOrder),
    check("categories_sort_order_range", sql`${table.sortOrder} >= 0`),
  ],
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Null for questions authored in the app; seed rows keep a stable key.
    seedKey: text("seed_key"),
    kind: questionKindEnum("kind").notNull(),
    categoryId: text("category_id").references(() => categories.id),
    difficulty: difficultyEnum("difficulty").notNull(),
    prompt: text("prompt").notNull(),
    explanation: text("explanation").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("questions_seed_key_unique").on(table.seedKey),
    check(
      "questions_bonus_has_no_category",
      sql`(${table.kind} = 'bonus') = (${table.categoryId} is null)`,
    ),
  ],
);

export const questionOptions = pgTable(
  "question_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
  },
  (table) => [
    uniqueIndex("question_options_question_position_unique").on(table.questionId, table.position),
    uniqueIndex("question_options_one_correct")
      .on(table.questionId)
      .where(sql`${table.isCorrect}`),
    check("question_options_position_range", sql`${table.position} between 0 and 3`),
  ],
);

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: gameStatusEnum("status").notNull().default("in_progress"),
    round: integer("round").notNull().default(1),
    currentSeat: integer("current_seat").notNull().default(0),
    difficultyFilter: difficultyEnum("difficulty_filter"),
    timeLimitMinutes: integer("time_limit_minutes").notNull().default(10),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    finishReason: finishReasonEnum("finish_reason"),
  },
  (table) => [
    check("games_round_positive", sql`${table.round} >= 1`),
    check("games_current_seat_range", sql`${table.currentSeat} between 0 and 19`),
    check("games_time_limit_range", sql`${table.timeLimitMinutes} >= 0`),
    check(
      "games_finished_fields",
      sql`(${table.status} = 'finished') = (${table.finishedAt} is not null and ${table.finishReason} is not null)`,
    ),
  ],
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    seat: integer("seat").notNull(),
    name: text("name").notNull(),
    score: integer("score").notNull().default(0),
    position: integer("position").notNull().default(0),
    bonusLeft: integer("bonus_left").notNull().default(1),
  },
  (table) => [
    uniqueIndex("players_game_seat_unique").on(table.gameId, table.seat),
    index("players_game_id_index").on(table.gameId),
    check("players_seat_range", sql`${table.seat} between 0 and 19`),
    check("players_name_length", sql`char_length(${table.name}) between 1 and 40`),
    check("players_bonus_left_non_negative", sql`${table.bonusLeft} >= 0`),
  ],
);

export const turns = pgTable(
  "turns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id),
    source: turnSourceEnum("source").notNull(),
    fiftyFiftyUsed: boolean("fifty_fifty_used").notNull().default(false),
    hiddenOptionIds: uuid("hidden_option_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    drawnAt: timestamp("drawn_at", { withTimezone: true }).notNull().defaultNow(),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    selectedOptionId: uuid("selected_option_id").references(() => questionOptions.id),
    isCorrect: boolean("is_correct"),
    pointsDelta: integer("points_delta"),
    positionDelta: integer("position_delta"),
  },
  (table) => [
    index("turns_game_id_index").on(table.gameId),
    uniqueIndex("turns_one_pending_per_game")
      .on(table.gameId)
      .where(sql`${table.answeredAt} is null`),
    check(
      "turns_answer_fields_all_or_nothing",
      sql`(
        ${table.answeredAt} is null
        and ${table.selectedOptionId} is null
        and ${table.isCorrect} is null
        and ${table.pointsDelta} is null
        and ${table.positionDelta} is null
      ) or (
        ${table.answeredAt} is not null
        and ${table.selectedOptionId} is not null
        and ${table.isCorrect} is not null
        and ${table.pointsDelta} is not null
        and ${table.positionDelta} is not null
      )`,
    ),
  ],
);

export const scoreAdjustments = pgTable(
  "score_adjustments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    oldScore: integer("old_score").notNull(),
    newScore: integer("new_score").notNull(),
    adjustedAt: timestamp("adjusted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("score_adjustments_game_id_index").on(table.gameId)],
);

export type Category = typeof categories.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Turn = typeof turns.$inferSelect;
export type ScoreAdjustment = typeof scoreAdjustments.$inferSelect;
