CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard', 'expert');--> statement-breakpoint
CREATE TYPE "public"."finish_reason" AS ENUM('score_target', 'round_limit', 'time_up');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('in_progress', 'finished');--> statement-breakpoint
CREATE TYPE "public"."question_kind" AS ENUM('regular', 'bonus');--> statement-breakpoint
CREATE TYPE "public"."turn_source" AS ENUM('wheel', 'category', 'bonus');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"icon" text NOT NULL,
	"sort_order" integer NOT NULL,
	CONSTRAINT "categories_sort_order_range" CHECK ("categories"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "game_status" DEFAULT 'in_progress' NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"current_seat" integer DEFAULT 0 NOT NULL,
	"difficulty_filter" "difficulty",
	"time_limit_minutes" integer DEFAULT 10 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"finish_reason" "finish_reason",
	CONSTRAINT "games_round_positive" CHECK ("games"."round" >= 1),
	CONSTRAINT "games_current_seat_range" CHECK ("games"."current_seat" between 0 and 19),
	CONSTRAINT "games_time_limit_range" CHECK ("games"."time_limit_minutes" >= 0),
	CONSTRAINT "games_finished_fields" CHECK (("games"."status" = 'finished') = ("games"."finished_at" is not null and "games"."finish_reason" is not null))
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"seat" integer NOT NULL,
	"name" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"bonus_left" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "players_seat_range" CHECK ("players"."seat" between 0 and 19),
	CONSTRAINT "players_name_length" CHECK (char_length("players"."name") between 1 and 40),
	CONSTRAINT "players_bonus_left_non_negative" CHECK ("players"."bonus_left" >= 0)
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	CONSTRAINT "question_options_position_range" CHECK ("question_options"."position" between 0 and 3)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed_key" text NOT NULL,
	"kind" "question_kind" NOT NULL,
	"category_id" text,
	"difficulty" "difficulty" NOT NULL,
	"prompt" text NOT NULL,
	"explanation" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "questions_bonus_has_no_category" CHECK (("questions"."kind" = 'bonus') = ("questions"."category_id" is null))
);
--> statement-breakpoint
CREATE TABLE "score_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"old_score" integer NOT NULL,
	"new_score" integer NOT NULL,
	"adjusted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"source" "turn_source" NOT NULL,
	"fifty_fifty_used" boolean DEFAULT false NOT NULL,
	"hidden_option_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"drawn_at" timestamp with time zone DEFAULT now() NOT NULL,
	"answered_at" timestamp with time zone,
	"selected_option_id" uuid,
	"is_correct" boolean,
	"points_delta" integer,
	"position_delta" integer,
	CONSTRAINT "turns_answer_fields_all_or_nothing" CHECK ((
        "turns"."answered_at" is null
        and "turns"."selected_option_id" is null
        and "turns"."is_correct" is null
        and "turns"."points_delta" is null
        and "turns"."position_delta" is null
      ) or (
        "turns"."answered_at" is not null
        and "turns"."selected_option_id" is not null
        and "turns"."is_correct" is not null
        and "turns"."points_delta" is not null
        and "turns"."position_delta" is not null
      ))
);
--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_adjustments" ADD CONSTRAINT "score_adjustments_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_adjustments" ADD CONSTRAINT "score_adjustments_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_selected_option_id_question_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."question_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_sort_order_unique" ON "categories" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "players_game_seat_unique" ON "players" USING btree ("game_id","seat");--> statement-breakpoint
CREATE INDEX "players_game_id_index" ON "players" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "question_options_question_position_unique" ON "question_options" USING btree ("question_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "question_options_one_correct" ON "question_options" USING btree ("question_id") WHERE "question_options"."is_correct";--> statement-breakpoint
CREATE UNIQUE INDEX "questions_seed_key_unique" ON "questions" USING btree ("seed_key");--> statement-breakpoint
CREATE INDEX "score_adjustments_game_id_index" ON "score_adjustments" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "turns_game_id_index" ON "turns" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "turns_one_pending_per_game" ON "turns" USING btree ("game_id") WHERE "turns"."answered_at" is null;