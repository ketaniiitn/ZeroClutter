# Hintro Meeting Intelligence Service

An AI-powered backend service that helps users manage meetings, extract actionable insights grounded in transcripts, track action items, and send overdue reminders via Telegram.

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js |
| Database | PostgreSQL via Prisma ORM |
| Cache | Redis (ioredis) |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| AI | Google Gemini Flash |
| Scheduler | node-cron |
| External Integration | Telegram Bot API |
| Logging | Winston (structured JSON) |
| Validation | Joi |
| API Docs | Swagger UI (OpenAPI 3.0) |
| Testing | Jest + ts-jest |
| CI/CD | GitHub Actions + Render |

---

## Setup Instructions

### Prerequisites

- Node.js >= 18
- PostgreSQL 14+ ([Render Postgres](https://render.com), [Neon](https://neon.tech), or [Supabase](https://supabase.com) all work)
- A Google Gemini API key — free at [aistudio.google.com](https://aistudio.google.com)
- A Telegram Bot token and chat ID — create via [@BotFather](https://t.me/BotFather)
- Redis (optional) — for distributed caching and rate limiting; the app runs without it

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/hintro-meeting-intelligence.git
cd hintro-meeting-intelligence
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see the **Environment Variables** table below for details).

### 4. Run database migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Run locally

```bash
npm run dev
```

The server starts at `http://localhost:3000`.

Swagger UI: `http://localhost:3000/api-docs`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string — `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Yes | Secret key for JWT signing (min 32 characters recommended) |
| `JWT_EXPIRES_IN` | No | Token expiry duration (default: `7d`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token from BotFather |
| `TELEGRAM_CHAT_ID` | Yes | Telegram chat/channel ID for reminder delivery |
| `REDIS_URL` | No | Redis connection string — `redis://localhost:6379`. If omitted, caching is disabled and rate limiters use in-memory state |
| `CANDIDATE_NAME` | No | Name (shown at `GET /api/evaluation`) |
| `CANDIDATE_EMAIL` | No | Email (shown at `GET /api/evaluation`) |
| `REPOSITORY_URL` | No | GitHub repository URL |
| `DEPLOYED_URL` | No | Live deployment URL |

---

## Running Tests

```bash
npm test                  # Run all tests
npm run test:coverage     # Run with coverage report
```

62 unit tests across 6 test files. No database or external API required — all tests are pure unit tests.

---

## Rate Limiting

Three tiers of rate limiting protect the API:

| Route | Limit | Reason |
|---|---|---|
| All routes | 100 req / 15 min | Global abuse prevention |
| `POST /auth/register` | 10 req / 15 min | Account-farming protection |
| `POST /auth/login` | 10 req / 15 min | Brute-force protection |
| `POST /api/meetings/:id/analyze` | 5 req / 1 min | Expensive AI call — cost control |

When `REDIS_URL` is configured, limits are tracked in Redis (accurate across restarts and multiple instances). Without Redis, in-memory counters are used as a fallback.

A rate-limited request returns HTTP 429 in the standard error format:
```json
{
  "traceId": "abc123",
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

---

## Redis Caching

When `REDIS_URL` is set, the service caches expensive database queries:

| Endpoint | TTL | Cache invalidated when |
|---|---|---|
| `GET /api/meetings/:id` | 5 minutes | `POST /api/meetings/:id/analyze` completes |
| `GET /api/meetings` (list) | 2 minutes | `POST /api/meetings` creates a new meeting |

The cache is keyed per user so users never see each other's data. If Redis is unavailable or `REDIS_URL` is not set, the application falls back to direct database queries with no errors or behaviour change.

---

## Meeting Bot (Google Meet)

Dispatch a bot that joins a Google Meet call as a named guest. The bot appears
in the participant list and the host admits it. (Recording/transcription are
future work.)

This feature spans two services:

- **backend** — exposes `/api/bots` and enqueues join jobs (requires `REDIS_URL`).
- **bot-worker** — a separate service (`../bot-worker`) that runs Playwright and
  actually joins the call. See `bot-worker/.env.example` for its config.

### Running the bot-worker

```bash
cd ../bot-worker
cp .env.example .env      # point DATABASE_URL + REDIS_URL at the SAME db/redis as the backend
npm install
npm run prisma:generate
npx playwright install --with-deps chromium
npm run dev
```

### Dispatch a bot

```bash
curl -X POST http://localhost:3000/api/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"meetingUrl":"https://meet.google.com/abc-defg-hij"}'
# → 202 { "data": { "id": "...", "status": "PENDING" } }

curl http://localhost:3000/api/bots/<id> -H "Authorization: Bearer <token>"   # poll status
curl -X POST http://localhost:3000/api/bots/<id>/leave -H "Authorization: Bearer <token>"  # tell it to leave
```

### Status lifecycle

`PENDING → JOINING → WAITING_ADMISSION → IN_CALL → LEFT` (or `FAILED` with `statusDetail`).

### Optional dedicated Google bot account fallback

The worker defaults to `GOOGLE_AUTH_MODE=hybrid`: it tries an unsigned named guest first,
then retries once with a dedicated Google account only when Meet requires an account or
blocks unsigned guests.

1. Create a dedicated Google account for the bot. Do not use a personal account.
2. Install [Google Chrome](https://www.google.com/chrome/) on the machine that runs `bot-worker`
   (Playwright's bundled Chromium is rejected by Google sign-in).
3. Set `GOOGLE_BOT_EMAIL` in `bot-worker/.env`.
4. Run `cd bot-worker && npm run google:login`.
5. Complete password, MFA, CAPTCHA, and security prompts manually in the opened **Chrome** window
   (isolated session — not your everyday Chrome profile).
6. Press Enter in the terminal after login completes.

If Google shows **"This browser or app may not be secure"**, close the window, confirm Chrome is
installed, and rerun `npm run google:login`. Do not use Playwright Chromium for this step.

The saved `.auth/google-state.json` file is a credential. It is gitignored and must be
mounted as a protected file in production. Never commit or print it. Rerun the login command
when Google expires the session.

Google Workspace administrators and meeting hosts can block unsigned guests and external
accounts. ZeroClutter reports those restrictions but cannot bypass them.

### Auth modes (`GOOGLE_AUTH_MODE`)

| Mode | Behavior |
|---|---|
| `guest` | Unsigned named guest only (`BOT_DEFAULT_NAME` or per-job `displayName`). |
| `account` | Authenticated join only; requires a valid `GOOGLE_STORAGE_STATE_PATH`. |
| `hybrid` | Guest first; one authenticated retry for account-required or guest-blocked screens. |

In `hybrid` mode, a missing or expired session does not block the initial guest attempt. If
authenticated fallback is needed and the session is missing or invalid, the bot fails with
`statusDetail` instructing `npm run google:login`.

`botEmail` is set to `GOOGLE_BOT_EMAIL` when an authenticated join is attempted, either
directly in `account` mode or during a `hybrid` fallback. Because it is persisted before
the authenticated attempt starts, it may remain set if that attempt fails.

### Security

- No Google password, MFA secret, or recovery code is stored in `.env`, source control, or
  the database.
- `GOOGLE_STORAGE_STATE_PATH` (default `.auth/google-state.json`) is a credential — treat it
  like a password. Mount it as a protected secret file in production; never bake it into
  container images.
- Each job launches one Playwright browser and creates one isolated context per join
  attempt. A `hybrid` fallback closes the guest context before sequentially creating an
  authenticated context that loads the storage-state file. Jobs never reuse a personal
  Chrome profile.
- `.auth/` and `.debug/` are gitignored. Debug dumps intentionally omit input values,
  cookies, tokens, and storage state.
- Rotate an expired session by rerunning `cd bot-worker && npm run google:login`.

### Troubleshooting

| Symptom / `statusDetail` | Likely cause | Action |
|---|---|---|
| `Bot Google session is missing; run npm run google:login` | No storage-state file when account fallback is required | Run `npm run google:login` in `bot-worker` |
| Google: "This browser or app may not be secure" during login | Playwright Chromium was used, or automation flags were detected | Install Google Chrome and rerun `npm run google:login` (worker uses system Chrome) |
| `Bot Google session is invalid; run npm run google:login` | Corrupt or empty storage-state file | Delete `.auth/google-state.json` and rerun login |
| `Bot Google session expired; run npm run google:login` | Google redirected to sign-in during authenticated join | Rerun `npm run google:login` |
| `Guest access blocked; retrying with bot account` | Meet blocked unsigned guests; hybrid retry in progress | Normal in `hybrid` mode — ensure session is valid |
| `Host organization blocks external accounts` | Workspace policy blocks the dedicated bot account | Cannot bypass; host must allow the bot account or use guest-allowed meetings |
| `Google Meet join screen was not recognized; inspect bot-worker/.debug` | The lobby remained unrecognized until timeout | Inspect the sanitized timeout dump in `bot-worker/.debug/`; update `selectors.ts` if Meet changed |
| `Guest name input was not found` | Guest lobby was recognized, but name-input selectors drifted | Update the name-input selectors in `selectors.ts`; this path does not currently create a `.debug` dump |
| `Join button was not found` | Lobby was recognized, but join-button selectors drifted | Update the join-button selectors in `selectors.ts`; this path does not currently create a `.debug` dump |
| `Not admitted within N min` | Host never admitted the bot | Admit the bot in Meet or increase `ADMISSION_TIMEOUT_MS` |
| `Host denied admission` | Host rejected the join request | Retry dispatch or ask host to admit |
| Invalid/ended meeting failures | Bad URL or meeting already ended | No authenticated fallback; fix the meeting link |

### End-to-end verification (manual)

Prerequisites: Postgres + Redis running; backend running (`cd backend && npm run dev`); bot-worker running (`cd bot-worker && npm run dev` — set `HEADLESS=false` in `bot-worker/.env` to watch it). Have a registered user token and a live Google Meet you host.

1. Start a Google Meet and copy the link.
2. `POST /api/bots` with the link → note the returned `id` and `202`.
3. Watch the bot-worker logs go `JOINING → WAITING_ADMISSION`; a join request appears in your Meet.
4. Admit the participant (named `ZeroClutter Notetaker`) in Meet.
5. Poll `GET /api/bots/:id` → status becomes `IN_CALL`, `joinedAt` set. Confirm the bot is in the participant list with mic + camera off.
6. `POST /api/bots/:id/leave` → the bot's browser closes; poll shows `LEFT`, `leftAt` set.
7. Negative check: `POST /api/bots` with `https://zoom.us/j/1` → `400` validation error.
8. Negative check: stop Redis, `POST /api/bots` → `503 SERVICE_UNAVAILABLE`.

Expected: all steps behave as described. If a selector fails, adjust only `bot-worker/src/joiners/selectors.ts`.

---

## CI/CD Pipeline

The GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push and pull request:

```
push / PR  →  type-check (tsc --noEmit)  →  tests (jest)  →  build (tsc)
                                                                    ↓  (main branch only)
                                                          Render deploy hook triggered
```

### One-time setup

1. Go to your Render service → **Settings → Deploy Hook** — copy the URL
2. In your GitHub repository: **Settings → Secrets and variables → Actions**
3. Add secret: `RENDER_DEPLOY_HOOK_URL` — paste the Render deploy hook URL

After this, every merge to `main` automatically deploys to Render — but only after type check, tests, and build all pass.

---

## API Usage Examples

### Authentication

**Register**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Smith","email":"alice@example.com","password":"securepass123"}'
```

**Login**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"securepass123"}'
```

Save the `token` from the response — pass it as `Authorization: Bearer <token>` on all protected routes.

---

### Meetings

**Create**
```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "title": "Sprint Planning",
    "participants": ["alice@example.com", "bob@example.com"],
    "meetingDate": "2026-05-20T10:00:00Z",
    "transcript": [
      {"timestamp": "00:10", "speaker": "John", "text": "We should launch next Friday."},
      {"timestamp": "00:20", "speaker": "Alice", "text": "I will prepare release notes."}
    ]
  }'
```

**List (paginated, date-filtered)**
```bash
curl "http://localhost:3000/api/meetings?page=1&limit=10&from=2026-01-01T00:00:00Z" \
  -H "Authorization: Bearer <your-token>"
```

**Get single meeting**
```bash
curl http://localhost:3000/api/meetings/<meeting-id> \
  -H "Authorization: Bearer <your-token>"
```

---

### AI Analysis

Generates a grounded summary, action items, decisions, and follow-up suggestions — every item backed by a transcript citation.

```bash
curl -X POST http://localhost:3000/api/meetings/<meeting-id>/analyze \
  -H "Authorization: Bearer <your-token>"
```

**Example response:**
```json
{
  "traceId": "abc123",
  "success": true,
  "data": {
    "analysis": {
      "summary": [
        {
          "text": "Team plans to launch next Friday.",
          "citations": [{"timestamp": "00:10", "speaker": "John", "quote": "We should launch next Friday."}]
        }
      ],
      "decisions": [],
      "followUps": []
    },
    "actionItems": [
      {
        "task": "Prepare release notes",
        "assignee": "Alice",
        "dueDate": "2026-05-23",
        "citations": [{"timestamp": "00:20", "speaker": "Alice", "quote": "I will prepare release notes."}]
      }
    ]
  }
}
```

---

### Action Items

**Create manually**
```bash
curl -X POST http://localhost:3000/api/action-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"task":"Review PR","assignee":"Bob","meetingId":"<id>","dueDate":"2026-06-10T00:00:00Z"}'
```

**List with filters**
```bash
curl "http://localhost:3000/api/action-items?status=PENDING&assignee=Alice&page=1&limit=10" \
  -H "Authorization: Bearer <your-token>"
```

**Update status**
```bash
curl -X PATCH http://localhost:3000/api/action-items/<id>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"status": "COMPLETED"}'
```

**Get overdue items**
```bash
curl http://localhost:3000/api/action-items/overdue \
  -H "Authorization: Bearer <your-token>"
```

---

### System Endpoints

```bash
curl http://localhost:3000/health          # { "status": "UP", "database": "connected" }
curl http://localhost:3000/api/evaluation  # candidate info and feature list
# Swagger UI: http://localhost:3000/api-docs
```

---

## Deployment Instructions (Render)

1. Create a **PostgreSQL** database on [render.com](https://render.com) — copy the Internal Database URL
2. *(Optional)* Create a **Redis** instance on [Render](https://render.com) or [Upstash](https://upstash.com) — copy the connection URL
3. Create a **Web Service**, connect your GitHub repository
4. Set **Build Command**:
   ```
   npm install && npm run prisma:generate && npm run prisma:migrate && npm run build
   ```
5. Set **Start Command**: `npm start`
6. Add all environment variables from `.env.example`
7. For auto-deploy on merge: copy the **Deploy Hook URL** from Render → add it as `RENDER_DEPLOY_HOOK_URL` in GitHub Secrets
8. Deploy

---

## Project Structure

```
.github/
└── workflows/
    └── ci.yml                     # GitHub Actions — test, build, deploy
src/
├── config/
│   ├── database.ts                # Prisma client + connect/disconnect
│   ├── env.ts                     # Environment variable validation
│   ├── redis.ts                   # Redis client + connect/disconnect
│   └── swagger.ts                 # OpenAPI 3.0 spec definition
├── middleware/
│   ├── auth.middleware.ts         # JWT verification
│   ├── error.middleware.ts        # Global error handler + 404
│   ├── logging.middleware.ts      # Structured request/response logging
│   ├── rate-limit.middleware.ts   # Global / auth / analyze rate limits
│   └── trace.middleware.ts        # x-trace-id generation and propagation
├── modules/
│   ├── auth/                      # Register, login
│   ├── meetings/                  # Meeting CRUD + transcript storage + cache
│   ├── analysis/                  # AI analysis (Gemini) + citation validation
│   ├── action-items/              # Action item management
│   ├── reminders/                 # node-cron scheduler + reminder processing
│   ├── telegram/                  # Telegram Bot integration
│   ├── health/                    # Health check endpoint
│   └── evaluation/                # Evaluation endpoint
├── utils/
│   ├── cache.ts                   # Redis helpers: get / set / delete / pattern-delete
│   ├── errors.ts                  # Custom error class hierarchy
│   ├── logger.ts                  # Winston structured logger
│   └── response.ts                # sendSuccess / sendError / paginatedResponse
├── types/                         # TypeScript interfaces and types
├── app.ts                         # Express app setup
└── server.ts                      # Entry point + graceful shutdown
prisma/
├── schema.prisma                  # Database schema (6 models)
└── migrations/                    # Versioned migration history
tests/                             # 62 unit tests (Jest + ts-jest)
```
