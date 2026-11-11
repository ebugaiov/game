# AGENTS.md

Instructions for AI coding agents and humans working in this repo. Read fully before changing code. If a prompt contradicts this file, ask before proceeding.

## 1. Project

**Industrins Svenska**: a shared-screen Swedish grammar board game for vocational students (GY25, workshop/industry vocabulary). One screen, 1–20 players. On their turn a player spins a 12-slice wheel (or picks a category), answers a 4-option multiple-choice question, wins or loses "Coins", and moves on a 20-tile board. Extras: 50/50 lifeline, one expert bonus question per player, match timer, rules dialog, victory podium.

- UI language: **Swedish**. Code, comments, identifiers, commits: **English**.
- Current behavior lives in `legacy/index.html`: a single-file prototype (Tailwind CDN, vanilla JS, all state in memory, 12 categories, 36 questions + 3 bonus questions hardcoded). It is the behavioral reference. Do not edit it. Delete it only after parity is verified.
- Goal: a Next.js app where content and game state live in PostgreSQL. **Port the gameplay exactly as specified in §7; do not redesign it.**
- `legacy/index.html` is the original upload with the Gmail "save page" wrapper stripped (the upload had Gmail UI text before `<!DOCTYPE html>` and after `</html>`).

## 2. Stack (fixed decisions, do not re-litigate)

| Concern | Choice |
|---|---|
| Runtime / package manager | Node 22 LTS, pnpm via corepack (pin `packageManager` in `package.json`) |
| Framework | Next.js App Router, TypeScript `strict` |
| Styling | Tailwind (installed, not CDN), `lucide-react` icons, DM Sans + Fraunces via `next/font` |
| Database | PostgreSQL 17 in Docker |
| ORM / migrations | Drizzle ORM + drizzle-kit, driver `pg`. Validated with drizzle-orm 0.45, drizzle-kit 0.31, pg 8, zod 4 |
| Validation | Zod at every boundary: HTTP bodies, env, seed files |
| Tests | Vitest |
| Lint / format | ESLint (Next config), Prettier |

Not in v1: auth, WebSockets / multi-device, global state library, i18n framework, admin UI, Drizzle relations API (use explicit joins). Do not add them unasked.

## 3. Setup and commands

First-time setup:

```bash
pnpm create next-app@latest .   # TypeScript, ESLint, Tailwind, App Router, src/ dir, alias @/*
# then unzip/copy the starter pack on top (it only adds files; it has no package.json/tsconfig)
pnpm add drizzle-orm pg zod lucide-react server-only
pnpm add -D drizzle-kit tsx @types/pg vitest prettier
cp .env.example .env
# next.config.ts -> output: "standalone"
docker compose up -d --wait db
pnpm db:migrate && pnpm db:seed
pnpm dev                         # http://localhost:3000
```

Add to `package.json` `scripts`:

```json
{
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx src/db/migrate.ts",
  "db:migrate:test": "tsx src/db/migrate.ts --test",
  "db:seed": "tsx src/db/seed.ts",
  "db:seed:test": "tsx src/db/seed.ts --test"
}
```

If pnpm reports ignored build scripts, run `pnpm approve-builds` and allow `esbuild` and `sharp`.

## 4. Repository layout

```
AGENTS.md  Dockerfile  docker-compose.yml  .env.example  drizzle.config.ts
docker/postgres/init/01-create-test-db.sh   # creates <db>_test on first volume init
data/seed/                                  # categories.json, questions.json, bonus-questions.json
legacy/index.html                           # reference only
src/
  app/                                      # routing only; no business logic
    page.tsx                                # setup -> creates game -> redirect
    games/[id]/page.tsx                     # board; loads snapshot server-side
    history/page.tsx
    api/health/route.ts
    api/games/route.ts                      # POST create, GET list
    api/games/[id]/route.ts                 # GET snapshot
    api/games/[id]/turns/route.ts           # POST draw question
    api/games/[id]/turns/[turnId]/fifty-fifty/route.ts
    api/games/[id]/turns/[turnId]/answer/route.ts
    api/games/[id]/bonus/route.ts
    api/games/[id]/adjust-score/route.ts
    api/games/[id]/finish/route.ts
  features/game/
    domain/        # pure TS, no I/O, imports nothing from the project. Used by server AND client
    server/        # use-cases (one file per command) + snapshot query. `import "server-only"`
    schemas.ts     # Zod request/response schemas, inferred types
    api-client.ts  # typed fetch wrappers for the browser
    ui/            # React components and hooks ("use client")
  db/              # schema.ts, client.ts, migrate.ts, seed.ts, seed-data.ts, load-env.ts, migrations/
  lib/             # env.ts, errors.ts (AppError), http.ts (route wrapper)
tests/             # vitest: global setup, helpers
```

`src/db/*`, `src/lib/env.ts`, `data/seed/*`, `docker*`, `drizzle.config.ts` already exist and are verified. Build the rest.

## 5. Architecture rules

1. **Dependency direction:** `app/api` → `server` → `domain`; `server` → `db`; `ui` → `domain`, `schemas`, `api-client`. `ui` never imports `db` or `server`. Enforce with ESLint `no-restricted-imports`.
2. **Route handlers are thin:** parse with Zod → call exactly one use-case → map the result or `AppError` to HTTP. No SQL and no game rules in handlers.
3. **Use-cases:** `create-game`, `draw-question`, `use-fifty-fifty`, `answer-question`, `draw-bonus`, `adjust-score`, `finish-game`, `get-game-snapshot`, `list-games`. Each runs in one `db.transaction` that starts with `SELECT … FOR UPDATE` on the `games` row (serializes concurrent actions on a game), applies `domain` functions, writes, and returns a `GameSnapshot`.
4. **No repository interfaces, abstract classes or DI container.** Queries are plain functions taking `DbOrTx` (`src/db/client.ts`).
5. **Server is authoritative.** The client never sends scores, positions, correctness or timestamps. The correct option and the explanation are never sent before the answer is submitted. The 50/50 option removal is chosen server-side.
6. **Server clock only.** `games.ends_at` is stored; the snapshot carries `serverTime`; the client countdown is `endsAt − (serverTime + elapsed since response)`. Any read or mutation after `ends_at` finalizes the game as `time_up`; mutations then return 409 `game_finished`.
7. **Errors:** use-cases throw `AppError(code, httpStatus, message)`. One wrapper in `lib/http.ts` returns `{ "error": { "code", "message" } }`. Unknown errors: log, return 500 `internal_error`, leak nothing.
8. **Env:** only via `getEnv()` in `src/lib/env.ts` (CLI scripts in `src/db` read `process.env` directly).
9. **Types:** derive from Drizzle (`$inferSelect`) and Zod (`z.infer`). No hand-written duplicate DTOs, no `any`, no unexplained `!`.
10. **Rendering:** never `dangerouslySetInnerHTML`; player names and question text render as text.
11. **Security posture of v1:** no auth. The game UUID is the access token; `/history` lists every game. Do not expose the app on a public network before auth exists.

## 6. Data model

Source of truth: `src/db/schema.ts`. Initial migration: `src/db/migrations/0000_init.sql`.

| Table | Purpose / key constraints |
|---|---|
| `categories` | 12 wheel slices, seeded. `id` is a slug (`huvudsats`), `sort_order` unique (slice order and board tile pattern) |
| `questions` | 39 seeded (36 `regular` + 3 `bonus`). `seed_key` unique. CHECK: `kind = 'bonus'` ⇔ `category_id IS NULL`. Bonus questions use `difficulty = 'expert'` |
| `question_options` | 4 per question, `position` 0–3, unique per question. Partial unique index: at most one `is_correct` per question (seed validator enforces exactly one) |
| `games` | settings (`difficulty_filter` null = all, `time_limit_minutes` 0 = unlimited), `status`, `round`, `current_seat`, `ends_at`, `finish_reason`. CHECK: finished ⇔ `finished_at` and `finish_reason` set |
| `players` | `seat` 0–19 unique per game (turn order), `name` ≤ 40, `score` (can be negative), `position` (unbounded; board shows `% 20`), `bonus_left`. Emoji and color are derived from `seat` in the UI, not stored |
| `turns` | One row per question shown. Inserted when drawn (pending: `answered_at IS NULL`), completed on answer. Partial unique index: **max one pending turn per game**. CHECK: answer fields all null or all set. Also the source of "questions already used in this game" |
| `score_adjustments` | Audit rows for manual score edits |

## 7. Game rules (behavioral contract, extracted from `legacy/index.html`)

| Rule | Value |
|---|---|
| Players | 1–20. Name trimmed, ≤ 40 chars; empty → `Spelare {n}` (n = seat + 1) |
| Default setup | 2 players (`Sven Svarvare`, `Gunnar Gjutare`), 10 min, difficulty all |
| Player presets | 2 / 4 / 8 / 12. Names in order: Sven Svarvare, Gunnar Gjutare, Maria Miljö, Kurt Kugg, Anna Automation, Bengt Beredare, Lasse Laser, Frida Fräs; beyond 8 → `Spelare n` |
| Time limit | 0 (unlimited), 5, 10, 15, 20, 30 minutes |
| Difficulty filter | all, easy, medium, hard, expert (UI: Alla, Lätt, Medel, Svår, Expert) |
| Base points (correct) | easy 100, medium 150, hard 200, expert 300 |
| 50/50 | Once per question; hides 2 wrong options; a correct answer then awards **flat 50** regardless of difficulty |
| Wrong answer | −50, no floor |
| Movement on correct | easy/medium +1 tile, hard/expert +2 (also when 50/50 was used). Wrong: 0 |
| Bonus | Current player only, `bonus_left` starts at 1, decremented when answered. Question: random from the bonus pool (repeats allowed). Correct +1000, wrong 0. No movement, does not end the turn |
| Manual adjustment | Set any integer score for any player; write an audit row |
| Board | 20 tiles; tile `i` shows `categories[i % 12]`. Decorative only; landing has no effect |
| Win score | any player ≥ 1200 |
| Round limit | game ends when `round > 12` (DB keeps 13; UI shows `min(round, 12)`) |

**Turn flow**
1. Draw: wheel result or category click → select question → insert pending turn. Rejected with 409 `pending_turn_exists` if one is pending.
2. Optional 50/50 on the pending turn.
3. Answer: score and position updated, turn completed, then advance: `current_seat = (current_seat + 1) % n`; if it wrapped to 0, `round + 1`.
4. End check, **after a regular answer only**: any score ≥ 1200 → `score_target`; else `round > 12` → `round_limit`. Timer expiry → `time_up`.
5. Winner: highest score; ties → lowest seat.

**Question selection** (uniform random among candidates, `is_active` only):
1. category = X, difficulty = filter (skipped if "all"), not used in this game;
2. category = X, any difficulty, not used;
3. category = X, anything (reuse).

With the expert filter only 3 regular expert questions exist (`huvudsats`, 2× `masterclass`), so most categories fall through to step 2. This is intentional.

**Quirks preserved. Do not "fix" without being asked:**
- The end check does not run after a bonus answer or a manual adjustment; the game ends after the next regular answer.
- The timer keeps running while a question is open; expiry finishes the game even with a pending turn.
- Wheel randomness is client-side (a quick-pick can already choose any category, so nothing is gained by securing it).

**Intentional deviations (required by server-authoritative persistence):**
- Correct answer and explanation withheld until answered; 50/50 chosen server-side.
- Used questions tracked per game in the DB, not in an in-memory Set.
- Reload restores everything at `/games/[id]`, including a pending question and its 50/50 state.
- Names rendered as text. (The source interpolates names into `innerHTML`: XSS.)

## 8. API

All bodies JSON, validated with Zod. Error shape: `{ "error": { "code": string, "message": string } }`.

| Endpoint | Body | Success |
|---|---|---|
| `POST /api/games` | `{ timeLimitMinutes, difficulty, players: string[] }` (`difficulty`: `all` or a level) | 201 `GameSnapshot` |
| `GET /api/games?limit=20` | – | `GameSummary[]` (id, startedAt, status, round, playerCount, winner name and score) |
| `GET /api/games/:id` | – | `GameSnapshot` |
| `POST /api/games/:id/turns` | `{ categoryId, source }`, source = `wheel` or `category` | 201 `GameSnapshot` with `pendingTurn` |
| `POST /api/games/:id/bonus` | – | 201 `GameSnapshot` with `pendingTurn` (source `bonus`) |
| `POST /api/games/:id/turns/:turnId/fifty-fifty` | – | `GameSnapshot` (`hiddenOptionIds` set) |
| `POST /api/games/:id/turns/:turnId/answer` | `{ optionId }` | `AnswerResult` |
| `POST /api/games/:id/adjust-score` | `{ playerId, newScore }` (int, −10000…100000) | `GameSnapshot` |
| `POST /api/games/:id/finish` | – | `GameSnapshot`; only valid after `ends_at`, else 409 `time_not_elapsed` |
| `GET /api/health` | – | `{ "status": "ok", "db": "up" }` after `select 1` |

Error codes: `validation_error` 400, `invalid_option` 400, `not_found` 404, `game_finished` 409, `pending_turn_exists` 409, `no_pending_turn` 409, `turn_already_answered` 409, `bonus_exhausted` 409, `time_not_elapsed` 409, `no_questions_available` 409, `internal_error` 500.

```ts
type GameSnapshot = {
  id: string;
  status: "in_progress" | "finished";
  round: number;
  currentSeat: number;
  difficulty: Difficulty | null;            // null = all
  timeLimitMinutes: number;                 // 0 = unlimited
  startedAt: string; endsAt: string | null; serverTime: string;   // ISO 8601
  finish: { reason: FinishReason; winnerPlayerId: string } | null;
  players: { id: string; seat: number; name: string; score: number; position: number; bonusLeft: number }[];
  pendingTurn: {
    id: string; playerId: string; source: "wheel" | "category" | "bonus";
    hiddenOptionIds: string[];
    question: {                              // never contains isCorrect or explanation
      id: string; kind: "regular" | "bonus"; categoryId: string | null; difficulty: Difficulty; prompt: string;
      options: { id: string; position: number; text: string }[];
    };
  } | null;
};

type AnswerResult = {
  turnId: string; isCorrect: boolean; correctOptionId: string; explanation: string;
  pointsDelta: number; positionDelta: number; game: GameSnapshot;
};
```

The client shows the result dialog from `AnswerResult` and applies `game` when the dialog is dismissed (matches the source, where the turn advances on "Nästa spelare"). `domain` is importable by the client, so it may compute "+N Coins" badges from the same constants.

## 9. Domain module (`features/game/domain`)

Pure functions, 100% unit-tested, no imports from the rest of the project:

```ts
RULES      // winScore 1200, maxRounds 12, boardTiles 20, maxPlayers 20, wrongPenalty 50, fiftyFiftyReward 50, bonusReward 1000
BASE_POINTS, MOVE_TILES
scoreAnswer({ difficulty, isCorrect, usedFiftyFifty }) -> { pointsDelta, positionDelta }
advanceTurn({ currentSeat, round, playerCount })       -> { currentSeat, round }
evaluateEnd({ scores, round })                         -> FinishReason | null
pickWinner(players)                                    -> player   // highest score, tie -> lowest seat
selectQuestion({ candidates, usedIds, filter })        -> question | null   // 3-step fallback, rng injected
computeSpin({ currentAngle, sliceCount, rng })         -> { targetSlice, totalRotation, durationMs }
```

## 10. Frontend port map (legacy → new)

| Legacy | New location |
|---|---|
| `CATEGORIES`, `QUESTION_DATABASE`, `BONUS_QUESTIONS_DATABASE` | DB, seeded from `data/seed/*.json` |
| `PLAYER_PALETTE` (20), `INDUSTRIAL_EMOJIS` (12) | `ui/palette.ts`, indexed by `seat % 20` and `seat % 12` |
| `playSound`, `initAudio`, `toggleSound` | `ui/use-sound.ts` (Web Audio synth, no asset files; init on first user gesture) |
| `toggleFullscreen` | `ui/use-fullscreen.ts` |
| `drawWheelCanvas`, `spinWheel` | `ui/wheel.tsx` (canvas 360×360, rAF, 4800 ms ease-out cubic, 5–8 extra turns, pointer at top, tick sound + pointer wiggle per slice). Math in `domain` `computeSpin` |
| `renderBoardTrack`, `renderLeaderboard` | `ui/board-track.tsx`, `ui/leaderboard.tsx` |
| `startGameFromSetup`, `presetPlayers`, player inputs | `ui/setup-dialog.tsx` + `POST /api/games` |
| `presentQuestionModal`, `useFiftyFifty`, `handleOptionClick` | `ui/question-dialog.tsx` (not dismissible before answering) |
| `openBonusQuestionModal`, `handleBonusAnswer` | `ui/bonus-dialog.tsx` |
| `saveManualScore` | `ui/score-dialog.tsx` |
| `openRulesModal` | `ui/rules-dialog.tsx` (static Swedish content) |
| `endGame`, `launchConfetti` | `ui/victory-dialog.tsx`, `ui/confetti.tsx` |
| `tickTimer` | `ui/use-countdown.ts` (driven by `endsAt` + `serverTime`; calls `finish` at 0) |
| Blueprint background | `ui/blueprint-background.tsx` (pure CSS grid + vignette, boot.dev-inspired dark navy) |

UI rules:
- Keep the boot.dev-inspired design: flat navy panels (`#202330` page, `#1c1e29` cards), serif display headings (Fraunces), DM Sans body, gold primary CTAs (`#e5ae3c`), periwinkle accents (`#7e88f7`), green/red answer states, 2px borders and subtle shadows. No glass blur, glow, gradient text or Swedish flag backdrop. Tokens live in `globals.css`.
- Palette class names must be **complete literal strings** (`"bg-periwinkle-400"`); Tailwind cannot detect assembled names.
- All Swedish UI copy in `ui/strings.ts`; no Swedish strings scattered through components.
- Use native `<dialog>` (or Radix) with focus management and Esc handling; honor `prefers-reduced-motion` for the active-turn ring, wheel and confetti.
- Replace Font Awesome with `lucide-react`; no CDN scripts or styles.
- State: server snapshot is the source of truth; local state only for dialogs, wheel animation, sound.

## 11. Migrations and seed

Workflow for any schema change:
1. Edit `src/db/schema.ts`.
2. `pnpm db:generate --name <what_changed>`, then **read the generated SQL** in `src/db/migrations/`.
3. `pnpm db:migrate` and `pnpm db:migrate:test`.
4. Commit the `.sql` and `meta/` files together with the schema change.

Rules:
- Never edit or delete an applied migration; fix forward with a new one.
- Never use `drizzle-kit push`. Do not hand-write migration SQL, except data migrations via `drizzle-kit generate --custom`.
- `pnpm db:generate` on a clean tree must print "No schema changes". Check before finishing.
- Migrations run as an explicit step (`pnpm db:migrate`, or the compose `migrate` service). Never at app boot.
- Seed (`pnpm db:seed`) is idempotent: upserts categories by `id`, questions by `seed_key`, options by `(question_id, position)`. It never deletes. To retire a question, add a migration that sets `is_active = false`. Keep `seed_key` values stable.
- Seed JSON is validated with Zod (4 options, exactly one correct, bonus ⇔ no category). Keep that validation.

## 12. Local development

**Lean (recommended): only Postgres in Docker, Next.js on the host.**
```bash
cp .env.example .env
docker compose up -d --wait db
pnpm install && pnpm db:migrate && pnpm db:seed
pnpm dev
```

**Full: everything in containers** (bind-mounted source, hot reload via polling):
```bash
docker compose --profile app up --build     # db -> migrate+seed (one-shot) -> app on :3000
```

- DB GUI (TablePlus/DBeaver): host `localhost`, port `5432`, user/password/database `svenska` (from `.env`). Postgres is bound to `127.0.0.1` only.
- The `<db>_test` database is created by `docker/postgres/init/` **only on first init of an empty volume**. For an existing volume: `docker compose exec db createdb -U svenska svenska_test`, then `pnpm db:migrate:test`.
- Full mode keeps `node_modules` in a named volume. After changing dependencies: `docker compose --profile app down && docker volume rm industrins-svenska_node_modules && docker compose --profile app up --build`.
- `docker compose down -v` deletes all data. Never run it, or any reset, without asking.
- Production: the `runner` stage of the `Dockerfile` builds a standalone image (needs `output: "standalone"`). Run `pnpm db:migrate` as a one-shot job before starting it. Prod compose/CI is out of scope for v1.

## 13. Testing

- **Unit** (`domain/*.test.ts`): scoring table incl. 50/50, wrong answer, movement; turn advance and round wrap; end conditions and winner tie-break; selection fallback chain with injected rng; spin math (the slice under the pointer equals the target).
- **Integration** (`server/*.test.ts`): real Postgres via `TEST_DATABASE_URL`. Vitest global setup runs `db:migrate:test` and `db:seed:test`; `beforeEach` truncates `games` with CASCADE. Do not mock the database. Alias `server-only` to an empty module in the Vitest config.
- Must be covered: create → draw → 50/50 → answer → turn advance; drawing while a turn is pending → 409; answer after `ends_at` → finished; two concurrent answers to the same turn → exactly one succeeds; snapshots never contain `isCorrect` or `explanation` for a pending question.
- Definition of done for any change: `pnpm typecheck`, `pnpm lint`, `pnpm test` green.

## 14. Conventions

- Files kebab-case; components PascalCase; named exports (default only where Next requires it).
- DB columns `snake_case`, TS `camelCase` (Drizzle maps them).
- Conventional Commits. Small, focused commits.
- Comments explain *why*, never restate the code.
- Never commit `.env`; only `.env.example`.

## 15. Seed content: corrections vs. the original

All question text is verbatim from the original except two fixes:
- `q-025`: option A `Svarvaren arbeta noggrant …` → `Svarvaren arbetade noggrant …` (the typo made the correct answer ungrammatical).
- `q-009`: explanation had the garbled word "hjälpexpresensverb"; now: "'ska' är finit hjälpverb i presens (Verb 1) och står på position 2."

Distribution: 12 categories × 3 questions, except `huvudsats` (4) and `masterclass` (2).

## 16. Rules for agents

Do:
- Check §7 before touching gameplay; keep tests in sync with it.
- Make schema changes only through the workflow in §11.

Do not:
- Change game rules, scoring or UI copy without being asked.
- Run `docker compose down -v`, drop or reset databases, or rewrite applied migrations.
- Add dependencies, services, auth or abstractions beyond §2 and §5 without asking.
- Send correct answers or explanations to the client before an answer is submitted.
- Build anything listed under "Not in v1" (§2).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
