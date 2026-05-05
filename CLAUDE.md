# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev

# Build (requires env vars — see below)
DATABASE_URL="postgresql://u:p@localhost:5432/db" NEXTAUTH_SECRET="..." NEXTAUTH_URL="http://localhost:3000" npm run build

# Lint
npm run lint

# Database
npm run db:generate   # Generate migration from schema changes
npm run db:migrate    # Apply migrations to the connected DB
npm run db:studio     # Open Drizzle Studio (visual DB browser)
npm run db:seed       # Seed the biblia-facil quiz data (idempotent)

# Admin user
npm run create-admin <email> <password>
```

All `db:*` and `create-admin` scripts load `.env` automatically via `dotenv -e .env`.

## Architecture

### Multi-project quiz platform

Each quiz is a **project** identified by a `slug`. The URL `/biblia-facil` serves the project seeded with that slug. Adding a new quiz means inserting rows into `projects`, `questions`, `question_options`, `result_profiles`, and `result_profile_blocks` — no code changes required.

### Data flow

```
User visits /[slug]
  → Server fetches quiz data via GET /api/quiz/[slug]
  → QuizShell (client component) runs the entire quiz state machine
  → On each interaction, lib/analytics.ts fires events to POST /api/events (fire-and-forget, keepalive)
  → On lead form submit, POST /api/leads saves lead + answers in a single DB transaction
  → Checkout button opens the profile's ctaUrl in a new tab
```

### Key files

| Path | Purpose |
|---|---|
| `src/db/schema.ts` | Single source of truth for all 9 tables. Change here, then `db:generate`. |
| `src/db/index.ts` | Postgres connection (deferred — no throw at build time, errors surface on first query). |
| `src/proxy.ts` | Auth middleware — protects all `/admin/*` routes. In Next.js 16 this file is named `proxy.ts`, not `middleware.ts`. |
| `src/lib/auth.ts` | NextAuth v5 config — credentials provider, bcrypt validation, JWT with user.id. |
| `src/lib/analytics.ts` | Client-side event emitter. Session ID is stored in `sessionStorage` per tab. |
| `src/components/quiz/QuizShell.tsx` | Entire quiz UI state machine in one client component (screens: intro → question → capture → result). |

### Analytics event types

`page_view` | `quiz_start` | `question_answer` | `quiz_complete` | `lead_capture` | `result_view` | `cta_click`

All events carry `sessionId` (tab-scoped UUID), `projectSlug`, optional `leadId` (attached after lead capture), IP, and user-agent. The `/api/events` route always responds `202` immediately — inserts happen non-blocking.

### Rate limiting

`POST /api/leads` enforces 3 submissions per IP per hour via a SQL `count(*)` check. There is no external cache or middleware — it's a DB query.

### Admin panel

Routes under `/admin` are server-rendered and protected by `src/proxy.ts`. The dashboard aggregates data over three time windows (today, 7d, 30d) with funnel analysis using `count(distinct session_id)` per event type.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full base URL (e.g. `https://example.com`) |
| `POSTGRES_USER/PASSWORD/DB` | Dev only | Used by Docker Compose to init the postgres container |

Copy `.env.example` → `.env` before running anything.

## Docker

```bash
docker compose up --build   # Start app + postgres (production mode)
docker compose up db -d     # Start only postgres (for local npm run dev)
```

The Dockerfile uses a multi-stage build (`deps → builder → runner`) with a non-root `app` user. `next.config.ts` sets `output: "standalone"` — required for the Docker image to work.

## Database schema changes

1. Edit `src/db/schema.ts`
2. `npm run db:generate` — creates a new SQL file in `src/db/migrations/`
3. `npm run db:migrate` — applies it

Never edit migration files manually.
