process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL ||= 'redis://localhost:6379';

import type { Page } from 'playwright';
import {
  classifyMeetScreen,
  JOIN_BUTTON_ACCESSIBLE_NAME,
  waitForAdmissionOrFailure,
  waitForJoinableLobby,
  type MeetScreenSnapshot,
} from '../src/joiners/google-meet-page';
import { MEET_SCREEN_TEXT, SELECTORS } from '../src/joiners/selectors';

const snapshot = (partial: Partial<MeetScreenSnapshot>): MeetScreenSnapshot => ({
  url: 'https://meet.google.com/abc-defg-hij',
  bodyText: '',
  hasNameInput: false,
  hasJoinButton: false,
  hasInCallControls: false,
  ...partial,
});

/** Minimal Page stand-in for snapshotMeetScreen + wait loops. */
const mockPage = (opts: { url: string; bodyText?: string }): Page => {
  const bodyText = opts.bodyText ?? '';
  const invisible = {
    first: () => ({
      isVisible: async () => false,
    }),
    innerText: async () => bodyText,
    isVisible: async () => false,
  };
  return {
    url: () => opts.url,
    locator: () => invisible,
    getByRole: () => ({
      first: () => ({ isVisible: async () => false }),
    }),
    waitForTimeout: jest.fn().mockResolvedValue(undefined),
  } as unknown as Page;
};

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
    "You can't join this video call",
    'Unable to join this meeting',
    'Ask your administrator for access',
  ])('classifies guest policy text: %s', (bodyText) => {
    expect(classifyMeetScreen(snapshot({ bodyText }), false)).toBe(
      'GUEST_BLOCKED_BY_POLICY',
    );
  });

  it.each([
    'You cannot join this video call',
    "You can't join this video call",
    'Unable to join this meeting',
    'Ask your administrator for access',
  ])('classifies authenticated policy text: %s', (bodyText) => {
    expect(classifyMeetScreen(snapshot({ bodyText }), true)).toBe(
      'EXTERNAL_ACCOUNT_BLOCKED',
    );
  });

  it.each([
    'Meeting not found',
    'Check your meeting code',
    'Invalid video call name',
    'Returning to home screen',
  ])('classifies invalid or ended meeting: %s', (bodyText) => {
    expect(classifyMeetScreen(snapshot({ bodyText }), false)).toBe(
      'INVALID_OR_ENDED_MEETING',
    );
  });

  it.each(['Sign in to continue', 'Sign in to join', 'Sign in with Google'])(
    'classifies inline guest sign-in wall: %s',
    (bodyText) => {
      expect(classifyMeetScreen(snapshot({ bodyText }), false)).toBe(
        'GUEST_ACCOUNT_REQUIRED',
      );
    },
  );

  it.each(['Sign in to continue', 'Sign in to join', 'Sign in with Google'])(
    'classifies inline authenticated sign-in wall: %s',
    (bodyText) => {
      expect(classifyMeetScreen(snapshot({ bodyText }), true)).toBe(
        'AUTH_SESSION_EXPIRED',
      );
    },
  );

  it('returns UNKNOWN for unrecognized UI', () => {
    expect(classifyMeetScreen(snapshot({ bodyText: 'Welcome' }), false)).toBe('UNKNOWN');
  });

  it('keeps LOBBY when a name input coexists with sign-in copy', () => {
    expect(
      classifyMeetScreen(
        snapshot({ hasNameInput: true, bodyText: 'Sign in to join' }),
        false,
      ),
    ).toBe('LOBBY');
  });

  it('keeps LOBBY when a join button coexists with policy copy', () => {
    expect(
      classifyMeetScreen(
        snapshot({ hasJoinButton: true, bodyText: "You can't join this video call" }),
        false,
      ),
    ).toBe('LOBBY');
  });

  it('keeps authenticated LOBBY when join controls coexist with sign-in copy', () => {
    expect(
      classifyMeetScreen(
        snapshot({ hasJoinButton: true, bodyText: 'Sign in with Google' }),
        true,
      ),
    ).toBe('LOBBY');
  });

  it('still hard-fails invalid/ended even when lobby controls are present', () => {
    expect(
      classifyMeetScreen(
        snapshot({ hasNameInput: true, bodyText: 'Meeting not found' }),
        false,
      ),
    ).toBe('INVALID_OR_ENDED_MEETING');
  });

  it('still classifies sign-in text without lobby controls as guest account required', () => {
    expect(
      classifyMeetScreen(snapshot({ bodyText: 'Sign in to join' }), false),
    ).toBe('GUEST_ACCOUNT_REQUIRED');
  });

  it('still classifies policy text without lobby controls as guest blocked', () => {
    expect(
      classifyMeetScreen(snapshot({ bodyText: "You can't join this video call" }), false),
    ).toBe('GUEST_BLOCKED_BY_POLICY');
  });
});

describe('JOIN_BUTTON_ACCESSIBLE_NAME', () => {
  it.each(['Ask to join', 'Join now', 'ask to join', 'JOIN NOW'])(
    'matches explicit Meet label %s',
    (label) => {
      expect(JOIN_BUTTON_ACCESSIBLE_NAME.test(label)).toBe(true);
    },
  );

  it.each(['Join', 'join', 'Cannot join', 'Rejoin', 'Ask to rejoining'])(
    'rejects non-explicit label %s',
    (label) => {
      expect(JOIN_BUTTON_ACCESSIBLE_NAME.test(label)).toBe(false);
    },
  );
});

describe('SELECTORS.joinButtons', () => {
  it('only targets Ask to join / Join now and never a bare Join matcher', () => {
    expect(SELECTORS.joinButtons.length).toBeGreaterThan(0);
    for (const selector of SELECTORS.joinButtons) {
      const targetsAskToJoin = selector.includes('Ask to join');
      const targetsJoinNow = selector.includes('Join now');
      expect(targetsAskToJoin || targetsJoinNow).toBe(true);
      // Playwright :has-text("Join") and xpath contains(...,"Join") are
      // substring matches that can click "Cannot join" / "Rejoin".
      expect(selector).not.toMatch(/has-text\("Join"\)/);
      expect(selector).not.toMatch(/contains\([^)]*"Join"\)/);
      expect(selector.toLowerCase()).not.toMatch(/\bcannot join\b/);
      expect(selector.toLowerCase()).not.toMatch(/\brejoin\b/);
    }
  });
});

describe('waitForJoinableLobby actionable failures', () => {
  it('throws an actionable AUTH_SESSION_EXPIRED message', async () => {
    const page = mockPage({ url: 'https://accounts.google.com/signin/v2/identifier' });
    await expect(
      waitForJoinableLobby(page, {
        authenticated: true,
        timeoutMs: 1_000,
        botId: 'b1',
        clearInterstitials: async () => undefined,
      }),
    ).rejects.toMatchObject({
      code: 'AUTH_SESSION_EXPIRED',
      message: 'Bot Google session expired; run npm run google:login',
    });
  });

  it('throws an actionable EXTERNAL_ACCOUNT_BLOCKED message', async () => {
    const page = mockPage({
      url: 'https://meet.google.com/abc-defg-hij',
      bodyText: 'Ask your administrator for access',
    });
    await expect(
      waitForJoinableLobby(page, {
        authenticated: true,
        timeoutMs: 1_000,
        botId: 'b1',
        clearInterstitials: async () => undefined,
      }),
    ).rejects.toMatchObject({
      code: 'EXTERNAL_ACCOUNT_BLOCKED',
      message: 'Host organization blocks external accounts',
    });
  });
});

describe('waitForAdmissionOrFailure', () => {
  const deps = () => ({
    onStatus: jest.fn(),
    onIdentity: jest.fn(),
    isLeaveRequested: jest.fn().mockReturnValue(false),
    setBrowser: jest.fn(),
  });

  it('classifies an authenticated admission redirect as AUTH_SESSION_EXPIRED', async () => {
    const page = mockPage({ url: 'https://accounts.google.com/signin/v2/identifier' });
    await expect(waitForAdmissionOrFailure(page, deps(), true)).rejects.toMatchObject({
      code: 'AUTH_SESSION_EXPIRED',
      message: 'Bot Google session expired; run npm run google:login',
    });
  });

  it('detects denied admission via centralized MEET_SCREEN_TEXT', async () => {
    const phrase = MEET_SCREEN_TEXT.admissionDenied[0];
    const page = mockPage({
      url: 'https://meet.google.com/abc-defg-hij',
      bodyText: `Your ${phrase} by the host.`,
    });
    await expect(waitForAdmissionOrFailure(page, deps(), false)).rejects.toMatchObject({
      code: 'ADMISSION_DENIED',
      message: 'Host denied admission',
    });
  });
});
