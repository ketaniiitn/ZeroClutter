# Meeting Bot — v1 Design (Google Meet, join-only)

**Date:** 2026-07-17
**Status:** Approved for implementation planning
**Scope:** A self-hosted bot that joins a Google Meet call as a named guest. No recording, transcription, or analysis yet.

---

## 1. Background & Goal

ZeroClutter ("Hintro Meeting Intelligence") today ingests meeting transcripts **manually / via API** and runs a Gemini pipeline over them (summary, decisions, action items, reminders). The missing front end of that pipeline is automatic capture: a bot that joins a live meeting and (eventually) produces the transcript.

This spec covers **only the first vertical slice**: a bot that can *enter* a Google Meet call. Recording/transcription/analysis are explicitly future phases built on top of this foundation.

### Success criteria

Given a Google Meet link via an authenticated API call, a headless bot:
1. Opens the Meet URL in a real browser (Chromium).
2. Sets its display name (e.g. `ZeroClutter Notetaker`).
3. Joins with **microphone and camera off**.
4. Requests to join; appears in the participant list once the host admits it.
5. Its lifecycle status is tracked in the database and readable via the API.
6. Can be told to leave, after which it cleanly closes the browser.

### How this mirrors Otter.ai / Read.ai (verified)

- Otter/Read.ai notetakers **join as a plain guest participant** and do **not** sign into a Google account. Otter's docs state the Notetaker "will always join as a guest participant" and "cannot sign into any Google Meet account."
- The bot appears as a **named participant** (e.g. `"[Name]'s Notetaker (Otter.ai)"`); the host admits it from the waiting room.
- The "email/identity" users associate is the **calendar connection** (which tells the bot *which* meetings to join) — not a login the bot uses to enter. That is a future phase.
- Signing the bot into a real Google account is an **optional advanced feature** (only to skip the waiting room / join sign-in-only meetings) and is the most fragile part. It is out of scope for v1 but the schema reserves space for it.

---

## 2. Architecture

Two cooperating services communicating through the existing Redis instance.

### 2.1 API backend (existing Express app)

- Exposes the bot endpoints (JWT-protected, same `auth.middleware`).
- Writes/reads `MeetingBot` records in Postgres (via existing Prisma client).
- **Enqueues a join job** onto a Redis-backed queue. Never launches a browser itself.

### 2.2 `bot-worker/` (new standalone service, sibling to `backend/` and `frontend/`)

- Node.js + TypeScript process running **Playwright + Chromium**.
- Consumes join jobs, drives the Google Meet UI, and writes status back to the shared Postgres DB.
- Subscribes to a control channel to handle "leave" requests for live sessions.

### 2.3 Communication (via existing Redis)

| Path | Mechanism | Payload |
|---|---|---|
| Dispatch (API → worker) | **BullMQ** queue `meeting-bot-join` | `{ botId }` |
| Status (worker → all) | Postgres `MeetingBot.status` (polled via `GET /api/bots/:id`) | — |
| Leave (API → live bot) | Redis **pub/sub** channel `meeting-bot:control` | `{ botId, action: "leave" }` |

> **Dependency note:** This makes **Redis a required dependency for the bot feature.** For the rest of the app Redis remains optional (caching/rate-limiting fall back to in-memory). If Redis is unavailable, bot endpoints return a clear `503`-style error rather than silently failing.

---

## 3. Data Model

New Prisma model (added to `backend/prisma/schema.prisma`, single source of truth for both services). A relation is added to `User`.

```prisma
model MeetingBot {
  id           String    @id @default(cuid())
  userId       String
  meetingUrl   String
  platform     String    @default("GOOGLE_MEET") // reserved for ZOOM / TEAMS later
  displayName  String
  status       String    @default("PENDING")
  statusDetail String?   // last error / human-readable reason
  botEmail     String?   // reserved for future signed-in-account mode
  meetingId    String?   // links to Meeting once recording exists (future)
  joinedAt     DateTime?
  leftAt       DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}
```

### 3.1 Status lifecycle

```
PENDING            -- record created, job enqueued
   ↓
JOINING            -- worker picked up job, browser launching / navigating
   ↓
WAITING_ADMISSION  -- "Ask to join" clicked, waiting for host to admit
   ↓
IN_CALL            -- detected as admitted / in the meeting
   ↓
LEFT               -- left on request, or meeting ended cleanly
```
Terminal failure: `FAILED` (from any state) with `statusDetail` explaining why.

Status values are stored as strings for v1 (matching the existing `ActionItem.status` convention) to keep migrations simple; may be promoted to a Prisma enum later.

---

## 4. API (backend)

All routes are authenticated and namespaced under `/api/bots`.

| Method | Route | Purpose | Response |
|---|---|---|---|
| `POST` | `/api/bots` | Create a bot and enqueue a join job | `202` + `{ id, status }` |
| `GET` | `/api/bots/:id` | Read a bot's current status | `200` + bot record |
| `GET` | `/api/bots` | List the caller's bots (paginated) | `200` + paginated list |
| `POST` | `/api/bots/:id/leave` | Signal a live bot to leave | `202` + `{ id, status }` |

### 4.1 `POST /api/bots`

Request:
```json
{ "meetingUrl": "https://meet.google.com/abc-defg-hij", "displayName": "ZeroClutter Notetaker" }
```
- `meetingUrl` — required; validated (Joi) to be a well-formed Google Meet URL (`https://meet.google.com/<code>`).
- `displayName` — optional; defaults to a configured name (e.g. `ZeroClutter Notetaker`).

Behaviour: validate → create `MeetingBot` (`PENDING`) owned by the caller → enqueue `{ botId }` on `meeting-bot-join` → return `202` immediately (non-blocking). Ownership is enforced on all reads/actions (mirrors `getMeetingById`'s `ForbiddenError` pattern).

### 4.2 `POST /api/bots/:id/leave`

Publishes `{ botId, action: "leave" }` to `meeting-bot:control`. If the bot is already `LEFT`/`FAILED`, returns the current state without error (idempotent).

---

## 5. bot-worker Internals

```
bot-worker/
  package.json               # own deps: playwright, bullmq, ioredis, @prisma/client, dotenv
  tsconfig.json
  .env.example               # DATABASE_URL, REDIS_URL, BOT_DEFAULT_NAME, timeouts
  src/
    index.ts                 # boot: connect Redis + Prisma, start queue worker + control subscriber, graceful shutdown
    config.ts                # env validation (mirrors backend/src/config/env.ts style)
    prisma.ts                # Prisma client against the same DATABASE_URL
    queue.ts                 # BullMQ worker consuming "meeting-bot-join"
    control.ts               # Redis pub/sub subscriber for leave signals
    session-registry.ts      # Map<botId, live Playwright context> for leave/cleanup
    logger.ts                # structured logging (reuse Winston pattern)
    joiners/
      joiner.interface.ts    # contract: join(ctx) / requested leave handling
      google-meet.joiner.ts  # Playwright automation for Google Meet ONLY (v1)
      selectors.ts           # ALL Google Meet DOM selectors in one file (UI-change blast radius = 1 file)
```

### 5.1 Prisma sharing

The Prisma schema stays in `backend/prisma/schema.prisma` as the single source of truth. `bot-worker` connects to the **same `DATABASE_URL`** and generates its own `@prisma/client` at build time by copying that schema into `bot-worker/prisma/schema.prisma` (gitignored, regenerated by `npm run prisma:generate`) and running `prisma generate` against the local copy, so the client lands in `bot-worker/node_modules`. The generated client is never committed; the constraint is: **no second, divergent copy of the schema.**

### 5.2 `google-meet.joiner.ts` (the automation)

1. Launch Chromium with fake/denied media devices so Meet sees mic+camera unavailable/off:
   - flags: `--use-fake-ui-for-media-stream`, `--use-fake-device-for-media-stream`; grant no real camera/mic; ensure the join happens muted with camera off.
2. Navigate to `meetingUrl`. Set status `JOINING`.
3. Dismiss any "continue without microphone/camera" or permission dialogs.
4. Fill the "Your name" field with `displayName`.
5. Ensure mic and camera toggles are OFF before joining.
6. Click **"Ask to join"** (or "Join now"). Set status `WAITING_ADMISSION`.
7. Detect admission (presence of in-call UI elements) → set status `IN_CALL`, set `joinedAt`.
8. Hold the page open, listening for a leave signal or meeting-ended condition.
9. On leave / meeting end / error → close context, set `LEFT` or `FAILED` (+ `statusDetail`, `leftAt`), remove from `session-registry`.

All selectors used above live in `selectors.ts`.

---

## 6. Error Handling & Resilience

Self-hosted browser bots fail in the wild; the design assumes it.

- **Timeouts on every stage:** navigation, name-field detection, join-button detection, and an admission timeout (e.g. host never admits within N minutes → `FAILED: "not admitted within {N} min"`).
- **Structured failure reasons** in `statusDetail`: `"invalid meeting link"`, `"join button not found (UI may have changed)"`, `"not admitted"`, `"browser crashed"`, etc.
- **Selector isolation:** every Meet DOM selector lives in `selectors.ts`, so Google UI changes are a one-file fix.
- **Guaranteed cleanup:** on any terminal state the Playwright context/browser is closed and removed from `session-registry`; the worker never leaks Chromium processes. A safety sweep closes orphaned sessions on worker shutdown.
- **Idempotent leave:** leaving an already-terminal bot is a no-op success.
- **Redis unavailable:** API bot endpoints fail fast with a clear error; no silent drops.

---

## 7. Testing

- **backend unit tests** (Jest, matching existing style): URL validation (accept valid Meet links, reject others), ownership enforcement, status transitions in the service layer, job-enqueue called with correct payload (queue mocked). No live browser.
- **bot-worker unit tests:** status-transition logic and `session-registry` behaviour with the joiner mocked.
- **Manual/integration verification:** run the worker locally against a real test Google Meet link and confirm the bot appears and can be admitted, then leaves on command. (Not part of automated CI because it needs a live meeting.)

---

## 8. Out of Scope (future phases)

Deliberately excluded from v1; the schema (`botEmail`, `meetingId`, `platform`) and `joiner.interface.ts` are designed so these slot in without rework:

- Audio/video recording of the meeting.
- Transcription (self-hosted Whisper) and speaker diarization.
- Feeding captured transcripts into the existing Gemini analysis pipeline (linking `MeetingBot.meetingId → Meeting`).
- Google Calendar connection + automatic join of scheduled meetings.
- Signed-in Google-account mode (bot logs in with `botEmail` to skip waiting rooms).
- Zoom and Microsoft Teams joiners (new implementations of `joiner.interface.ts`).
- Frontend UI (the `Integrations`/`Meetings` pages consuming these endpoints).

---

## 9. Key Decisions Log

- **Self-hosted Playwright over third-party API (Recall.ai) / platform SDKs** — user preference to minimize third-party API calls and own the infra.
- **Google Meet first** — most automation-friendly (pure web app, guest join with just a name).
- **Named-guest join, not account login** — matches how Otter/Read.ai actually work; account login deferred as optional future work.
- **Separate `bot-worker` service, not in-backend** — keeps heavy Chromium off the API server; cleaner scaling boundary.
- **Redis/BullMQ for dispatch** — Redis is already in the stack; natural job-queue fit.
- **Manual link trigger for v1** — calendar auto-join deferred.
