import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';
import {
  createMeetContext,
  isGoogleSignInRejected,
  launchMeetBrowser,
  requireStorageState,
  resolveStorageStatePath,
} from '../src/joiners/google-auth';
import { MeetJoinError } from '../src/joiners/join-errors';

jest.mock('../src/config', () => ({
  config: { GOOGLE_STORAGE_STATE_PATH: '.auth/test-google-state.json' },
}));

jest.mock('playwright', () => ({
  chromium: { launch: jest.fn() },
}));

const statePath = path.resolve(process.cwd(), '.auth/test-google-state.json');

afterEach(() => {
  fs.rmSync(statePath, { force: true });
  jest.clearAllMocks();
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

  it('detects Google rejected-sign-in URLs', () => {
    expect(
      isGoogleSignInRejected(
        'https://accounts.google.com/v3/signin/rejected?continue=https%3A%2F%2Fmyaccount.google.com',
      ),
    ).toBe(true);
    expect(isGoogleSignInRejected('https://myaccount.google.com/')).toBe(false);
  });

  it('launches system Google Chrome with automation flags stripped', async () => {
    (chromium.launch as jest.Mock).mockResolvedValue('browser');
    await expect(launchMeetBrowser({ headless: false })).resolves.toBe('browser');
    expect(chromium.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'chrome',
        headless: false,
        ignoreDefaultArgs: ['--enable-automation'],
      }),
    );
  });

  it('explains when system Chrome is unavailable', async () => {
    (chromium.launch as jest.Mock).mockRejectedValue(new Error('Executable doesn\'t exist'));
    await expect(launchMeetBrowser({ headless: true })).rejects.toThrow(
      /Install Google Chrome/i,
    );
  });
});
