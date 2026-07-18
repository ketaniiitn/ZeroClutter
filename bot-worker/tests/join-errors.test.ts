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
