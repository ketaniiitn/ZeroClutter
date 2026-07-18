import * as fs from 'fs';
import * as path from 'path';
import type { Locator, Page } from 'playwright';
import { config } from '../config';
import { MeetJoinError, type MeetJoinFailureCode } from './join-errors';
import type { JoinerDeps } from './joiner.interface';
import { MEET_SCREEN_TEXT, SELECTORS } from './selectors';
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

const includesAny = (text: string, patterns: readonly string[]): boolean =>
  patterns.some((pattern) => text.includes(pattern.toLowerCase()));

export const classifyMeetScreen = (
  state: MeetScreenSnapshot,
  authenticated: boolean,
): MeetScreen => {
  if (state.hasInCallControls) return 'IN_CALL';
  if (state.url.includes('accounts.google.com')) {
    return authenticated ? 'AUTH_SESSION_EXPIRED' : 'GUEST_ACCOUNT_REQUIRED';
  }

  const text = state.bodyText.toLowerCase();
  if (includesAny(text, MEET_SCREEN_TEXT.invalidOrEndedMeeting)) {
    return 'INVALID_OR_ENDED_MEETING';
  }
  // Joinable lobby controls beat fuzzy body-text sign-in/policy matches. Meet
  // pages often include those phrases alongside a real guest name/join form.
  if (state.hasNameInput || state.hasJoinButton) return 'LOBBY';
  if (includesAny(text, MEET_SCREEN_TEXT.signInRequired)) {
    return authenticated ? 'AUTH_SESSION_EXPIRED' : 'GUEST_ACCOUNT_REQUIRED';
  }
  if (includesAny(text, MEET_SCREEN_TEXT.policyBlocked)) {
    return authenticated ? 'EXTERNAL_ACCOUNT_BLOCKED' : 'GUEST_BLOCKED_BY_POLICY';
  }
  return 'UNKNOWN';
};

/** Explicit Meet lobby CTAs only — never bare "join". */
export const JOIN_BUTTON_ACCESSIBLE_NAME = /^(ask to join|join now)$/i;

const visible = async (locator: Locator): Promise<boolean> =>
  locator.first().isVisible().catch(() => false);

export const snapshotMeetScreen = async (page: Page): Promise<MeetScreenSnapshot> => ({
  url: page.url(),
  bodyText: (await page.locator('body').innerText().catch(() => '')).slice(0, 8000),
  hasNameInput: await visible(page.locator(SELECTORS.nameInput.join(','))),
  hasJoinButton: await visible(
    page.getByRole('button', { name: JOIN_BUTTON_ACCESSIBLE_NAME }),
  ),
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

const screenToFailure = (screen: MeetScreen): MeetJoinFailureCode | null => {
  if (screen === 'LOBBY' || screen === 'IN_CALL' || screen === 'UNKNOWN') return null;
  return screen;
};

const failureDetail = (code: MeetJoinFailureCode): string => {
  switch (code) {
    case 'AUTH_SESSION_EXPIRED':
      return 'Bot Google session expired; run npm run google:login';
    case 'EXTERNAL_ACCOUNT_BLOCKED':
      return 'Host organization blocks external accounts';
    default:
      return code.replaceAll('_', ' ').toLowerCase();
  }
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
      throw new MeetJoinError(code, failureDetail(code));
    }
    await page.waitForTimeout(500);
  }
  await saveMeetDebugDump(page, options.botId, 'join-ui-timeout');
  throw new MeetJoinError(
    'JOIN_UI_CHANGED',
    'Google Meet join screen was not recognized; inspect bot-worker/.debug',
  );
};

const clickFirstVisible = async (page: Page, selectors: string[]): Promise<boolean> => {
  for (const selector of selectors) {
    const locator = selector.startsWith('//')
      ? page.locator(`xpath=${selector}`).first()
      : page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      const clicked = await locator
        .click({ timeout: 2_000 })
        .then(() => true)
        .catch(() => false);
      if (clicked) return true;
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
  await clickFirstVisible(page, SELECTORS.turnOffMic);
  await clickFirstVisible(page, SELECTORS.turnOffCam);
};

export const findJoinButton = async (page: Page): Promise<Locator | null> => {
  const byRole = page.getByRole('button', { name: JOIN_BUTTON_ACCESSIBLE_NAME }).first();
  if (await byRole.isVisible().catch(() => false)) return byRole;
  for (const selector of SELECTORS.joinButtons) {
    const locator = selector.startsWith('//')
      ? page.locator(`xpath=${selector}`).first()
      : page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) return locator;
  }
  return null;
};

export const waitForAdmissionOrFailure = async (
  page: Page,
  deps: JoinerDeps,
  authenticated = false,
): Promise<'admitted' | 'left'> => {
  const deadline = Date.now() + config.ADMISSION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (deps.isLeaveRequested()) {
      return 'left';
    }
    const state = await snapshotMeetScreen(page);
    const screen = classifyMeetScreen(state, authenticated);
    if (screen === 'IN_CALL') return 'admitted';
    if (screen === 'INVALID_OR_ENDED_MEETING') {
      throw new MeetJoinError(screen, 'Meeting ended before admission');
    }
    if (screen === 'AUTH_SESSION_EXPIRED' || screen === 'EXTERNAL_ACCOUNT_BLOCKED') {
      throw new MeetJoinError(screen, failureDetail(screen));
    }
    if (includesAny(state.bodyText.toLowerCase(), MEET_SCREEN_TEXT.admissionDenied)) {
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
  authenticated = false,
): Promise<void> => {
  while (!deps.isLeaveRequested()) {
    const state = await snapshotMeetScreen(page);
    if (classifyMeetScreen(state, authenticated) !== 'IN_CALL') return;
    await page.waitForTimeout(config.IN_CALL_POLL_MS);
  }
};
