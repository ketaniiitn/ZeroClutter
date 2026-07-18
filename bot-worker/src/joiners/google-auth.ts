import * as fs from 'fs';
import * as path from 'path';
import { chromium, type Browser, type BrowserContext } from 'playwright';
import { config } from '../config';
import { MeetJoinError } from './join-errors';

const MEET_BROWSER_ARGS = [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  '--disable-blink-features=AutomationControlled',
  '--no-sandbox',
  '--autoplay-policy=no-user-gesture-required',
];

/** Google rejects Playwright's bundled Chromium; use installed Chrome. */
export const launchMeetBrowser = async (opts: {
  headless: boolean;
}): Promise<Browser> => {
  try {
    return await chromium.launch({
      channel: 'chrome',
      headless: opts.headless,
      ignoreDefaultArgs: ['--enable-automation'],
      args: MEET_BROWSER_ARGS,
    });
  } catch (error) {
    throw new Error(
      `Install Google Chrome and retry. Playwright could not launch system Chrome: ${(error as Error).message}`,
    );
  }
};

export const isGoogleSignInRejected = (url: string): boolean =>
  /\/signin\/rejected|browser.?or.?app.?may.?not.?be.?secure/i.test(url);

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
