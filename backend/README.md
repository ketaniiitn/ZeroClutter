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

48 unit tests across 4 test files. No database or external API required — all tests are pure unit tests.

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
tests/                             # 48 unit tests (Jest + ts-jest)
```
