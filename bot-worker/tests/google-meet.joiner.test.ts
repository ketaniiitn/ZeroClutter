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

  it('does not fallback for unknown UI errors', async () => {
    const attempt: JoinAttempt = jest
      .fn()
      .mockRejectedValue(new MeetJoinError('JOIN_UI_CHANGED', 'ui changed'));
    await expect(runJoinStrategy('hybrid', ctx, deps(), attempt)).rejects.toMatchObject({
      code: 'JOIN_UI_CHANGED',
    });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('does not fallback for admission timeout', async () => {
    const attempt: JoinAttempt = jest
      .fn()
      .mockRejectedValue(new MeetJoinError('ADMISSION_TIMEOUT', 'timeout'));
    await expect(runJoinStrategy('hybrid', ctx, deps(), attempt)).rejects.toMatchObject({
      code: 'ADMISSION_TIMEOUT',
    });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('does not fallback for arbitrary errors', async () => {
    const attempt: JoinAttempt = jest.fn().mockRejectedValue(new Error('boom'));
    await expect(runJoinStrategy('hybrid', ctx, deps(), attempt)).rejects.toThrow('boom');
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('does not retry in guest mode even for a fallback-eligible failure', async () => {
    const attempt: JoinAttempt = jest
      .fn()
      .mockRejectedValue(new MeetJoinError('GUEST_ACCOUNT_REQUIRED', 'required'));
    const d = deps();
    await expect(runJoinStrategy('guest', ctx, d, attempt)).rejects.toMatchObject({
      code: 'GUEST_ACCOUNT_REQUIRED',
    });
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(attempt).toHaveBeenCalledWith('guest', ctx, d);
  });

  it('uses account directly in account mode', async () => {
    const attempt: JoinAttempt = jest.fn().mockResolvedValue(undefined);
    await runJoinStrategy('account', ctx, deps(), attempt);
    expect(attempt).toHaveBeenCalledWith('account', ctx, expect.anything());
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('announces the account fallback via onStatus before retrying', async () => {
    const attempt: JoinAttempt = jest
      .fn()
      .mockRejectedValueOnce(new MeetJoinError('GUEST_ACCOUNT_REQUIRED', 'required'))
      .mockResolvedValueOnce(undefined);
    const d = deps();
    await runJoinStrategy('hybrid', ctx, d, attempt);
    expect(d.onStatus).toHaveBeenCalledWith(
      'JOINING',
      'Guest access blocked; retrying with bot account',
    );
  });
});
