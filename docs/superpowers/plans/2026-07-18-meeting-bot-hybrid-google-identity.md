# Meeting Bot Hybrid Google Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the self-hosted Google Meet worker try an Otter-style unsigned guest join first, then retry once with a dedicated Google bot session when Meet requires an account, without purchasing a meeting-bot API subscription.

**Architecture:** Keep the existing backend, BullMQ queue, Redis control channel, Prisma model, and frontend. Split Google-specific browser work into authentication/session management, screen classification/page operations, and hybrid orchestration. A one-time headed login command saves Playwright storage state; runtime jobs load that state into isolated contexts and never store a Google password.

**Tech Stack:** Node.js, TypeScript, Playwright, Jest, Prisma, BullMQ, Redis, React/Vite frontend.

## Global Constraints

- No meeting-bot API subscription or paid third-party meeting infrastructure.
- `GOOGLE_AUTH_MODE` is exactly one of `guest`, `account`, or `hybrid`; default is `hybrid`.
- Guest mode is attempted first in `hybrid`; authenticated fallback occurs only for `GUEST_ACCOUNT_REQUIRED` or `GUEST_BLOCKED_BY_POLICY`.
- At most one guest attempt and one authenticated attempt; no fallback loop.
- Google password, MFA secret, recovery code, cookies, and storage-state contents are never stored in `.env`, Postgres, logs, diagnostics, or git.
- Saved Playwright state defaults to `bot-worker/.auth/google-state.json`; `.auth/` and `.debug/` are gitignored.
- Runtime jobs use isolated browser contexts; do not reuse the operator's personal Chrome profile.
- Existing queue name remains `meeting-bot-join`; control channel remains `meeting-bot:control`.
- Existing API routes and response shapes remain backward-compatible.
- Existing persisted `leaveRequested` behavior remains authoritative.
- No code may claim to bypass a Google Workspace administrator or meeting host policy.

---

## File Structure

### New files

- `bot-worker/src/joiners/join-errors.ts` — typed Meet failure codes and `MeetJoinError`.
- `bot-worker/src/joiners/google-auth.ts` — resolve/validate saved auth state and create anonymous/authenticated Playwright contexts.
- `bot-worker/src/google-login.ts` — one-time headed Google login command that saves storage state securely.
- `bot-worker/src/joiners/google-meet-page.ts` — classify Meet screens, handle interstitials, locate lobby controls, and create sanitized debug dumps.
- `bot-worker/tests/join-errors.test.ts` — error type behavior.
- `bot-worker/tests/google-auth.test.ts` — storage-state validation and context options.
- `bot-worker/tests/google-meet-page.test.ts` — pure screen-classification matrix.
- `bot-worker/tests/google-meet.joiner.test.ts` — guest/account/hybrid orchestration and cleanup.

### Modified files

- `bot-worker/src/config.ts` — hybrid-auth settings and validation.
- `bot-worker/src/joiners/joiner.interface.ts` — identity callback and typed attempt mode.
- `bot-worker/src/joiners/google-meet.joiner.ts` — hybrid orchestration using the new focused modules.
- `bot-worker/src/joiners/selectors.ts` — selectors/text used by `google-meet-page.ts`.
- `bot-worker/src/status.ts` — persist `botEmail` when account fallback is active.
- `bot-worker/src/queue.ts` — wire identity callback to Prisma update.
- `bot-worker/package.json` — add `google:login` script.
- `bot-worker/.env.example` — document hybrid settings.
- `bot-worker/.gitignore` — ignore `.auth/` and `.debug/`.
- `bot-worker/tests/status.test.ts` — identity persistence.
- `bot-worker/tests/queue.test.ts` — identity callback wiring.
- `backend/README.md` — setup and troubleshooting runbook.

---

### Task 1: Typed join failures and hybrid configuration

**Files:**
- Create: `bot-worker/src/joiners/join-errors.ts`
- Create: `bot-worker/tests/join-errors.test.ts`
- Modify: `bot-worker/src/config.ts`
- Modify: `bot-worker/.env.example`

**Interfaces:**
- Produces: `MeetJoinFailureCode`, `MeetJoinError`, `isFallbackEligible(error)`.
- Produces: `GoogleAuthMode`, `config.GOOGLE_AUTH_MODE`, `config.GOOGLE_STORAGE_STATE_PATH`, `config.GOOGLE_BOT_EMAIL`.
- Consumes: existing dotenv-loaded process environment.

- [ ] **Step 1: Write failing tests for typed failures**

Create `bot-worker/tests/join-errors.test.ts`:

```ts
import {
  MeetJoinError,
  isFallbackEligible,
  type MeetJoinFailureCode,
} from '../src/joiners/join-errors';

describe('MeetJoinError', () => {
  it.each<MeetJoinFailureCode>([
    'INVALID_OR_ENDED_MEETING',
    'GUEST_ACCOUNT_REQUIRED',
    'GUEST_BLOCKED_BY_POLICY',
    'AUTH_SESSION_MISSING',
    'AUTH_SESSION_EXPIRED',
    'EXTERNAL_ACCOUNT_BLOCKED',
    'JOIN_UI_CHANGED',
    'ADMISSION_TIMEOUT',
    'ADMISSION_DENIED',
  ])('preserves failure code %s', (code) => {
    expect(new MeetJoinError(code, 'detail')).toMatchObject({
      name: 'MeetJoinError',
      code,
      message: 'detail',
    });
  });

  it.each(['GUEST_ACCOUNT_REQUIRED', 'GUEST_BLOCKED_BY_POLICY'] as const)(
    'allows authenticated fallback for %s',
    (code) => expect(isFallbackEligible(new MeetJoinError(code, code))).toBe(true),
  );

  it.each(['INVALID_OR_ENDED_MEETING', 'JOIN_UI_CHANGED'] as const)(
    'does not fallback for %s',
    (code) => expect(isFallbackEligible(new MeetJoinError(code, code))).toBe(false),
  );

  it('does not fallback for an untyped error', () => {
    expect(isFallbackEligible(new Error('boom'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd bot-worker
npx jest join-errors --watchman=false --runInBand
```

Expected: FAIL because `src/joiners/join-errors.ts` does not exist.

- [ ] **Step 3: Implement typed failures**

Create `bot-worker/src/joiners/join-errors.ts`:

```ts
export type MeetJoinFailureCode =
  | 'INVALID_OR_ENDED_MEETING'
  | 'GUEST_ACCOUNT_REQUIRED'
  | 'GUEST_BLOCKED_BY_POLICY'
  | 'AUTH_SESSION_MISSING'
  | 'AUTH_SESSION_EXPIRED'
  | 'EXTERNAL_ACCOUNT_BLOCKED'
  | 'JOIN_UI_CHANGED'
  | 'ADMISSION_TIMEOUT'
  | 'ADMISSION_DENIED';

export class MeetJoinError extends Error {
  constructor(
    public readonly code: MeetJoinFailureCode,
    message: string,
  ) {
    super(message);
    this.name = 'MeetJoinError';
  }
}

const FALLBACK_CODES = new Set<MeetJoinFailureCode>([
  'GUEST_ACCOUNT_REQUIRED',
  'GUEST_BLOCKED_BY_POLICY',
]);

export const isFallbackEligible = (error: unknown): error is MeetJoinError =>
  error instanceof MeetJoinError && FALLBACK_CODES.has(error.code);
```

- [ ] **Step 4: Add validated hybrid configuration**

Replace `bot-worker/src/config.ts` with:

```ts
import dotenv from 'dotenv';
dotenv.config();

export type GoogleAuthMode = 'guest' | 'account' | 'hybrid';

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const authMode = (process.env.GOOGLE_AUTH_MODE || 'hybrid') as GoogleAuthMode;
if (!['guest', 'account', 'hybrid'].includes(authMode)) {
  throw new Error('GOOGLE_AUTH_MODE must be guest, account, or hybrid');
}

export const config = {
  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL: required('REDIS_URL'),
  BOT_DEFAULT_NAME: process.env.BOT_DEFAULT_NAME || 'ZeroClutter Notetaker',
  NAV_TIMEOUT_MS: parseInt(process.env.NAV_TIMEOUT_MS || '30000', 10),
  ADMISSION_TIMEOUT_MS: parseInt(process.env.ADMISSION_TIMEOUT_MS || '300000', 10),
  IN_CALL_POLL_MS: parseInt(process.env.IN_CALL_POLL_MS || '2000', 10),
  HEADLESS: (process.env.HEADLESS || 'true') !== 'false',
  GOOGLE_AUTH_MODE: authMode,
  GOOGLE_STORAGE_STATE_PATH:
    process.env.GOOGLE_STORAGE_STATE_PATH || '.auth/google-state.json',
  GOOGLE_BOT_EMAIL: process.env.GOOGLE_BOT_EMAIL || null,
};
```

Append to `bot-worker/.env.example`:

```dotenv

# Google identity: guest | account | hybrid
GOOGLE_AUTH_MODE=hybrid

# Created by `npm run google:login`; never commit this credential
GOOGLE_STORAGE_STATE_PATH=.auth/google-state.json

# Dedicated bot account, used for status/display only
GOOGLE_BOT_EMAIL=
```

- [ ] **Step 5: Verify GREEN and typecheck**

Run:

```bash
cd bot-worker
npx jest join-errors --watchman=false --runInBand
npx tsc --noEmit
```

Expected: all `join-errors` tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit**

```bash
git add bot-worker/src/config.ts bot-worker/src/joiners/join-errors.ts \
  bot-worker/tests/join-errors.test.ts bot-worker/.env.example
git commit -m "feat(bot-worker): add hybrid Google auth configuration"
```

---

### Task 2: Secure Google session bootstrap and context factory

**Files:**
- Create: `bot-worker/src/joiners/google-auth.ts`
- Create: `bot-worker/src/google-login.ts`
- Create: `bot-worker/tests/google-auth.test.ts`
- Modify: `bot-worker/package.json`
- Modify: `bot-worker/.gitignore`

**Interfaces:**
- Consumes: `config.GOOGLE_STORAGE_STATE_PATH`.
- Produces: `resolveStorageStatePath()`, `requireStorageState()`, `createMeetContext(browser, authenticated)`.
- Produces CLI: `npm run google:login`.

- [ ] **Step 1: Write failing auth-state tests**

Create `bot-worker/tests/google-auth.test.ts`:

```ts
import * as fs from 'fs';
import * as path from 'path';
import {
  createMeetContext,
  requireStorageState,
  resolveStorageStatePath,
} from '../src/joiners/google-auth';
import { MeetJoinError } from '../src/joiners/join-errors';

jest.mock('../src/config', () => ({
  config: { GOOGLE_STORAGE_STATE_PATH: '.auth/test-google-state.json' },
}));

const statePath = path.resolve(process.cwd(), '.auth/test-google-state.json');

afterEach(() => {
  fs.rmSync(statePath, { force: true });
});

describe('google-auth', () => {
  it('resolves a relative state path from the worker cwd', () => {
    expect(resolveStorageStatePath()).toBe(statePath);
  });

  it('throws AUTH_SESSION_MISSING when state is absent', () => {
    expect(() => requireStorageState()).toThrow(
      expect.objectContaining<Partial<MeetJoinError>>({
        code: 'AUTH_SESSION_MISSING',
      }),
    );
  });

  it('accepts a state file containing Google cookies', () => {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(
      statePath,
      JSON.stringify({
        cookies: [{ name: 'SID', value: 'redacted', domain: '.google.com', path: '/' }],
        origins: [],
      }),
    );
    expect(requireStorageState()).toBe(statePath);
  });

  it('creates an anonymous context without storageState', async () => {
    const browser = { newContext: jest.fn().mockResolvedValue('context') };
    await expect(createMeetContext(browser as never, false)).resolves.toBe('context');
    expect(browser.newContext).toHaveBeenCalledWith(
      expect.not.objectContaining({ storageState: expect.anything() }),
    );
  });

  it('creates an authenticated context from validated storageState', async () => {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(
      statePath,
      JSON.stringify({
        cookies: [{ name: 'SID', value: 'redacted', domain: '.google.com', path: '/' }],
        origins: [],
      }),
    );
    const browser = { newContext: jest.fn().mockResolvedValue('context') };
    await createMeetContext(browser as never, true);
    expect(browser.newContext).toHaveBeenCalledWith(
      expect.objectContaining({ storageState: statePath }),
    );
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd bot-worker
npx jest google-auth --watchman=false --runInBand
```

Expected: FAIL because `google-auth.ts` does not exist.

- [ ] **Step 3: Implement storage-state validation and context creation**

Create `bot-worker/src/joiners/google-auth.ts`:

```ts
import * as fs from 'fs';
import * as path from 'path';
import type { Browser, BrowserContext } from 'playwright';
import { config } from '../config';
import { MeetJoinError } from './join-errors';

export const resolveStorageStatePath = (): string =>
  path.resolve(process.cwd(), config.GOOGLE_STORAGE_STATE_PATH);

export const requireStorageState = (): string => {
  const file = resolveStorageStatePath();
  if (!fs.existsSync(file)) {
    throw new MeetJoinError(
      'AUTH_SESSION_MISSING',
      'Bot Google session is missing; run npm run google:login',
    );
  }

  try {
    const state = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      cookies?: Array<{ domain?: string }>;
    };
    const hasGoogleCookie = state.cookies?.some((cookie) =>
      cookie.domain?.includes('google.com'),
    );
    if (!hasGoogleCookie) throw new Error('no Google cookies');
  } catch {
    throw new MeetJoinError(
      'AUTH_SESSION_MISSING',
      'Bot Google session is invalid; run npm run google:login',
    );
  }
  return file;
};

export const createMeetContext = async (
  browser: Browser,
  authenticated: boolean,
): Promise<BrowserContext> =>
  browser.newContext({
    ...(authenticated ? { storageState: requireStorageState() } : {}),
    permissions: ['microphone', 'camera'],
    locale: 'en-US',
    viewport: { width: 1280, height: 720 },
  });
```

- [ ] **Step 4: Implement the one-time interactive login command**

Create `bot-worker/src/google-login.ts`:

```ts
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { chromium } from 'playwright';
import { resolveStorageStatePath } from './joiners/google-auth';

const waitForEnter = (): Promise<void> =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(
      'Sign in to the dedicated Google bot account, then press Enter here to save the session. ',
      () => {
        rl.close();
        resolve();
      },
    );
  });

const main = async (): Promise<void> => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('https://accounts.google.com/signin', {
      waitUntil: 'domcontentloaded',
    });
    await waitForEnter();
    await page.goto('https://myaccount.google.com/', {
      waitUntil: 'domcontentloaded',
    });
    if (page.url().includes('accounts.google.com')) {
      throw new Error('Google login was not completed; no session was saved');
    }

    const output = resolveStorageStatePath();
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await context.storageState({ path: output });
    fs.chmodSync(output, 0o600);
    console.log(`Google bot session saved to ${output}`);
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
```

Add to `bot-worker/package.json` scripts:

```json
"google:login": "ts-node src/google-login.ts"
```

Append to `bot-worker/.gitignore`:

```gitignore
.auth/
.debug/
```

- [ ] **Step 5: Verify auth tests and build**

Run:

```bash
cd bot-worker
npx jest google-auth --watchman=false --runInBand
npx tsc --noEmit
```

Expected: all `google-auth` tests pass and TypeScript exits 0.

- [ ] **Step 6: Manually bootstrap the dedicated bot session**

Run:

```bash
cd bot-worker
npm run google:login
```

Expected: headed Chromium opens; after manual login and Enter, output reports
`Google bot session saved to .../.auth/google-state.json`.

- [ ] **Step 7: Commit**

```bash
git add bot-worker/src/joiners/google-auth.ts bot-worker/src/google-login.ts \
  bot-worker/tests/google-auth.test.ts bot-worker/package.json bot-worker/.gitignore
git commit -m "feat(bot-worker): add secure Google session bootstrap"
```

---

### Task 3: Deterministic Meet screen classification and diagnostics

**Files:**
- Create: `bot-worker/src/joiners/google-meet-page.ts`
- Create: `bot-worker/tests/google-meet-page.test.ts`
- Modify: `bot-worker/src/joiners/selectors.ts`

**Interfaces:**
- Consumes: Playwright `Page`, centralized `SELECTORS`, `MeetJoinError`.
- Produces: `MeetScreen`, `MeetScreenSnapshot`, `classifyMeetScreen(snapshot, authenticated)`.
- Produces: `waitForJoinableLobby(page, options)`, `saveMeetDebugDump(page, botId, reason)`.

- [ ] **Step 1: Write the screen-classification matrix**

Create `bot-worker/tests/google-meet-page.test.ts`:

```ts
import { classifyMeetScreen, type MeetScreenSnapshot } from '../src/joiners/google-meet-page';

const snapshot = (partial: Partial<MeetScreenSnapshot>): MeetScreenSnapshot => ({
  url: 'https://meet.google.com/abc-defg-hij',
  bodyText: '',
  hasNameInput: false,
  hasJoinButton: false,
  hasInCallControls: false,
  ...partial,
});

describe('classifyMeetScreen', () => {
  it('detects the guest lobby', () => {
    expect(classifyMeetScreen(snapshot({ hasNameInput: true }), false)).toBe('LOBBY');
  });

  it('detects a direct join lobby', () => {
    expect(classifyMeetScreen(snapshot({ hasJoinButton: true }), false)).toBe('LOBBY');
  });

  it('detects admission into the call', () => {
    expect(classifyMeetScreen(snapshot({ hasInCallControls: true }), false)).toBe('IN_CALL');
  });

  it('classifies Google sign-in as guest account required', () => {
    expect(
      classifyMeetScreen(
        snapshot({ url: 'https://accounts.google.com/signin/v2/identifier' }),
        false,
      ),
    ).toBe('GUEST_ACCOUNT_REQUIRED');
  });

  it('classifies Google sign-in as expired session for an authenticated attempt', () => {
    expect(
      classifyMeetScreen(
        snapshot({ url: 'https://accounts.google.com/signin/v2/identifier' }),
        true,
      ),
    ).toBe('AUTH_SESSION_EXPIRED');
  });

  it.each([
    'You cannot join this video call',
    \"You can't join this video call\",
    'Ask your administrator for access',
  ])('classifies guest policy text: %s', (bodyText) => {
    expect(classifyMeetScreen(snapshot({ bodyText }), false)).toBe(
      'GUEST_BLOCKED_BY_POLICY',
    );
  });

  it('classifies the same policy screen as external-account blocked when authenticated', () => {
    expect(
      classifyMeetScreen(snapshot({ bodyText: \"You can't join this video call\" }), true),
    ).toBe('EXTERNAL_ACCOUNT_BLOCKED');
  });

  it.each(['Meeting not found', 'Invalid video call name', 'Returning to home screen'])(
    'classifies invalid or ended meeting: %s',
    (bodyText) => {
      expect(classifyMeetScreen(snapshot({ bodyText }), false)).toBe(
        'INVALID_OR_ENDED_MEETING',
      );
    },
  );

  it('returns UNKNOWN for unrecognized UI', () => {
    expect(classifyMeetScreen(snapshot({ bodyText: 'Welcome' }), false)).toBe('UNKNOWN');
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd bot-worker
npx jest google-meet-page --watchman=false --runInBand
```

Expected: FAIL because `google-meet-page.ts` does not exist.

- [ ] **Step 3: Implement the pure classifier**

Create `bot-worker/src/joiners/google-meet-page.ts` with these exported types and classifier:

```ts
import * as fs from 'fs';
import * as path from 'path';
import type { Locator, Page } from 'playwright';
import { MeetJoinError, type MeetJoinFailureCode } from './join-errors';
import { SELECTORS } from './selectors';
import { logger } from '../logger';

export type MeetScreen =
  | 'LOBBY'
  | 'IN_CALL'
  | 'GUEST_ACCOUNT_REQUIRED'
  | 'GUEST_BLOCKED_BY_POLICY'
  | 'AUTH_SESSION_EXPIRED'
  | 'EXTERNAL_ACCOUNT_BLOCKED'
  | 'INVALID_OR_ENDED_MEETING'
  | 'UNKNOWN';

export interface MeetScreenSnapshot {
  url: string;
  bodyText: string;
  hasNameInput: boolean;
  hasJoinButton: boolean;
  hasInCallControls: boolean;
}

export const classifyMeetScreen = (
  state: MeetScreenSnapshot,
  authenticated: boolean,
): MeetScreen => {
  if (state.hasInCallControls) return 'IN_CALL';
  if (state.url.includes('accounts.google.com')) {
    return authenticated ? 'AUTH_SESSION_EXPIRED' : 'GUEST_ACCOUNT_REQUIRED';
  }

  const text = state.bodyText.toLowerCase();
  if (
    text.includes('meeting not found') ||
    text.includes('invalid video call name') ||
    text.includes('returning to home screen')
  ) {
    return 'INVALID_OR_ENDED_MEETING';
  }
  if (
    text.includes(\"can't join\") ||
    text.includes('cannot join') ||
    text.includes('ask your administrator')
  ) {
    return authenticated ? 'EXTERNAL_ACCOUNT_BLOCKED' : 'GUEST_BLOCKED_BY_POLICY';
  }
  if (state.hasNameInput || state.hasJoinButton) return 'LOBBY';
  return 'UNKNOWN';
};
```

- [ ] **Step 4: Add sanitized page snapshot and debug dump**

In the same file, add:

```ts
const visible = async (locator: Locator): Promise<boolean> =>
  locator.first().isVisible().catch(() => false);

export const snapshotMeetScreen = async (page: Page): Promise<MeetScreenSnapshot> => ({
  url: page.url(),
  bodyText: (await page.locator('body').innerText().catch(() => '')).slice(0, 8000),
  hasNameInput: await visible(page.locator(SELECTORS.nameInput.join(','))),
  hasJoinButton: await visible(page.getByRole('button', { name: /ask to join|join now|join/i })),
  hasInCallControls: await visible(page.locator(SELECTORS.inCall)),
});

export const saveMeetDebugDump = async (
  page: Page,
  botId: string,
  reason: string,
): Promise<void> => {
  const dir = path.resolve(process.cwd(), '.debug');
  fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, `${Date.now()}-${botId}`);
  await page.screenshot({ path: `${base}.png`, fullPage: true }).catch(() => undefined);
  const state = await snapshotMeetScreen(page);
  fs.writeFileSync(
    `${base}.json`,
    JSON.stringify(
      {
        reason,
        url: state.url,
        bodyText: state.bodyText,
        // Deliberately record no input values, cookies, headers, or storage state.
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  logger.warn('Saved sanitized Meet diagnostics', { botId, base, reason });
};
```

- [ ] **Step 5: Add lobby waiting and typed error mapping**

In the same file, add:

```ts
const screenToFailure = (screen: MeetScreen): MeetJoinFailureCode | null => {
  if (screen === 'LOBBY' || screen === 'IN_CALL' || screen === 'UNKNOWN') return null;
  return screen;
};

export const waitForJoinableLobby = async (
  page: Page,
  options: {
    authenticated: boolean;
    timeoutMs: number;
    botId: string;
    clearInterstitials: () => Promise<void>;
  },
): Promise<void> => {
  const deadline = Date.now() + options.timeoutMs;
  while (Date.now() < deadline) {
    await options.clearInterstitials();
    const state = await snapshotMeetScreen(page);
    const screen = classifyMeetScreen(state, options.authenticated);
    if (screen === 'LOBBY' || screen === 'IN_CALL') return;
    const code = screenToFailure(screen);
    if (code) {
      throw new MeetJoinError(code, code.replaceAll('_', ' ').toLowerCase());
    }
    await page.waitForTimeout(500);
  }
  await saveMeetDebugDump(page, options.botId, 'join-ui-timeout');
  throw new MeetJoinError(
    'JOIN_UI_CHANGED',
    'Google Meet join screen was not recognized; inspect bot-worker/.debug',
  );
};
```

Keep all concrete selectors and interstitial text patterns in `selectors.ts`. Do not log input values or cookies.

- [ ] **Step 6: Verify classifier tests and typecheck**

Run:

```bash
cd bot-worker
npx jest google-meet-page --watchman=false --runInBand
npx tsc --noEmit
```

Expected: classifier tests pass and TypeScript exits 0.

- [ ] **Step 7: Commit**

```bash
git add bot-worker/src/joiners/google-meet-page.ts \
  bot-worker/src/joiners/selectors.ts \
  bot-worker/tests/google-meet-page.test.ts
git commit -m "feat(bot-worker): classify Google Meet join screens"
```

---

### Task 4: Hybrid guest/account orchestration and bot identity persistence

**Files:**
- Modify: `bot-worker/src/joiners/joiner.interface.ts`
- Modify: `bot-worker/src/joiners/google-meet.joiner.ts`
- Modify: `bot-worker/src/status.ts`
- Modify: `bot-worker/src/queue.ts`
- Create: `bot-worker/tests/google-meet.joiner.test.ts`
- Modify: `bot-worker/tests/status.test.ts`
- Modify: `bot-worker/tests/queue.test.ts`

**Interfaces:**
- Consumes: `config.GOOGLE_AUTH_MODE`, `createMeetContext`, `MeetJoinError`, `isFallbackEligible`.
- Produces: `JoinAttemptMode = 'guest' | 'account'`.
- Produces: `JoinerDeps.onIdentity(botEmail: string | null): Promise<void>`.
- Produces: `updateBotIdentity(botId, botEmail)`.
- Preserves: `googleMeetJoiner.join(ctx, deps)`, queue/control constants, leave behavior.

- [ ] **Step 1: Write orchestration tests before refactoring**

Create `bot-worker/tests/google-meet.joiner.test.ts` using injected attempt behavior:

```ts
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL ||= 'redis://localhost:6379';

import { MeetJoinError } from '../src/joiners/join-errors';
import { runJoinStrategy, type JoinAttempt } from '../src/joiners/google-meet.joiner';

const ctx = {
  botId: 'b1',
  meetingUrl: 'https://meet.google.com/abc-defg-hij',
  displayName: 'ZeroClutter Notetaker',
};

const deps = () => ({
  onStatus: jest.fn().mockResolvedValue(undefined),
  onIdentity: jest.fn().mockResolvedValue(undefined),
  isLeaveRequested: jest.fn().mockReturnValue(false),
  setBrowser: jest.fn(),
});

describe('runJoinStrategy', () => {
  it('uses only guest attempt when guest succeeds', async () => {
    const attempt: JoinAttempt = jest.fn().mockResolvedValue(undefined);
    const d = deps();
    await runJoinStrategy('hybrid', ctx, d, attempt);
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(attempt).toHaveBeenCalledWith('guest', ctx, d);
    expect(d.onIdentity).toHaveBeenCalledWith(null);
  });

  it.each(['GUEST_ACCOUNT_REQUIRED', 'GUEST_BLOCKED_BY_POLICY'] as const)(
    'retries once with account for %s',
    async (code) => {
      const attempt: JoinAttempt = jest
        .fn()
        .mockRejectedValueOnce(new MeetJoinError(code, code))
        .mockResolvedValueOnce(undefined);
      const d = deps();
      await runJoinStrategy('hybrid', ctx, d, attempt);
      expect(attempt).toHaveBeenNthCalledWith(1, 'guest', ctx, d);
      expect(attempt).toHaveBeenNthCalledWith(2, 'account', ctx, d);
      expect(attempt).toHaveBeenCalledTimes(2);
    },
  );

  it('does not fallback for invalid meeting', async () => {
    const attempt: JoinAttempt = jest
      .fn()
      .mockRejectedValue(new MeetJoinError('INVALID_OR_ENDED_MEETING', 'ended'));
    await expect(runJoinStrategy('hybrid', ctx, deps(), attempt)).rejects.toMatchObject({
      code: 'INVALID_OR_ENDED_MEETING',
    });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('uses account directly in account mode', async () => {
    const attempt: JoinAttempt = jest.fn().mockResolvedValue(undefined);
    await runJoinStrategy('account', ctx, deps(), attempt);
    expect(attempt).toHaveBeenCalledWith('account', ctx, expect.anything());
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd bot-worker
npx jest google-meet.joiner --watchman=false --runInBand
```

Expected: FAIL because `runJoinStrategy` and `JoinAttempt` do not exist.

- [ ] **Step 3: Extend joiner interfaces**

Replace `bot-worker/src/joiners/joiner.interface.ts` with:

```ts
import type { Browser } from 'playwright';

export type JoinAttemptMode = 'guest' | 'account';

export interface JoinContext {
  botId: string;
  meetingUrl: string;
  displayName: string;
}

export interface JoinerDeps {
  onStatus: (status: string, detail?: string) => Promise<void>;
  onIdentity: (botEmail: string | null) => Promise<void>;
  isLeaveRequested: () => boolean;
  setBrowser: (browser: Browser) => void;
}

export interface Joiner {
  join(ctx: JoinContext, deps: JoinerDeps): Promise<void>;
}
```

- [ ] **Step 4: Implement testable hybrid strategy**

At the top of `google-meet.joiner.ts`, export:

```ts
import type { GoogleAuthMode } from '../config';
import type {
  JoinAttemptMode,
  JoinContext,
  JoinerDeps,
} from './joiner.interface';
import { isFallbackEligible } from './join-errors';

export type JoinAttempt = (
  mode: JoinAttemptMode,
  ctx: JoinContext,
  deps: JoinerDeps,
) => Promise<void>;

export const runJoinStrategy = async (
  authMode: GoogleAuthMode,
  ctx: JoinContext,
  deps: JoinerDeps,
  attempt: JoinAttempt,
): Promise<void> => {
  if (authMode === 'account') {
    await deps.onIdentity(config.GOOGLE_BOT_EMAIL);
    await attempt('account', ctx, deps);
    return;
  }

  await deps.onIdentity(null);
  try {
    await attempt('guest', ctx, deps);
  } catch (error) {
    if (authMode !== 'hybrid' || !isFallbackEligible(error)) throw error;
    await deps.onStatus(
      BOT_STATUS.JOINING,
      'Guest access blocked; retrying with bot account',
    );
    await deps.onIdentity(config.GOOGLE_BOT_EMAIL);
    await attempt('account', ctx, deps);
  }
};
```

Step 5 wires this pure strategy to the production browser attempt while preserving the same
`googleMeetJoiner.join(ctx, deps)` public interface.

- [ ] **Step 5: Refactor one Meet attempt**

Implement `runMeetAttempt(browser, mode, ctx, deps)` in `google-meet.joiner.ts`. The browser is
launched once by the outer joiner and reused for the guest and account contexts, preventing a leaked
guest browser when fallback occurs:

```ts
const runMeetAttempt = async (
  browser: Browser,
  mode: JoinAttemptMode,
  ctx: JoinContext,
  deps: JoinerDeps,
): Promise<void> => {
  if (deps.isLeaveRequested()) return;
  await deps.onStatus(
    BOT_STATUS.JOINING,
    mode === 'guest' ? 'Joining as guest' : 'Joining with bot account',
  );

  const context = await createMeetContext(browser, mode === 'account');
  try {
    const page = await context.newPage();
    await page.goto(ctx.meetingUrl, {
      waitUntil: 'domcontentloaded',
      timeout: config.NAV_TIMEOUT_MS,
    });

    await waitForJoinableLobby(page, {
      authenticated: mode === 'account',
      timeoutMs: Math.max(config.NAV_TIMEOUT_MS, 45_000),
      botId: ctx.botId,
      clearInterstitials: () => clearMeetInterstitials(page),
    });

    if (mode === 'guest') {
      const nameInput = await findGuestNameInput(page);
      if (!nameInput) {
        throw new MeetJoinError(
          'JOIN_UI_CHANGED',
          'Guest name input was not found',
        );
      }
      await nameInput.fill(ctx.displayName);
    }

    await ensureMediaOff(page);
    const joinButton = await findJoinButton(page);
    if (!joinButton) {
      throw new MeetJoinError('JOIN_UI_CHANGED', 'Join button was not found');
    }
    await joinButton.click();
    await deps.onStatus(BOT_STATUS.WAITING_ADMISSION, 'Waiting for host admission');

    const admission = await waitForAdmissionOrFailure(page, deps);
    if (admission === 'left') {
      await deps.onStatus(BOT_STATUS.LEFT, 'Left before admission');
      return;
    }
    await deps.onStatus(BOT_STATUS.IN_CALL);
    await holdUntilLeaveOrMeetingEnd(page, deps);
    await deps.onStatus(
      BOT_STATUS.LEFT,
      deps.isLeaveRequested() ? 'Leave requested' : 'Meeting ended',
    );
  } finally {
    await context.close().catch(() => undefined);
  }
};
```

Replace the exported production joiner with:

```ts
export const googleMeetJoiner: Joiner = {
  async join(ctx, deps): Promise<void> {
    const browser = await chromium.launch({
      headless: config.HEADLESS,
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
      ],
    });
    deps.setBrowser(browser);
    await runJoinStrategy(
      config.GOOGLE_AUTH_MODE,
      ctx,
      deps,
      (mode, attemptContext, attemptDeps) =>
        runMeetAttempt(browser, mode, attemptContext, attemptDeps),
    );
  },
};
```

Add these concrete helpers to `google-meet-page.ts` (also import `config` and `JoinerDeps`):

```ts
import { config } from '../config';
import type { JoinerDeps } from './joiner.interface';

const clickFirstVisible = async (page: Page, selectors: string[]): Promise<boolean> => {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click({ timeout: 2_000 });
      return true;
    }
  }
  return false;
};

export const clearMeetInterstitials = async (page: Page): Promise<void> => {
  await clickFirstVisible(page, SELECTORS.dismissals);
  await clickFirstVisible(page, SELECTORS.mediaContinueWithout);
  await clickFirstVisible(page, SELECTORS.guestContinue);
};

export const findGuestNameInput = async (page: Page): Promise<Locator | null> => {
  for (const selector of SELECTORS.nameInput) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) return locator;
  }
  return null;
};

export const ensureMediaOff = async (page: Page): Promise<void> => {
  await clickFirstVisible(page, SELECTORS.turnOffMic).catch(() => false);
  await clickFirstVisible(page, SELECTORS.turnOffCam).catch(() => false);
};

export const findJoinButton = async (page: Page): Promise<Locator | null> => {
  const byRole = page.getByRole('button', { name: /ask to join|join now|join/i }).first();
  if (await byRole.isVisible().catch(() => false)) return byRole;
  for (const selector of SELECTORS.joinButtons) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) return locator;
  }
  return null;
};

export const waitForAdmissionOrFailure = async (
  page: Page,
  deps: JoinerDeps,
): Promise<'admitted' | 'left'> => {
  const deadline = Date.now() + config.ADMISSION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (deps.isLeaveRequested()) {
      return 'left';
    }
    const state = await snapshotMeetScreen(page);
    const screen = classifyMeetScreen(state, false);
    if (screen === 'IN_CALL') return 'admitted';
    if (screen === 'INVALID_OR_ENDED_MEETING') {
      throw new MeetJoinError(screen, 'Meeting ended before admission');
    }
    if (state.bodyText.toLowerCase().includes('request to join was denied')) {
      throw new MeetJoinError('ADMISSION_DENIED', 'Host denied admission');
    }
    await page.waitForTimeout(1_000);
  }
  throw new MeetJoinError(
    'ADMISSION_TIMEOUT',
    `Not admitted within ${Math.round(config.ADMISSION_TIMEOUT_MS / 60_000)} min`,
  );
};

export const holdUntilLeaveOrMeetingEnd = async (
  page: Page,
  deps: JoinerDeps,
): Promise<void> => {
  while (!deps.isLeaveRequested()) {
    const state = await snapshotMeetScreen(page);
    if (classifyMeetScreen(state, false) !== 'IN_CALL') return;
    await page.waitForTimeout(config.IN_CALL_POLL_MS);
  }
};
```

Use the centralized selector arrays below in `selectors.ts`; do not inline selectors elsewhere:

```ts
export const SELECTORS = {
  guestContinue: [
    'button:has-text("Continue without an account")',
    'button:has-text("Continue as guest")',
    'button:has-text("Join as guest")',
  ],
  dismissals: [
    'button:has-text("Got it")',
    'button:has-text("Accept all")',
    'button:has-text("I agree")',
    'button:has-text("Dismiss")',
  ],
  mediaContinueWithout: [
    'button:has-text("Continue without microphone and camera")',
    'text=Continue without microphone and camera',
  ],
  nameInput: [
    'input[type="text"][aria-label="Your name"]',
    'input[placeholder="Your name"]',
    'input[aria-label*="name" i]',
    'input[placeholder*="name" i]',
  ],
  turnOffMic: [
    '[aria-label*="Turn off microphone"]',
    '[data-tooltip*="Turn off microphone"]',
  ],
  turnOffCam: [
    '[aria-label*="Turn off camera"]',
    '[data-tooltip*="Turn off camera"]',
  ],
  joinButtons: [
    'button:has-text("Ask to join")',
    'button:has-text("Join now")',
  ],
  inCall:
    'button[aria-label="Leave call"], [aria-label="Leave call"], button[aria-label*="Leave call"]',
};
```

- [ ] **Step 6: Persist active identity**

Add to `bot-worker/src/status.ts`:

```ts
export const updateBotIdentity = async (
  botId: string,
  botEmail: string | null,
): Promise<void> => {
  await prisma.meetingBot.update({
    where: { id: botId },
    data: { botEmail },
  });
};
```

Update `bot-worker/src/queue.ts` imports and deps:

```ts
import { updateBotIdentity, updateStatus } from './status';
```

```ts
onIdentity: (botEmail) => updateBotIdentity(botId, botEmail),
```

- [ ] **Step 7: Extend status and queue tests**

Add to `bot-worker/tests/status.test.ts`:

```ts
import { updateBotIdentity } from '../src/status';

it('persists the bot email used for the join attempt', async () => {
  await updateBotIdentity('b1', 'bot@example.com');
  expect(mockUpdate).toHaveBeenCalledWith({
    where: { id: 'b1' },
    data: { botEmail: 'bot@example.com' },
  });
});
```

Update the `status` mock and imports in `bot-worker/tests/queue.test.ts`:

```ts
jest.mock('../src/status', () => ({
  updateStatus: jest.fn(),
  updateBotIdentity: jest.fn(),
}));

import { updateBotIdentity, updateStatus } from '../src/status';

const mockUpdateBotIdentity = updateBotIdentity as jest.Mock;
```

In the happy-path test, replace its `mockJoin.mockImplementation` setup with:

```ts
let capturedDeps:
  | {
      setBrowser: (browser: FakeBrowser) => void;
      onIdentity: (email: string | null) => Promise<void>;
    }
  | undefined;
mockJoin.mockImplementation(async (_ctx, deps) => {
  capturedDeps = deps;
  deps.setBrowser(fakeBrowser);
});

await processJoin('b1');
await capturedDeps?.onIdentity('bot@example.com');

expect(mockUpdateBotIdentity).toHaveBeenCalledWith('b1', 'bot@example.com');
```

- [ ] **Step 8: Run worker tests and typecheck**

Run:

```bash
cd bot-worker
npx jest --watchman=false --runInBand
npx tsc --noEmit
```

Expected: all worker suites pass and TypeScript exits 0.

- [ ] **Step 9: Commit**

```bash
git add bot-worker/src/joiners/joiner.interface.ts \
  bot-worker/src/joiners/google-meet.joiner.ts \
  bot-worker/src/joiners/google-meet-page.ts \
  bot-worker/src/status.ts bot-worker/src/queue.ts \
  bot-worker/tests/google-meet.joiner.test.ts \
  bot-worker/tests/status.test.ts bot-worker/tests/queue.test.ts
git commit -m "feat(bot-worker): add guest-first account fallback"
```

---

### Task 5: Documentation and full verification

**Files:**
- Modify: `backend/README.md`
- Modify: `bot-worker/.env.example`

**Interfaces:**
- Consumes: completed hybrid worker and `npm run google:login`.
- Produces: operator setup, rotation, security, and acceptance runbook.

- [ ] **Step 1: Document dedicated-account setup**

Add to the Meeting Bot section of `backend/README.md`:

```markdown
### Optional dedicated Google bot account fallback

The worker defaults to `GOOGLE_AUTH_MODE=hybrid`: it tries an unsigned named guest first,
then retries once with a dedicated Google account only when Meet requires an account or
blocks unsigned guests.

1. Create a dedicated Google account for the bot. Do not use a personal account.
2. Set `GOOGLE_BOT_EMAIL` in `bot-worker/.env`.
3. Run `cd bot-worker && npm run google:login`.
4. Complete password, MFA, CAPTCHA, and security prompts manually in the opened browser.
5. Press Enter in the terminal after login completes.

The saved `.auth/google-state.json` file is a credential. It is gitignored and must be
mounted as a protected file in production. Never commit or print it. Rerun the login command
when Google expires the session.

Google Workspace administrators and meeting hosts can block unsigned guests and external
accounts. ZeroClutter reports those restrictions but cannot bypass them.
```

- [ ] **Step 2: Run all automated verification**

Run:

```bash
cd backend
npx tsc --noEmit
npx jest --watchman=false --runInBand

cd ../bot-worker
npx tsc --noEmit
npx jest --watchman=false --runInBand

cd ../frontend
npm run build
```

Expected:
- backend TypeScript and all backend tests pass;
- worker TypeScript and all worker tests pass;
- frontend production build succeeds.

- [ ] **Step 3: Run manual acceptance checks**

With backend, worker, and frontend running:

1. `GOOGLE_AUTH_MODE=guest`: dispatch to a personal Gmail-hosted Meet with guests allowed; verify name, mic/camera off, admission, `IN_CALL`, and Leave.
2. `GOOGLE_AUTH_MODE=hybrid`: dispatch to a meeting that requires a Google account; verify one guest attempt, one account retry, `botEmail`, admission, and no retry loop.
3. Expire/remove `.auth/google-state.json`; dispatch to an account-required meeting; verify `FAILED` detail instructs `npm run google:login`.
4. Dispatch an invalid/ended Meet; verify no authenticated fallback and a precise failure.
5. Dispatch to a Workspace meeting that blocks external accounts; verify the failure states host policy cannot be bypassed.
6. Request Leave while `PENDING`, `JOINING`, `WAITING_ADMISSION`, and `IN_CALL`; verify browser cleanup and `LEFT`.
7. Inspect `.debug/` after an unknown screen; verify no input values, cookies, tokens, or storage state are present.

- [ ] **Step 4: Commit documentation**

```bash
git add backend/README.md bot-worker/.env.example
git commit -m "docs(bot): document hybrid Google identity setup"
```

---

## Final Verification Gate

Before declaring completion:

```bash
git status --short
git diff --check
cd backend && npx tsc --noEmit && npx jest --watchman=false --runInBand
cd ../bot-worker && npx tsc --noEmit && npx jest --watchman=false --runInBand
cd ../frontend && npm run build
```

The live Meet acceptance matrix remains a human-assisted verification because meeting admission and
Workspace policy require real Google accounts and host interaction.

