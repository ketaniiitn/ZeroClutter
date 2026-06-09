# Technical Decisions

## 1. Database: PostgreSQL via Prisma ORM

**Chosen:** PostgreSQL with Prisma as the ORM/query layer.

**Why:**
- Prisma was built primarily for relational databases — full feature support including `onDelete: Cascade`, transactions, `prisma migrate`, and type-safe joins.
- The data model is inherently relational: a Meeting has many TranscriptSegments, a TranscriptSegment belongs to one Meeting, an ActionItem belongs to one Meeting, etc. Foreign keys and cascading deletes are the right tool.
- PostgreSQL natively supports `String[]` (arrays) for the `participants` field and `Json` columns for `citations`/`summary`/`decisions` — no compromise on flexible fields.
- `prisma migrate` gives a versioned, reproducible schema history — critical for team collaboration and deployment pipelines.
- First-class support on all major platforms: Render, Railway, Neon, Supabase.

**Why not MongoDB:**
- Prisma's MongoDB support is second-class: no `onDelete: Cascade` in the Prisma client, no transactions across collections, no `@@index` support, and ObjectId handling adds noise (`@db.ObjectId`, `@map("_id")`).
- MongoDB's document model is a poor fit here — the data has clear, stable relationships that benefit from referential integrity enforced at the database level.
- `prisma db push` (MongoDB) has no migration history; `prisma migrate` (PostgreSQL) does.

**Alternatives considered:**
- **MySQL:** Strong relational database, but PostgreSQL's `Json` type, array support, and richer type system make it the better Prisma pairing.
- **SQLite:** Perfect for local dev/tests but not suitable for a deployed, concurrent web service.

**Trade-offs:**
- Requires a running PostgreSQL instance (Render free tier provides one). MongoDB Atlas has a permanently-free cluster tier, but the technical superiority of PostgreSQL + Prisma outweighs that convenience.

---

## 2. Authentication: JWT (JSON Web Tokens)

**Chosen:** JWT with RS/HS256, signed with a configurable secret, verified per-request.

**Why:**
- Stateless: no session store required, making horizontal scaling trivial.
- Industry-standard for REST APIs.
- `jsonwebtoken` + `bcryptjs` are battle-tested npm packages.
- The assignment explicitly lists JWT as a recommended option.

**Alternatives considered:**
- **Session-based auth:** Requires Redis or a shared session store; adds infrastructure complexity not warranted for this scope.
- **OAuth2 / Passport.js:** Overkill for this assignment; adds unnecessary complexity.

**Trade-offs:**
- JWTs cannot be revoked before expiry without a token blacklist (not needed for this scope).
- Passwords are hashed with bcrypt (12 rounds) — computationally expensive by design to resist brute force.

---

## 3. External Integration: Telegram Bot API

**Chosen:** Telegram Bot API via `node-telegram-bot-api`.

**Why:**
- Free, no credit card required — easy for evaluators to verify.
- BotFather makes bot creation instant.
- The Bot API supports markdown formatting for rich reminder messages.
- Telegram's webhook/polling infrastructure is production-grade.
- Widely used for notification workflows.

**Alternatives considered:**
- **SendGrid/Resend (Email):** Requires email domain verification and SMTP configuration, harder to demo.
- **Slack Webhook:** Requires a Slack workspace and app installation.
- **Discord:** Good option but Telegram is more universally accessible.

**Trade-offs:**
- Requires a Telegram account to receive reminders.
- The bot sends to a single configured chat ID. A production system would resolve chat IDs per user (future enhancement).

---

## 4. AI Provider: Google Gemini 1.5 Flash

**Chosen:** Google Gemini 1.5 Flash via `@google/generative-ai`.

**Why:**
- Free tier with generous quota (ideal for assignment evaluation).
- `responseMimeType: 'application/json'` forces structured JSON output, reducing parse failures.
- Low temperature (0.1) minimizes hallucination for factual extraction tasks.
- Gemini 1.5 Flash has strong instruction following for constrained JSON generation.

**Alternatives considered:**
- **OpenAI GPT-4o:** Better JSON mode but costs money; API key may expire.
- **Groq:** Ultra-fast but smaller context window; less reliable for complex citations.
- **Ollama (local):** No API key needed but requires local GPU setup.

**Trade-offs:**
- Gemini Flash occasionally struggles with very long transcripts; mitigated by validating all citations against the transcript.
- Gemini API is not available in all regions (fallback: proxy or VPN).

---

## 5. Scheduler: node-cron

**Chosen:** `node-cron` running in-process on an hourly schedule.

**Why:**
- Zero additional infrastructure — runs inside the Express process.
- The assignment explicitly lists `node-cron` as a recommended option.
- Cron expression `0 * * * *` is standard and well-understood.

**Alternatives considered:**
- **Bull/BullMQ with Redis:** Better for distributed workloads but requires Redis — overkill for this scope.
- **External cron (Render Cron Jobs):** More reliable at scale but requires a separate deployment.

**Trade-offs:**
- If the server restarts, in-flight reminders are not retried (acceptable for demo; production would use a job queue).
- Only one instance should run the scheduler in a multi-instance deployment (use a distributed lock in production).

---

## 6. Project Structure: Module-Based Architecture

**Chosen:** Feature modules (auth, meetings, analysis, action-items, reminders, telegram) with controller/service separation.

**Why:**
- Each module is cohesive and independently testable.
- Services contain business logic; controllers handle HTTP concerns only.
- Clear boundaries make the code maintainable and extensible.
- Follows SOLID principles without over-engineering.

**Alternatives considered:**
- **Layered architecture (controllers/services/repositories as top-level directories):** Common but leads to cross-cutting concerns when features grow.
- **NestJS:** The assignment explicitly required Express.js.

**Trade-offs:**
- Slightly more boilerplate per module than a flat structure.
- Circular imports possible between modules — mitigated by keeping the dependency graph directed (analysis → meetings, reminders → action-items, telegram).

---

## 7. Validation: Joi

**Chosen:** Joi for declarative schema validation.

**Why:**
- Excellent error messages with customizable per-field messages.
- Handles type coercion (string → number for pagination params).
- Supports nested schemas (transcript segments).
- No decorator magic — pure function calls are easy to test.

**Alternatives considered:**
- **Zod:** TypeScript-first, but slightly more verbose for HTTP input validation.
- **express-validator:** Middleware-based, harder to unit test in isolation.
- **class-validator:** Requires decorators and TypeScript `reflect-metadata`.

---

## 8. Logging: Winston

**Chosen:** Winston with structured JSON logging.

**Why:**
- JSON logs are parseable by all major log aggregation services (Datadog, CloudWatch, etc.).
- Every log includes `traceId` for request correlation.
- Different formats for dev (readable) and prod (JSON).

**Trade-offs:**
- Winston is heavier than Pino; acceptable for this scale.
