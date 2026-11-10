# Industrins Svenska

A shared-screen Swedish grammar board game for vocational students (GY25). One screen,
1–20 players: spin the wheel (or pick a category), answer a multiple-choice question, win or
lose Coins, and move along the 20-tile board.

The gameplay is a faithful port of the original single-file prototype in `legacy/index.html`.
The app is server-authoritative: questions, correct answers, scoring, turn order and the match
timer all live in PostgreSQL.

## Stack

- Next.js App Router, TypeScript (strict), Tailwind CSS, `lucide-react`
- PostgreSQL 17 (Docker), Drizzle ORM + drizzle-kit
- Zod at every boundary
- Vitest (domain unit tests + real-Postgres integration tests)

## Local development

Lean mode — only Postgres runs in Docker:

```bash
cp .env.example .env
docker compose up -d --wait db
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open <http://localhost:3000>.

Create the test database once if the Docker volume already existed:

```bash
docker compose exec db createdb -U svenska svenska_test
pnpm db:migrate:test
```

Full container mode (app + one-shot migrate/seed):

```bash
docker compose --profile app up --build
```

## Deployment

Local development always uses the Postgres container. The deployed app uses Neon Postgres
(project `withered-frog-33451149`):

- Locally, `.env` contains only the Docker URLs. `.env.neon` (gitignored) holds the Neon
  strings and is never loaded by Next.js or `src/db/load-env.ts`.
- On the host, set `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct, used by
  migrations) and the `NEON_*` variables from `.env.neon` in the platform's environment
  settings.
- Run `pnpm db:migrate && pnpm db:seed` once against production before the first deploy.

## Commands

```bash
pnpm dev            # development server
pnpm build          # production build (standalone output)
pnpm start          # production server
pnpm typecheck      # tsc --noEmit
pnpm lint           # ESLint
pnpm test           # Vitest run (requires the Docker database)
pnpm format         # Prettier
pnpm db:generate    # generate a migration from src/db/schema.ts
pnpm db:migrate     # apply migrations to the main database
pnpm db:seed        # idempotent seed from data/seed/*.json
pnpm db:migrate:test
pnpm db:seed:test
```

## Layout

```
data/seed/          categories, regular questions, bonus questions
legacy/index.html   behaviour reference; do not edit
src/app/            routes and pages only
src/features/game/
  domain/           pure rules (scoring, turns, selection, wheel math)
  server/           use-cases and snapshot queries
  ui/               React components, hooks, all Swedish copy
  schemas.ts        Zod request/response schemas
  api-client.ts     typed browser fetch wrappers
src/db/             schema, client, migrations, seed
tests/              Vitest setup and helpers
```

See `AGENTS.md` for the full behavioural contract and architecture rules.
