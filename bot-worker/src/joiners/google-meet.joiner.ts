import type { Browser } from 'playwright';
import { config, type GoogleAuthMode } from '../config';
import { BOT_STATUS } from '../constants';
import { logger } from '../logger';
import { createMeetContext, launchMeetBrowser } from './google-auth';
import {
  clearMeetInterstitials,
  ensureMediaOff,
  findGuestNameInput,
  findJoinButton,
  holdUntilLeaveOrMeetingEnd,
  waitForAdmissionOrFailure,
  waitForJoinableLobby,
} from './google-meet-page';
import { isFallbackEligible, MeetJoinError } from './join-errors';
import type {
  Joiner,
  JoinAttemptMode,
  JoinContext,
  JoinerDeps,
} from './joiner.interface';

export type JoinAttempt = (
  mode: JoinAttemptMode,
  ctx: JoinContext,
  deps: JoinerDeps,
) => Promise<void>;

/**
 * Pure orchestration of the identity strategy. Guest-first in hybrid mode with
 * exactly one account retry, only for typed fallback-eligible guest failures.
 * The concrete browser work is injected via `attempt` so this stays testable.
 */
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

/**
 * Runs a single Meet join attempt in its own browser context. The browser is
 * launched once by the outer joiner and reused for the guest and account
 * contexts, so a fallback never leaks a guest browser. The context is always
 * closed in the `finally` block.
 */
const runMeetAttempt = async (
  browser: Browser,
  mode: JoinAttemptMode,
  ctx: JoinContext,
  deps: JoinerDeps,
): Promise<void> => {
  if (deps.isLeaveRequested()) {
    await deps.onStatus(BOT_STATUS.LEFT, 'Left before join');
    return;
  }
  await deps.onStatus(
    BOT_STATUS.JOINING,
    mode === 'guest' ? 'Joining as guest' : 'Joining with bot account',
  );

  const context = await createMeetContext(browser, mode === 'account');
  try {
    const page = await context.newPage();
    const url = ctx.meetingUrl.includes('?')
      ? `${ctx.meetingUrl}&hl=en`
      : `${ctx.meetingUrl}?hl=en`;
    await page.goto(url, {
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
      logger.info('Filled guest display name', {
        botId: ctx.botId,
        displayName: ctx.displayName,
      });
    }

    await ensureMediaOff(page);
    const joinButton = await findJoinButton(page);
    if (!joinButton) {
      throw new MeetJoinError('JOIN_UI_CHANGED', 'Join button was not found');
    }
    await joinButton.click();
    await deps.onStatus(BOT_STATUS.WAITING_ADMISSION, 'Waiting for host admission');

    const authenticated = mode === 'account';
    const admission = await waitForAdmissionOrFailure(page, deps, authenticated);
    if (admission === 'left') {
      await deps.onStatus(BOT_STATUS.LEFT, 'Left before admission');
      return;
    }
    await deps.onStatus(BOT_STATUS.IN_CALL);
    logger.info('Bot admitted to meeting', { botId: ctx.botId, mode });
    await holdUntilLeaveOrMeetingEnd(page, deps, authenticated);
    await deps.onStatus(
      BOT_STATUS.LEFT,
      deps.isLeaveRequested() ? 'Leave requested' : 'Meeting ended',
    );
  } finally {
    await context.close().catch(() => undefined);
  }
};

export const googleMeetJoiner: Joiner = {
  async join(ctx: JoinContext, deps: JoinerDeps): Promise<void> {
    const browser: Browser = await launchMeetBrowser({
      headless: config.HEADLESS,
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
