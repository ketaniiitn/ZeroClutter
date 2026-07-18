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
