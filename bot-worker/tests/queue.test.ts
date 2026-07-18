process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: { meetingBot: { findUnique: jest.fn() } },
}));

jest.mock('../src/session-registry', () => ({
  register: jest.fn(),
  unregister: jest.fn(),
  markLeave: jest.fn(),
}));

jest.mock('../src/status', () => ({
  updateStatus: jest.fn(),
  updateBotIdentity: jest.fn(),
}));

jest.mock('../src/joiners/google-meet.joiner', () => ({
  googleMeetJoiner: { join: jest.fn() },
}));

import prisma from '../src/prisma';
import * as registry from '../src/session-registry';
import { updateBotIdentity, updateStatus } from '../src/status';
import { googleMeetJoiner } from '../src/joiners/google-meet.joiner';
import { processJoin } from '../src/queue';
import { BOT_STATUS } from '../src/constants';

interface FakeBrowser {
  close: jest.Mock;
}

interface FakeSession {
  browser: FakeBrowser | null;
  leaveRequested: boolean;
}

const mockFindUnique = (prisma as unknown as { meetingBot: { findUnique: jest.Mock } }).meetingBot.findUnique;
const mockRegister = registry.register as jest.Mock;
const mockUnregister = registry.unregister as jest.Mock;
const mockUpdateStatus = updateStatus as jest.Mock;
const mockUpdateBotIdentity = updateBotIdentity as jest.Mock;
const mockJoin = googleMeetJoiner.join as jest.Mock;

const baseBot = {
  id: 'b1',
  meetingUrl: 'https://meet.google.com/abc-defg-hij',
  displayName: 'ZeroClutter Notetaker',
};

beforeEach(() => jest.clearAllMocks());

describe('processJoin', () => {
  it('returns early without registering or joining when the bot is not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    await processJoin('missing');
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockJoin).not.toHaveBeenCalled();
  });

  it.each([BOT_STATUS.LEFT, BOT_STATUS.FAILED])(
    'skips joining without registering when status is %s',
    async (status) => {
      mockFindUnique.mockResolvedValue({ ...baseBot, status, leaveRequested: false });
      await processJoin('b1');
      expect(mockRegister).not.toHaveBeenCalled();
      expect(mockJoin).not.toHaveBeenCalled();
    },
  );

  it('marks the bot LEFT and skips joining when leaveRequested is true', async () => {
    mockFindUnique.mockResolvedValue({ ...baseBot, status: BOT_STATUS.PENDING, leaveRequested: true });
    await processJoin('b1');
    expect(mockUpdateStatus).toHaveBeenCalledWith('b1', BOT_STATUS.LEFT, 'Leave requested before join');
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockJoin).not.toHaveBeenCalled();
  });

  it('registers, joins, and cleans up the browser on the happy path', async () => {
    const fakeBrowser: FakeBrowser = { close: jest.fn() };
    const session: FakeSession = { browser: null, leaveRequested: false };
    mockRegister.mockReturnValue(session);
    mockFindUnique.mockResolvedValue({ ...baseBot, status: BOT_STATUS.PENDING, leaveRequested: false });
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

    expect(mockRegister).toHaveBeenCalledWith('b1');
    expect(mockJoin).toHaveBeenCalled();
    expect(mockUpdateBotIdentity).toHaveBeenCalledWith('b1', 'bot@example.com');
    expect(fakeBrowser.close).toHaveBeenCalled();
    expect(mockUnregister).toHaveBeenCalledWith('b1');
  });

  it('marks the bot FAILED and still cleans up when the joiner throws', async () => {
    const fakeBrowser: FakeBrowser = { close: jest.fn() };
    const session: FakeSession = { browser: fakeBrowser, leaveRequested: false };
    mockRegister.mockReturnValue(session);
    mockFindUnique.mockResolvedValue({ ...baseBot, status: BOT_STATUS.PENDING, leaveRequested: false });
    mockJoin.mockRejectedValue(new Error('boom'));

    await processJoin('b1');

    expect(mockUpdateStatus).toHaveBeenCalledWith('b1', BOT_STATUS.FAILED, 'boom');
    expect(fakeBrowser.close).toHaveBeenCalled();
    expect(mockUnregister).toHaveBeenCalledWith('b1');
  });

  it('re-checks leaveRequested after register and skips join when leave landed in between', async () => {
    const session: FakeSession = { browser: null, leaveRequested: false };
    mockRegister.mockReturnValue(session);
    mockFindUnique
      .mockResolvedValueOnce({
        ...baseBot,
        status: BOT_STATUS.PENDING,
        leaveRequested: false,
      })
      .mockResolvedValueOnce({
        ...baseBot,
        status: BOT_STATUS.PENDING,
        leaveRequested: true,
      });

    await processJoin('b1');

    expect(mockRegister).toHaveBeenCalledWith('b1');
    expect(mockFindUnique).toHaveBeenCalledTimes(2);
    expect(mockJoin).not.toHaveBeenCalled();
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      'b1',
      BOT_STATUS.LEFT,
      'Leave requested before join',
    );
    expect(mockUnregister).toHaveBeenCalledWith('b1');
  });
});
