# Meeting Bot (Google Meet, join-only) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-hosted bot that joins a Google Meet call as a named guest (mic + camera off), triggered by an authenticated API call, with its lifecycle tracked in the database.

**Architecture:** Two services communicating through the existing Redis instance. The existing Express **backend** exposes `/api/bots` endpoints, writes `MeetingBot` records to Postgres, and enqueues a join job on a BullMQ queue. A new standalone **bot-worker** service consumes jobs, drives Google Meet with Playwright/Chromium, and writes status back to the shared Postgres DB. A Redis pub/sub channel carries "leave" signals to live sessions.

**Tech Stack:** Node.js 20 + TypeScript, Express, Prisma + PostgreSQL, Redis (ioredis), BullMQ (job queue + control channel), Playwright (Chromium), Joi (validation), Jest + ts-jest (tests), Winston (logging).

## Global Constraints

- Language/runtime: Node.js (>= 18) + TypeScript, matching the existing backend. No new languages.
- Follow the existing module pattern: `*.routes.ts` / `*.controller.ts` / `*.service.ts` / `*.validation.ts`.
- All API responses use `sendSuccess` / `sendError` from `backend/src/utils/response.ts` and the `AppError` hierarchy from `backend/src/utils/errors.ts`.
- All `/api/bots` routes are JWT-protected via the existing `authenticate` middleware and enforce per-user ownership (mirror `getMeetingById`'s `ForbiddenError` pattern).
- No third-party meeting APIs (no Recall.ai / platform SDKs). Self-hosted Playwright only.
- The bot joins as a **named guest** — it does NOT sign into a Google account in v1.
- Prisma schema single source of truth stays in `backend/prisma/schema.prisma`; the worker generates its client from that same schema (no divergent copy).
- Redis is REQUIRED for the bot feature; if `REDIS_URL` is unset, bot endpoints fail fast with a 503-style error.
- Default bot display name: `ZeroClutter Notetaker`. Default admission timeout: 5 minutes (300000 ms).
- Bot status values (strings): `PENDING`, `JOINING`, `WAITING_ADMISSION`, `IN_CALL`, `LEFT`, `FAILED`.
- Out of scope: recording, transcription, analysis linkage, calendar auto-join, signed-in Google account, Zoom/Teams, frontend UI.

---

### Task 1: MeetingBot Prisma model + migration

**Files:**
- Modify: `backend/prisma/schema.prisma` (add `MeetingBot` model; add relation field to `User`)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `MeetingBot` table with fields `id, userId, meetingUrl, platform, displayName, status, statusDetail, botEmail, meetingId, joinedAt, leftAt, createdAt, updatedAt`. Consumed by every later task via Prisma.

- [ ] **Step 1: Add the model to the schema**

In `backend/prisma/schema.prisma`, add a relation field to the existing `User` model (inside the relations block, next to `meetings Meeting[]`):

```prisma
  meetingBots   MeetingBot[]
```

Then append this model at the end of the file:

```prisma
// ─── Meeting Bot ──────────────────────────────────────────────────────────────

model MeetingBot {
  id           String    @id @default(cuid())
  userId       String
  meetingUrl   String
  platform     String    @default("GOOGLE_MEET")
  displayName  String
  status       String    @default("PENDING")
  statusDetail String?
  botEmail     String?
  meetingId    String?
  joinedAt     DateTime?
  leftAt       DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}
```

- [ ] **Step 2: Validate the schema**

Run: `cd backend && npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 3: Create and apply the migration**

Run: `cd backend && npx prisma migrate dev --name add_meeting_bot`
Expected: a new folder `backend/prisma/migrations/<timestamp>_add_meeting_bot/` is created, migration applies successfully, and the Prisma client regenerates.

- [ ] **Step 4: Verify the client type exists**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors (the generated client now includes `prisma.meetingBot`).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(bot): add MeetingBot model and migration"
```

---

### Task 2: Backend errors, status constants, and validation

**Files:**
- Modify: `backend/src/utils/errors.ts` (add `ServiceUnavailableError`)
- Create: `backend/src/modules/meeting-bot/meeting-bot.constants.ts`
- Create: `backend/src/modules/meeting-bot/meeting-bot.validation.ts`
- Test: `backend/tests/meeting-bot.validation.test.ts`

**Interfaces:**
- Consumes: `AppError` from `backend/src/utils/errors.ts`.
- Produces:
  - `ServiceUnavailableError` (code `SERVICE_UNAVAILABLE`, status 503).
  - `BOT_STATUS` object + `BotStatus` type.
  - `createBotSchema` (Joi: `meetingUrl` required Google Meet URL, `displayName` optional string 1–100) and `listBotsSchema` (`page`, `limit`).

- [ ] **Step 1: Write the failing validation test**

Create `backend/tests/meeting-bot.validation.test.ts`:

```ts
import { createBotSchema, listBotsSchema } from '../src/modules/meeting-bot/meeting-bot.validation';

describe('createBotSchema', () => {
  it('accepts a valid Google Meet URL', () => {
    const { error } = createBotSchema.validate({ meetingUrl: 'https://meet.google.com/abc-defg-hij' });
    expect(error).toBeUndefined();
  });

  it('accepts a valid Meet URL with query params', () => {
    const { error } = createBotSchema.validate({ meetingUrl: 'https://meet.google.com/abc-defg-hij?authuser=0' });
    expect(error).toBeUndefined();
  });

  it('accepts an optional displayName', () => {
    const { error, value } = createBotSchema.validate({
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      displayName: 'My Notetaker',
    });
    expect(error).toBeUndefined();
    expect(value.displayName).toBe('My Notetaker');
  });

  it('rejects a missing meetingUrl', () => {
    const { error } = createBotSchema.validate({});
    expect(error).toBeDefined();
    expect(error!.message).toContain('Meeting URL is required');
  });

  it('rejects a non-Google-Meet URL', () => {
    const { error } = createBotSchema.validate({ meetingUrl: 'https://zoom.us/j/123456789' });
    expect(error).toBeDefined();
    expect(error!.message).toContain('valid Google Meet');
  });

  it('rejects a displayName longer than 100 chars', () => {
    const { error } = createBotSchema.validate({
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      displayName: 'x'.repeat(101),
    });
    expect(error).toBeDefined();
  });
});

describe('listBotsSchema', () => {
  it('applies defaults', () => {
    const { value } = listBotsSchema.validate({});
    expect(value.page).toBe(1);
    expect(value.limit).toBe(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest meeting-bot.validation --forceExit`
Expected: FAIL — cannot find module `meeting-bot.validation`.

- [ ] **Step 3: Add ServiceUnavailableError**

Append to `backend/src/utils/errors.ts`:

```ts
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 'SERVICE_UNAVAILABLE', 503);
  }
}
```

- [ ] **Step 4: Create the status constants**

Create `backend/src/modules/meeting-bot/meeting-bot.constants.ts`:

```ts
export const BOT_STATUS = {
  PENDING: 'PENDING',
  JOINING: 'JOINING',
  WAITING_ADMISSION: 'WAITING_ADMISSION',
  IN_CALL: 'IN_CALL',
  LEFT: 'LEFT',
  FAILED: 'FAILED',
} as const;

export type BotStatus = (typeof BOT_STATUS)[keyof typeof BOT_STATUS];

export const TERMINAL_STATUSES: BotStatus[] = [BOT_STATUS.LEFT, BOT_STATUS.FAILED];
```

- [ ] **Step 5: Create the validation schemas**

Create `backend/src/modules/meeting-bot/meeting-bot.validation.ts`:

```ts
import Joi from 'joi';

const GOOGLE_MEET_URL = /^https:\/\/meet\.google\.com\/[a-z0-9-]+(\?.*)?$/i;

export const createBotSchema = Joi.object({
  meetingUrl: Joi.string()
    .pattern(GOOGLE_MEET_URL)
    .required()
    .messages({
      'string.pattern.base': 'meetingUrl must be a valid Google Meet URL (https://meet.google.com/...)',
      'any.required': 'Meeting URL is required',
    }),
  displayName: Joi.string().min(1).max(100).optional().messages({
    'string.max': 'displayName must be at most 100 characters',
  }),
});

export const listBotsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && npx jest meeting-bot.validation --forceExit`
Expected: PASS (7 tests).

- [ ] **Step 7: Commit**

```bash
git add backend/src/utils/errors.ts backend/src/modules/meeting-bot/meeting-bot.constants.ts backend/src/modules/meeting-bot/meeting-bot.validation.ts backend/tests/meeting-bot.validation.test.ts
git commit -m "feat(bot): add bot status constants, validation, and 503 error"
```

---

### Task 3: Backend BullMQ queue + control publisher

**Files:**
- Modify: `backend/package.json` (add `bullmq` dependency)
- Create: `backend/src/modules/meeting-bot/meeting-bot.queue.ts`

**Interfaces:**
- Consumes: `env` from `backend/src/config/env.ts`, `ServiceUnavailableError` and `logger`.
- Produces:
  - `JOIN_QUEUE_NAME = 'meeting-bot-join'`, `CONTROL_CHANNEL = 'meeting-bot:control'`.
  - `enqueueJoinJob(botId: string): Promise<void>`.
  - `publishLeave(botId: string): Promise<void>`.
  - `closeBotQueue(): Promise<void>`.

- [ ] **Step 1: Install BullMQ**

Run: `cd backend && npm install bullmq`
Expected: `bullmq` added to `dependencies` in `backend/package.json`.

- [ ] **Step 2: Create the queue module**

Create `backend/src/modules/meeting-bot/meeting-bot.queue.ts`:

```ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { ServiceUnavailableError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const JOIN_QUEUE_NAME = 'meeting-bot-join';
export const CONTROL_CHANNEL = 'meeting-bot:control';

let connection: IORedis | null = null;
let joinQueue: Queue | null = null;

const getConnection = (): IORedis => {
  if (!env.REDIS_URL) {
    throw new ServiceUnavailableError('Meeting bot feature requires Redis (REDIS_URL is not configured)');
  }
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
    connection.on('error', (err) => logger.error('Bot queue Redis error', { error: err.message }));
  }
  return connection;
};

const getJoinQueue = (): Queue => {
  if (!joinQueue) {
    joinQueue = new Queue(JOIN_QUEUE_NAME, { connection: getConnection() });
  }
  return joinQueue;
};

export const enqueueJoinJob = async (botId: string): Promise<void> => {
  await getJoinQueue().add('join', { botId }, { removeOnComplete: true, removeOnFail: 100 });
};

export const publishLeave = async (botId: string): Promise<void> => {
  await getConnection().publish(CONTROL_CHANNEL, JSON.stringify({ botId, action: 'leave' }));
};

export const closeBotQueue = async (): Promise<void> => {
  if (joinQueue) {
    await joinQueue.close();
    joinQueue = null;
  }
  if (connection) {
    await connection.quit();
    connection = null;
  }
};
```

- [ ] **Step 3: Verify it type-checks**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/modules/meeting-bot/meeting-bot.queue.ts
git commit -m "feat(bot): add BullMQ join queue and leave control publisher"
```

---

### Task 4: Backend bot service

**Files:**
- Create: `backend/src/modules/meeting-bot/meeting-bot.service.ts`
- Test: `backend/tests/meeting-bot.service.test.ts`

**Interfaces:**
- Consumes: `prisma` (default export of `backend/src/config/database.ts`), `NotFoundError` + `ForbiddenError`, `paginatedResponse`, `enqueueJoinJob` + `publishLeave` from the queue module, `BOT_STATUS` + `TERMINAL_STATUSES`.
- Produces:
  - `createBot(userId: string, meetingUrl: string, displayName: string): Promise<MeetingBot>` — creates a `PENDING` record, enqueues a join job; on enqueue failure marks the record `FAILED` and rethrows.
  - `getBotById(id: string, userId: string): Promise<MeetingBot>` — throws `NotFoundError` / `ForbiddenError`.
  - `listBots(userId: string, page: number, limit: number)` — returns `paginatedResponse` shape.
  - `requestLeave(id: string, userId: string): Promise<MeetingBot>` — ownership-checked, idempotent for terminal bots, otherwise publishes a leave signal.

- [ ] **Step 1: Write the failing service test**

Create `backend/tests/meeting-bot.service.test.ts`:

```ts
jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: {
    meetingBot: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../src/modules/meeting-bot/meeting-bot.queue', () => ({
  enqueueJoinJob: jest.fn(),
  publishLeave: jest.fn(),
}));

import prisma from '../src/config/database';
import { enqueueJoinJob, publishLeave } from '../src/modules/meeting-bot/meeting-bot.queue';
import { createBot, getBotById, requestLeave } from '../src/modules/meeting-bot/meeting-bot.service';
import { ForbiddenError, NotFoundError } from '../src/utils/errors';

const mockPrisma = prisma as unknown as {
  meetingBot: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
};

beforeEach(() => jest.clearAllMocks());

describe('createBot', () => {
  it('creates a PENDING record and enqueues a join job', async () => {
    mockPrisma.meetingBot.create.mockResolvedValue({ id: 'bot1', userId: 'u1', status: 'PENDING' });
    const bot = await createBot('u1', 'https://meet.google.com/abc-defg-hij', 'ZeroClutter Notetaker');
    expect(bot.id).toBe('bot1');
    expect(mockPrisma.meetingBot.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        displayName: 'ZeroClutter Notetaker',
        status: 'PENDING',
      },
    });
    expect(enqueueJoinJob).toHaveBeenCalledWith('bot1');
  });

  it('marks the record FAILED and rethrows if enqueue fails', async () => {
    mockPrisma.meetingBot.create.mockResolvedValue({ id: 'bot2', userId: 'u1', status: 'PENDING' });
    (enqueueJoinJob as jest.Mock).mockRejectedValue(new Error('redis down'));
    await expect(createBot('u1', 'https://meet.google.com/abc-defg-hij', 'Bot')).rejects.toThrow('redis down');
    expect(mockPrisma.meetingBot.update).toHaveBeenCalledWith({
      where: { id: 'bot2' },
      data: { status: 'FAILED', statusDetail: 'Failed to enqueue join job: redis down' },
    });
  });
});

describe('getBotById', () => {
  it('throws NotFoundError when missing', async () => {
    mockPrisma.meetingBot.findUnique.mockResolvedValue(null);
    await expect(getBotById('x', 'u1')).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when owned by another user', async () => {
    mockPrisma.meetingBot.findUnique.mockResolvedValue({ id: 'b', userId: 'other' });
    await expect(getBotById('b', 'u1')).rejects.toThrow(ForbiddenError);
  });

  it('returns the bot for its owner', async () => {
    mockPrisma.meetingBot.findUnique.mockResolvedValue({ id: 'b', userId: 'u1' });
    const bot = await getBotById('b', 'u1');
    expect(bot.id).toBe('b');
  });
});

describe('requestLeave', () => {
  it('publishes a leave signal for an active bot', async () => {
    mockPrisma.meetingBot.findUnique.mockResolvedValue({ id: 'b', userId: 'u1', status: 'IN_CALL' });
    await requestLeave('b', 'u1');
    expect(publishLeave).toHaveBeenCalledWith('b');
  });

  it('is a no-op for a terminal bot', async () => {
    mockPrisma.meetingBot.findUnique.mockResolvedValue({ id: 'b', userId: 'u1', status: 'LEFT' });
    await requestLeave('b', 'u1');
    expect(publishLeave).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest meeting-bot.service --forceExit`
Expected: FAIL — cannot find module `meeting-bot.service`.

- [ ] **Step 3: Create the service**

Create `backend/src/modules/meeting-bot/meeting-bot.service.ts`:

```ts
import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { paginatedResponse } from '../../utils/response';
import { enqueueJoinJob, publishLeave } from './meeting-bot.queue';
import { BOT_STATUS, TERMINAL_STATUSES, BotStatus } from './meeting-bot.constants';

export const createBot = async (userId: string, meetingUrl: string, displayName: string) => {
  const bot = await prisma.meetingBot.create({
    data: { userId, meetingUrl, displayName, status: BOT_STATUS.PENDING },
  });

  try {
    await enqueueJoinJob(bot.id);
  } catch (err) {
    await prisma.meetingBot.update({
      where: { id: bot.id },
      data: { status: BOT_STATUS.FAILED, statusDetail: `Failed to enqueue join job: ${(err as Error).message}` },
    });
    throw err;
  }

  return bot;
};

export const getBotById = async (id: string, userId: string) => {
  const bot = await prisma.meetingBot.findUnique({ where: { id } });
  if (!bot) throw new NotFoundError('Bot');
  if (bot.userId !== userId) throw new ForbiddenError('You do not have access to this bot');
  return bot;
};

export const listBots = async (userId: string, page: number, limit: number) => {
  const [total, items] = await Promise.all([
    prisma.meetingBot.count({ where: { userId } }),
    prisma.meetingBot.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return paginatedResponse(items, total, page, limit);
};

export const requestLeave = async (id: string, userId: string) => {
  const bot = await getBotById(id, userId);
  if (TERMINAL_STATUSES.includes(bot.status as BotStatus)) return bot;
  await publishLeave(bot.id);
  return bot;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest meeting-bot.service --forceExit`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/meeting-bot/meeting-bot.service.ts backend/tests/meeting-bot.service.test.ts
git commit -m "feat(bot): add bot service (create/get/list/leave) with ownership"
```

---

### Task 5: Backend controller, routes, env default, and app wiring

**Files:**
- Modify: `backend/src/config/env.ts` (add `BOT_DEFAULT_NAME`)
- Create: `backend/src/modules/meeting-bot/meeting-bot.controller.ts`
- Create: `backend/src/modules/meeting-bot/meeting-bot.routes.ts`
- Modify: `backend/src/app.ts` (import + mount router)
- Modify: `backend/src/server.ts` (close the bot queue on shutdown)

**Interfaces:**
- Consumes: `createBotSchema` + `listBotsSchema`, `createBot` / `getBotById` / `listBots` / `requestLeave`, `sendSuccess`, `ValidationError`, `AuthenticatedRequest`, `authenticate` middleware, `env`, `closeBotQueue`.
- Produces: Express router mounted at `/api/bots` with `POST /`, `GET /`, `GET /:id`, `POST /:id/leave`.

- [ ] **Step 1: Add the default bot name to env**

In `backend/src/config/env.ts`, add inside the `env` object (e.g. after `REDIS_URL`):

```ts
  BOT_DEFAULT_NAME: optional('BOT_DEFAULT_NAME', 'ZeroClutter Notetaker'),
```

- [ ] **Step 2: Create the controller**

Create `backend/src/modules/meeting-bot/meeting-bot.controller.ts`:

```ts
import { Response, NextFunction } from 'express';
import { createBotSchema, listBotsSchema } from './meeting-bot.validation';
import { createBot, getBotById, listBots, requestLeave } from './meeting-bot.service';
import { sendSuccess } from '../../utils/response';
import { ValidationError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';
import { env } from '../../config/env';

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = createBotSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new ValidationError(error.details.map((d) => d.message).join('; '));
    }
    const bot = await createBot(req.user!.id, value.meetingUrl, value.displayName || env.BOT_DEFAULT_NAME);
    sendSuccess(res, bot, 202);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bot = await getBotById(req.params.id as string, req.user!.id);
    sendSuccess(res, bot);
  } catch (err) {
    next(err);
  }
};

export const list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = listBotsSchema.validate(req.query, { abortEarly: false });
    if (error) {
      throw new ValidationError(error.details.map((d) => d.message).join('; '));
    }
    const result = await listBots(req.user!.id, value.page, value.limit);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const leave = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bot = await requestLeave(req.params.id as string, req.user!.id);
    sendSuccess(res, bot, 202);
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 3: Create the routes**

Create `backend/src/modules/meeting-bot/meeting-bot.routes.ts`:

```ts
import { Router } from 'express';
import { create, getOne, list, leave } from './meeting-bot.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/bots:
 *   post:
 *     summary: Dispatch a bot to join a Google Meet call
 *     tags: [Meeting Bots]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [meetingUrl]
 *             properties:
 *               meetingUrl:
 *                 type: string
 *                 example: https://meet.google.com/abc-defg-hij
 *               displayName:
 *                 type: string
 *                 example: ZeroClutter Notetaker
 *     responses:
 *       202:
 *         description: Bot accepted and dispatched
 *       400:
 *         description: Validation error
 *       503:
 *         description: Redis unavailable
 */
router.post('/', create);

/**
 * @swagger
 * /api/bots:
 *   get:
 *     summary: List the caller's meeting bots (paginated)
 *     tags: [Meeting Bots]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of bots
 */
router.get('/', list);

/**
 * @swagger
 * /api/bots/{id}:
 *   get:
 *     summary: Get a bot's current status
 *     tags: [Meeting Bots]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bot record
 *       404:
 *         description: Bot not found
 */
router.get('/:id', getOne);

/**
 * @swagger
 * /api/bots/{id}/leave:
 *   post:
 *     summary: Signal a live bot to leave the meeting
 *     tags: [Meeting Bots]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       202:
 *         description: Leave signal accepted
 *       404:
 *         description: Bot not found
 */
router.post('/:id/leave', leave);

export default router;
```

- [ ] **Step 4: Mount the router in the app**

In `backend/src/app.ts`, add the import alongside the other route imports:

```ts
import meetingBotRoutes from './modules/meeting-bot/meeting-bot.routes';
```

And mount it next to the other application routes (after the `/api/action-items` line):

```ts
app.use('/api/bots', meetingBotRoutes);
```

- [ ] **Step 5: Close the queue on shutdown**

In `backend/src/server.ts`, add the import:

```ts
import { closeBotQueue } from './modules/meeting-bot/meeting-bot.queue';
```

And inside `gracefulShutdown`, add `await closeBotQueue();` before `logger.info('Server closed.')`:

```ts
    server.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      await closeBotQueue();
      logger.info('Server closed.');
      process.exit(0);
    });
```

- [ ] **Step 6: Verify type-check and existing tests still pass**

Run: `cd backend && npx tsc --noEmit && npx jest --forceExit`
Expected: no type errors; all tests pass (existing 48 + new bot tests).

- [ ] **Step 7: Commit**

```bash
git add backend/src/config/env.ts backend/src/modules/meeting-bot/meeting-bot.controller.ts backend/src/modules/meeting-bot/meeting-bot.routes.ts backend/src/app.ts backend/src/server.ts
git commit -m "feat(bot): expose /api/bots endpoints and wire into app"
```

---

### Task 6: bot-worker service scaffold

**Files:**
- Create: `bot-worker/package.json`
- Create: `bot-worker/tsconfig.json`
- Create: `bot-worker/jest.config.js`
- Create: `bot-worker/.gitignore`
- Create: `bot-worker/.env.example`
- Create: `bot-worker/src/config.ts`
- Create: `bot-worker/src/prisma.ts`
- Create: `bot-worker/src/logger.ts`
- Create: `bot-worker/src/constants.ts`

**Interfaces:**
- Consumes: the Prisma schema at `backend/prisma/schema.prisma` (generated into the worker's own `@prisma/client`).
- Produces:
  - `config` object: `DATABASE_URL`, `REDIS_URL`, `BOT_DEFAULT_NAME`, `NAV_TIMEOUT_MS`, `ADMISSION_TIMEOUT_MS`, `IN_CALL_POLL_MS`, `HEADLESS`.
  - `prisma` default export (PrismaClient against shared DB).
  - `logger` (Winston).
  - `BOT_STATUS` constants (same string values as the backend).

- [ ] **Step 1: Create package.json**

Create `bot-worker/package.json`:

```json
{
  "name": "zeroclutter-bot-worker",
  "version": "1.0.0",
  "description": "Self-hosted meeting bot worker: joins Google Meet via Playwright",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --forceExit --detectOpenHandles",
    "lint": "tsc --noEmit",
    "prisma:generate": "prisma generate --schema=../backend/prisma/schema.prisma"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bullmq": "^5.0.0",
    "dotenv": "^16.4.5",
    "ioredis": "^5.11.0",
    "playwright": "^1.49.0",
    "winston": "^3.17.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.2",
    "jest": "^29.7.0",
    "prisma": "^5.22.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `bot-worker/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create jest.config.js, .gitignore, and .env.example**

Create `bot-worker/jest.config.js`:

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
};
```

Create `bot-worker/.gitignore`:

```
node_modules
dist
.env
```

Create `bot-worker/.env.example`:

```
# Must point to the SAME PostgreSQL database as the backend
DATABASE_URL=postgresql://user:pass@localhost:5432/zeroclutter

# Must point to the SAME Redis instance as the backend
REDIS_URL=redis://localhost:6379

# Display name the bot uses when it has none of its own
BOT_DEFAULT_NAME=ZeroClutter Notetaker

# Timeouts (milliseconds)
NAV_TIMEOUT_MS=30000
ADMISSION_TIMEOUT_MS=300000
IN_CALL_POLL_MS=2000

# Set to "false" to watch the browser during local debugging
HEADLESS=true
```

- [ ] **Step 4: Create config.ts**

Create `bot-worker/src/config.ts`:

```ts
import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

export const config = {
  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL: required('REDIS_URL'),
  BOT_DEFAULT_NAME: process.env.BOT_DEFAULT_NAME || 'ZeroClutter Notetaker',
  NAV_TIMEOUT_MS: parseInt(process.env.NAV_TIMEOUT_MS || '30000', 10),
  ADMISSION_TIMEOUT_MS: parseInt(process.env.ADMISSION_TIMEOUT_MS || '300000', 10),
  IN_CALL_POLL_MS: parseInt(process.env.IN_CALL_POLL_MS || '2000', 10),
  HEADLESS: (process.env.HEADLESS || 'true') !== 'false',
};
```

- [ ] **Step 5: Create prisma.ts, logger.ts, constants.ts**

Create `bot-worker/src/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

Create `bot-worker/src/logger.ts`:

```ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'zeroclutter-bot-worker' },
  transports: [new winston.transports.Console()],
});
```

Create `bot-worker/src/constants.ts`:

```ts
export const BOT_STATUS = {
  PENDING: 'PENDING',
  JOINING: 'JOINING',
  WAITING_ADMISSION: 'WAITING_ADMISSION',
  IN_CALL: 'IN_CALL',
  LEFT: 'LEFT',
  FAILED: 'FAILED',
} as const;

export type BotStatus = (typeof BOT_STATUS)[keyof typeof BOT_STATUS];
```

- [ ] **Step 6: Install dependencies and generate the Prisma client**

Run: `cd bot-worker && npm install && npm run prisma:generate && npx playwright install --with-deps chromium`
Expected: dependencies install, Prisma client generates into `bot-worker/node_modules/@prisma/client` (including `meetingBot`), and Chromium downloads.

- [ ] **Step 7: Verify it type-checks**

Run: `cd bot-worker && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add bot-worker/package.json bot-worker/package-lock.json bot-worker/tsconfig.json bot-worker/jest.config.js bot-worker/.gitignore bot-worker/.env.example bot-worker/src/config.ts bot-worker/src/prisma.ts bot-worker/src/logger.ts bot-worker/src/constants.ts
git commit -m "chore(bot-worker): scaffold worker service (config, prisma, logger)"
```

---

### Task 7: Worker session registry + status updater (with tests)

**Files:**
- Create: `bot-worker/src/session-registry.ts`
- Create: `bot-worker/src/status.ts`
- Test: `bot-worker/tests/session-registry.test.ts`
- Test: `bot-worker/tests/status.test.ts`

**Interfaces:**
- Consumes: `prisma` default export, `BOT_STATUS`, Playwright `Browser` type.
- Produces:
  - `session-registry`: `register(botId)`, `markLeave(botId): boolean`, `unregister(botId)`, `getActiveBotIds(): string[]`, `closeAll(): Promise<void>`, and `ActiveSession { browser: Browser | null; leaveRequested: boolean }`.
  - `status`: `updateStatus(botId: string, status: string, detail?: string): Promise<void>` — also stamps `joinedAt` on `IN_CALL` and `leftAt` on `LEFT`/`FAILED`.

- [ ] **Step 1: Write the failing registry test**

Create `bot-worker/tests/session-registry.test.ts`:

```ts
import * as registry from '../src/session-registry';

beforeEach(async () => {
  await registry.closeAll();
});

describe('session-registry', () => {
  it('registers a session with defaults', () => {
    const session = registry.register('b1');
    expect(session.leaveRequested).toBe(false);
    expect(session.browser).toBeNull();
    expect(registry.getActiveBotIds()).toContain('b1');
  });

  it('markLeave flips the flag and returns true for a known bot', () => {
    registry.register('b2');
    expect(registry.markLeave('b2')).toBe(true);
  });

  it('markLeave returns false for an unknown bot', () => {
    expect(registry.markLeave('nope')).toBe(false);
  });

  it('unregister removes the session', () => {
    registry.register('b3');
    registry.unregister('b3');
    expect(registry.getActiveBotIds()).not.toContain('b3');
  });
});
```

- [ ] **Step 2: Write the failing status test**

Create `bot-worker/tests/status.test.ts`:

```ts
jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: { meetingBot: { update: jest.fn() } },
}));

import prisma from '../src/prisma';
import { updateStatus } from '../src/status';
import { BOT_STATUS } from '../src/constants';

const mockUpdate = (prisma as unknown as { meetingBot: { update: jest.Mock } }).meetingBot.update;

beforeEach(() => jest.clearAllMocks());

describe('updateStatus', () => {
  it('stamps joinedAt when moving to IN_CALL', async () => {
    await updateStatus('b1', BOT_STATUS.IN_CALL);
    const arg = mockUpdate.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 'b1' });
    expect(arg.data.status).toBe('IN_CALL');
    expect(arg.data.joinedAt).toBeInstanceOf(Date);
  });

  it('stamps leftAt when moving to LEFT', async () => {
    await updateStatus('b1', BOT_STATUS.LEFT, 'done');
    const arg = mockUpdate.mock.calls[0][0];
    expect(arg.data.status).toBe('LEFT');
    expect(arg.data.statusDetail).toBe('done');
    expect(arg.data.leftAt).toBeInstanceOf(Date);
  });

  it('stamps leftAt when moving to FAILED', async () => {
    await updateStatus('b1', BOT_STATUS.FAILED, 'boom');
    const arg = mockUpdate.mock.calls[0][0];
    expect(arg.data.leftAt).toBeInstanceOf(Date);
  });

  it('does not stamp timestamps for JOINING', async () => {
    await updateStatus('b1', BOT_STATUS.JOINING);
    const arg = mockUpdate.mock.calls[0][0];
    expect(arg.data.joinedAt).toBeUndefined();
    expect(arg.data.leftAt).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd bot-worker && npx jest --forceExit`
Expected: FAIL — cannot find modules `session-registry` / `status`.

- [ ] **Step 4: Create the session registry**

Create `bot-worker/src/session-registry.ts`:

```ts
import type { Browser } from 'playwright';

export interface ActiveSession {
  browser: Browser | null;
  leaveRequested: boolean;
}

const sessions = new Map<string, ActiveSession>();

export const register = (botId: string): ActiveSession => {
  const session: ActiveSession = { browser: null, leaveRequested: false };
  sessions.set(botId, session);
  return session;
};

export const markLeave = (botId: string): boolean => {
  const session = sessions.get(botId);
  if (!session) return false;
  session.leaveRequested = true;
  return true;
};

export const unregister = (botId: string): void => {
  sessions.delete(botId);
};

export const getActiveBotIds = (): string[] => Array.from(sessions.keys());

export const closeAll = async (): Promise<void> => {
  for (const session of sessions.values()) {
    try {
      await session.browser?.close();
    } catch {
      // ignore cleanup errors
    }
  }
  sessions.clear();
};
```

- [ ] **Step 5: Create the status updater**

Create `bot-worker/src/status.ts`:

```ts
import prisma from './prisma';
import { BOT_STATUS } from './constants';

export const updateStatus = async (botId: string, status: string, detail?: string): Promise<void> => {
  const data: Record<string, unknown> = { status, statusDetail: detail ?? null };
  if (status === BOT_STATUS.IN_CALL) data.joinedAt = new Date();
  if (status === BOT_STATUS.LEFT || status === BOT_STATUS.FAILED) data.leftAt = new Date();
  await prisma.meetingBot.update({ where: { id: botId }, data });
};
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd bot-worker && npx jest --forceExit`
Expected: PASS (8 tests).

- [ ] **Step 7: Commit**

```bash
git add bot-worker/src/session-registry.ts bot-worker/src/status.ts bot-worker/tests/session-registry.test.ts bot-worker/tests/status.test.ts
git commit -m "feat(bot-worker): add session registry and status updater"
```

---

### Task 8: Google Meet joiner (interface + selectors + Playwright automation)

**Files:**
- Create: `bot-worker/src/joiners/joiner.interface.ts`
- Create: `bot-worker/src/joiners/selectors.ts`
- Create: `bot-worker/src/joiners/google-meet.joiner.ts`

**Interfaces:**
- Consumes: `config`, `BOT_STATUS`, `logger`, Playwright `chromium` + `Browser`, `Page`.
- Produces:
  - `JoinContext { botId; meetingUrl; displayName }`, `JoinerDeps { onStatus; isLeaveRequested; setBrowser }`, `Joiner { join(ctx, deps) }`.
  - `SELECTORS` object (all Google Meet DOM selectors in one place).
  - `googleMeetJoiner: Joiner` — the automation. Consumed by Task 9's queue consumer.

> **Note:** the Playwright automation requires a live browser and a real meeting, so it is verified manually in Task 10 rather than by an automated unit test. Keep every Meet selector in `selectors.ts` so UI changes are a one-file fix.

- [ ] **Step 1: Create the joiner interface**

Create `bot-worker/src/joiners/joiner.interface.ts`:

```ts
import type { Browser } from 'playwright';

export interface JoinContext {
  botId: string;
  meetingUrl: string;
  displayName: string;
}

export interface JoinerDeps {
  onStatus: (status: string, detail?: string) => Promise<void>;
  isLeaveRequested: () => boolean;
  setBrowser: (browser: Browser) => void;
}

export interface Joiner {
  join(ctx: JoinContext, deps: JoinerDeps): Promise<void>;
}
```

- [ ] **Step 2: Create the selectors**

Create `bot-worker/src/joiners/selectors.ts`:

```ts
export const SELECTORS = {
  nameInput: 'input[placeholder="Your name"], input[aria-label="Your name"]',
  turnOffMic: '[aria-label*="Turn off microphone"], [data-tooltip*="Turn off microphone"]',
  turnOffCam: '[aria-label*="Turn off camera"], [data-tooltip*="Turn off camera"]',
  joinButtons: [
    'button:has-text("Ask to join")',
    'button:has-text("Join now")',
    'span:has-text("Ask to join")',
    'span:has-text("Join now")',
  ],
  inCall: 'button[aria-label="Leave call"], [aria-label="Leave call"], button[aria-label*="Leave call"]',
  meetingEnded:
    'text=/You(\'|)ve left the meeting|Return to home screen|You were removed|Your meeting code|Ask to join/i',
};
```

- [ ] **Step 3: Create the Google Meet joiner**

Create `bot-worker/src/joiners/google-meet.joiner.ts`:

```ts
import { chromium, Browser, Page } from 'playwright';
import { config } from '../config';
import { BOT_STATUS } from '../constants';
import { logger } from '../logger';
import { Joiner, JoinContext, JoinerDeps } from './joiner.interface';
import { SELECTORS } from './selectors';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isVisible = async (page: Page, selector: string): Promise<boolean> =>
  page.locator(selector).first().isVisible().catch(() => false);

const waitForAdmission = async (page: Page, timeoutMs: number, isLeaveRequested: () => boolean): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (isLeaveRequested()) return false;
    if (await isVisible(page, SELECTORS.inCall)) return true;
    await sleep(2000);
  }
  return false;
};

export const googleMeetJoiner: Joiner = {
  async join(ctx: JoinContext, deps: JoinerDeps): Promise<void> {
    await deps.onStatus(BOT_STATUS.JOINING);

    const browser: Browser = await chromium.launch({
      headless: config.HEADLESS,
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
      ],
    });
    deps.setBrowser(browser);

    const context = await browser.newContext({ permissions: [] });
    const page = await context.newPage();

    await page.goto(ctx.meetingUrl, { waitUntil: 'networkidle', timeout: config.NAV_TIMEOUT_MS });

    const nameInput = page.locator(SELECTORS.nameInput).first();
    await nameInput.waitFor({ timeout: config.NAV_TIMEOUT_MS });
    await nameInput.fill(ctx.displayName);

    // Best-effort: ensure mic + camera are off before joining.
    await page.locator(SELECTORS.turnOffMic).first().click({ timeout: 2000 }).catch(() => undefined);
    await page.locator(SELECTORS.turnOffCam).first().click({ timeout: 2000 }).catch(() => undefined);

    let clicked = false;
    for (const selector of SELECTORS.joinButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) throw new Error('Join button not found (Google Meet UI may have changed)');

    await deps.onStatus(BOT_STATUS.WAITING_ADMISSION);

    const admitted = await waitForAdmission(page, config.ADMISSION_TIMEOUT_MS, deps.isLeaveRequested);
    if (!admitted) {
      if (deps.isLeaveRequested()) {
        await deps.onStatus(BOT_STATUS.LEFT, 'Left before admission');
        return;
      }
      throw new Error(`Not admitted within ${Math.round(config.ADMISSION_TIMEOUT_MS / 60000)} min`);
    }

    await deps.onStatus(BOT_STATUS.IN_CALL);
    logger.info('Bot admitted to meeting', { botId: ctx.botId });

    while (true) {
      if (deps.isLeaveRequested()) break;
      if (!(await isVisible(page, SELECTORS.inCall))) break;
      await sleep(config.IN_CALL_POLL_MS);
    }

    await deps.onStatus(BOT_STATUS.LEFT);
  },
};
```

- [ ] **Step 4: Verify it type-checks**

Run: `cd bot-worker && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add bot-worker/src/joiners
git commit -m "feat(bot-worker): add Google Meet joiner with centralized selectors"
```

---

### Task 9: Worker queue consumer, control subscriber, and bootstrap

**Files:**
- Create: `bot-worker/src/queue.ts`
- Create: `bot-worker/src/control.ts`
- Create: `bot-worker/src/index.ts`

**Interfaces:**
- Consumes: `config`, `prisma`, `BOT_STATUS`, `updateStatus`, `session-registry`, `googleMeetJoiner`, `logger`, BullMQ `Worker`, `ioredis`.
- Produces:
  - `queue.ts`: `startQueueWorker(): Worker` and `processJoin(botId: string): Promise<void>`.
  - `control.ts`: `startControlSubscriber(): IORedis`.
  - `index.ts`: process entry point that boots both and handles graceful shutdown.
- Queue name and channel MUST match the backend: `meeting-bot-join` and `meeting-bot:control`.

- [ ] **Step 1: Create the queue consumer**

Create `bot-worker/src/queue.ts`:

```ts
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config';
import prisma from './prisma';
import { BOT_STATUS } from './constants';
import { updateStatus } from './status';
import * as registry from './session-registry';
import { googleMeetJoiner } from './joiners/google-meet.joiner';
import { logger } from './logger';

const JOIN_QUEUE_NAME = 'meeting-bot-join';

export const processJoin = async (botId: string): Promise<void> => {
  const bot = await prisma.meetingBot.findUnique({ where: { id: botId } });
  if (!bot) {
    logger.warn('Join job for unknown bot', { botId });
    return;
  }
  if (bot.status === BOT_STATUS.LEFT || bot.status === BOT_STATUS.FAILED) {
    logger.info('Skipping join for terminal bot', { botId, status: bot.status });
    return;
  }

  const session = registry.register(botId);
  try {
    await googleMeetJoiner.join(
      { botId, meetingUrl: bot.meetingUrl, displayName: bot.displayName },
      {
        onStatus: (status, detail) => updateStatus(botId, status, detail),
        isLeaveRequested: () => session.leaveRequested,
        setBrowser: (browser) => {
          session.browser = browser;
        },
      },
    );
  } catch (err) {
    logger.error('Join failed', { botId, error: (err as Error).message });
    await updateStatus(botId, BOT_STATUS.FAILED, (err as Error).message);
  } finally {
    try {
      await session.browser?.close();
    } catch {
      // ignore cleanup errors
    }
    registry.unregister(botId);
  }
};

export const startQueueWorker = (): Worker => {
  const connection = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });
  const worker = new Worker(
    JOIN_QUEUE_NAME,
    async (job) => {
      const { botId } = job.data as { botId: string };
      await processJoin(botId);
    },
    { connection, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error('Join job errored', { botId: job?.data?.botId, error: err.message });
  });

  logger.info('Join queue worker started', { queue: JOIN_QUEUE_NAME });
  return worker;
};
```

- [ ] **Step 2: Create the control subscriber**

Create `bot-worker/src/control.ts`:

```ts
import IORedis from 'ioredis';
import { config } from './config';
import * as registry from './session-registry';
import { logger } from './logger';

const CONTROL_CHANNEL = 'meeting-bot:control';

export const startControlSubscriber = (): IORedis => {
  const sub = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });

  sub.subscribe(CONTROL_CHANNEL, (err) => {
    if (err) logger.error('Failed to subscribe to control channel', { error: err.message });
    else logger.info('Subscribed to control channel', { channel: CONTROL_CHANNEL });
  });

  sub.on('message', (_channel, message) => {
    try {
      const { botId, action } = JSON.parse(message) as { botId: string; action: string };
      if (action === 'leave') {
        const found = registry.markLeave(botId);
        logger.info('Leave signal received', { botId, found });
      }
    } catch (err) {
      logger.error('Malformed control message', { message, error: (err as Error).message });
    }
  });

  return sub;
};
```

- [ ] **Step 3: Create the bootstrap entry point**

Create `bot-worker/src/index.ts`:

```ts
import { startQueueWorker } from './queue';
import { startControlSubscriber } from './control';
import prisma from './prisma';
import * as registry from './session-registry';
import { logger } from './logger';

const main = async (): Promise<void> => {
  await prisma.$connect();
  const worker = startQueueWorker();
  const sub = startControlSubscriber();
  logger.info('bot-worker started');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info('Shutting down bot-worker', { signal });
    await registry.closeAll();
    await worker.close();
    sub.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection', { reason }));
};

main().catch((err) => {
  logger.error('bot-worker failed to start', { error: (err as Error).message });
  process.exit(1);
});
```

- [ ] **Step 4: Verify it type-checks**

Run: `cd bot-worker && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify the worker boots (smoke test)**

With a local Redis and Postgres running (and `bot-worker/.env` filled in from `.env.example`):
Run: `cd bot-worker && npm run dev`
Expected: logs `Join queue worker started`, `Subscribed to control channel`, and `bot-worker started`, with no crash. Stop it with Ctrl+C and confirm a clean shutdown log.

- [ ] **Step 6: Commit**

```bash
git add bot-worker/src/queue.ts bot-worker/src/control.ts bot-worker/src/index.ts
git commit -m "feat(bot-worker): add queue consumer, control subscriber, and bootstrap"
```

---

### Task 10: Documentation + end-to-end manual verification

**Files:**
- Modify: `backend/.env.example` (add `BOT_DEFAULT_NAME` and note Redis is required for bots)
- Modify: `backend/README.md` (add a "Meeting Bot" section documenting the two-service setup and endpoints)

**Interfaces:**
- Consumes: everything built in Tasks 1–9.
- Produces: setup docs + a verified end-to-end join.

- [ ] **Step 1: Update backend/.env.example**

Add to `backend/.env.example`:

```
# Default display name the dispatched meeting bot uses
BOT_DEFAULT_NAME=ZeroClutter Notetaker

# NOTE: REDIS_URL is REQUIRED for the meeting-bot feature (job queue + control channel).
# The rest of the app still runs without Redis.
```

- [ ] **Step 2: Document the feature in backend/README.md**

Add a new section to `backend/README.md`:

```markdown
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
```

- [ ] **Step 3: End-to-end verification against a real meeting**

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

- [ ] **Step 4: Commit**

```bash
git add backend/.env.example backend/README.md
git commit -m "docs(bot): document meeting-bot setup, endpoints, and verification"
```

---

## Self-Review

**1. Spec coverage:**
- Success criteria (join Meet as named guest, mic/cam off, host admits, status tracked, can leave) → Tasks 1, 4, 5, 8, 9, 10. ✅
- Two-service architecture + Redis (BullMQ dispatch, pub/sub leave) → Tasks 3, 6, 9. ✅
- `MeetingBot` data model + status lifecycle → Tasks 1, 2, 7. ✅
- API (`POST/GET/GET list/leave`, auth, ownership, 202) → Tasks 4, 5. ✅
- Named-guest join (no account login) → Task 8. ✅
- Error handling (timeouts, structured `statusDetail`, selector isolation, guaranteed cleanup, idempotent leave, Redis-down 503) → Tasks 3, 4, 8, 9. ✅
- Testing (validation, service, registry, status units; manual browser/e2e) → Tasks 2, 4, 7, 10. ✅
- Prisma single source of truth (worker generates from backend schema) → Task 6. ✅
- Out-of-scope fields reserved (`botEmail`, `meetingId`, `platform`) → Task 1. ✅

**2. Placeholder scan:** No "TBD"/"handle edge cases"/"write tests for the above" — every code and test step is complete. ✅

**3. Type consistency:** `BOT_STATUS` string values match across backend and worker; `enqueueJoinJob(botId)` / `publishLeave(botId)` signatures match producer (Task 3) and consumer expectations; queue name `meeting-bot-join` and channel `meeting-bot:control` are identical in backend (Task 3) and worker (Task 9); `Joiner` / `JoinerDeps` shape defined in Task 8 matches its use in Task 9; `updateStatus(botId, status, detail?)` consistent across Tasks 7 and 9. ✅








