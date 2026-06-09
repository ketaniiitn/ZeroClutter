# Changelog

All notable implementation milestones are documented here.

---

## [1.0.0] — 2026-06-03

### Implemented

#### Phase 1 — Project Setup
- Initialized TypeScript + Express.js project
- Configured Prisma ORM with PostgreSQL provider
- Set up environment variable handling with startup validation
- Configured `ts-node-dev` for hot-reload development
- Added `.gitignore`, `.env.example`

#### Phase 2 — Core Infrastructure
- Implemented trace ID middleware (generates UUID v4 if absent, propagates via `x-trace-id` header)
- Implemented structured request logging middleware (method, path, status, duration, traceId)
- Implemented unified API response format `{ traceId, success, data/error }`
- Implemented global centralized error handler (operational vs unexpected error differentiation)
- Implemented 404 handler for unknown routes
- Implemented custom error class hierarchy (`AppError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError`, `AIError`)

#### Phase 3 — Authentication
- `POST /auth/register` with name, email, password validation
- `POST /auth/login` with JWT token issuance
- bcryptjs password hashing (12 salt rounds)
- JWT authentication middleware (`authenticate`) for route protection
- Duplicate email conflict detection (409)

#### Phase 4 — Meeting Management
- `POST /api/meetings` — create meeting with participants and transcript
- `GET /api/meetings` — list meetings with pagination (page/limit) and date range filtering
- `GET /api/meetings/:id` — get meeting with transcript, analysis, and action items
- Transcript segments stored separately with ordering index
- Ownership enforcement (users only see their own meetings)
- Joi validation for all inputs including email addresses in participants

#### Phase 5 — AI Meeting Analysis
- `POST /api/meetings/:id/analyze` — trigger Gemini 1.5 Flash analysis
- Structured prompt with transcript context, valid timestamp list, and strict anti-hallucination rules
- Forces JSON output via `responseMimeType: 'application/json'` and temperature 0.1
- Citation validation: all timestamps verified against actual transcript
- Invalid citations removed; items with zero valid citations rejected
- AI-extracted action items automatically persisted to `ActionItem` table with `PENDING` status
- Analysis stored/updated in `MeetingAnalysis` table via upsert

#### Phase 6 — Action Item Management
- `POST /api/action-items` — create action item with optional citations
- `PATCH /api/action-items/:id/status` — update status (PENDING/IN_PROGRESS/COMPLETED)
- `GET /api/action-items` — list with filtering (status, assignee, meetingId) and pagination
- Ownership enforcement via meeting membership check

#### Phase 7 — Overdue Detection
- `GET /api/action-items/overdue` — returns items where `status != COMPLETED AND dueDate < now`
- Ordered by dueDate ascending (most overdue first)

#### Phase 8 — Reminder Scheduler
- `node-cron` scheduler running on `0 * * * *` (every hour)
- Finds all overdue action items across all users
- Sends Telegram reminder per overdue item
- Records `ReminderHistory` (success/failure, message, timestamp, channel)
- Graceful error handling — scheduler continues on individual item failures

#### Phase 9 — Telegram Integration
- Telegram Bot API integration via `node-telegram-bot-api`
- Markdown-formatted reminder messages
- Configurable chat ID via environment variable
- Error capture with return value (no thrown exceptions to avoid scheduler crash)

#### Phase 10 — System Endpoints
- `GET /health` — returns `{ status: "UP", timestamp, database }` with DB ping check
- `GET /api/evaluation` — candidate info, features list, integration choice
- `GET /api-docs` — Swagger UI with full OpenAPI 3.0 spec

#### Phase 11 — Testing
- Jest + ts-jest configuration
- Unit tests for auth validation (7 scenarios)
- Unit tests for meeting validation (9 scenarios)
- Unit tests for action item validation (12 scenarios)
- Unit tests for overdue detection logic (5 scenarios)
- Unit tests for AI prompt structure (6 scenarios)
- Unit tests for response utilities (3 scenarios)
- Unit tests for error classes (5 scenarios)

#### Phase 12 — Documentation
- `README.md` — full setup, API examples, deployment guide
- `DECISIONS.md` — 8 architectural decisions with rationale and trade-offs
- `AI_APPROACH.md` — prompt design, citation strategy, hallucination prevention, limitations
- `TESTING.md` — all test scenarios, edge cases, limitations
- `CHANGELOG.md` — this file
- `CHECKLIST.md` — submission checklist

#### Phase 13 — Deployment Preparation
- Render deployment instructions in README
- `npm run build` → `npm start` production flow
- All secrets via environment variables (no hardcoded values)
- CORS enabled for all origins (`*`) as required by assignment
- Helmet security headers
- Graceful shutdown (SIGTERM/SIGINT)

---

## [1.1.0] — 2026-06-04

### Added

#### Phase 14 — CI/CD, Redis Caching & Rate Limiting
- **CI/CD pipeline** via GitHub Actions (`.github/workflows/ci.yml`)
  - Runs type check, tests, and build on every push/PR to `main`/`develop`
  - Auto-deploys to Render via deploy hook on merge to `main`
- **Redis caching** (`ioredis` + `src/config/redis.ts` + `src/utils/cache.ts`)
  - `GET /api/meetings/:id` cached for 5 minutes per user
  - `GET /api/meetings` list cached for 2 minutes per user+query
  - Cache invalidated on meeting create and after AI analysis
  - Graceful degradation — app runs normally if `REDIS_URL` is not set
- **Rate limiting** (`express-rate-limit` + `rate-limit-redis`)
  - Global: 100 req / 15 min on all routes
  - Auth: 10 req / 15 min on `POST /auth/register` and `POST /auth/login`
  - Analyze: 5 req / 1 min on `POST /api/meetings/:id/analyze`
  - Redis-backed store when Redis is available; in-memory fallback otherwise
  - Consistent 429 response format with `traceId`
- **Bug fix**: corrected missing `meetingDate` argument in 6 AI prompt unit tests — all 48 tests now pass
