import * as registry from '../src/session-registry';

beforeEach(async () => {
  await registry.closeAll();
});

describe('session-registry', () => {
  it('registers a session with defaults', () => {
    const session = registry.register('b1');
    expect(session.leaveRequested).toBe(false);
    expect(session.browser).toBeNull();
    expect(registry.getActiveBotIds()).toContain('b1');
  });

  it('markLeave flips the flag and returns true for a known bot', () => {
    registry.register('b2');
    expect(registry.markLeave('b2')).toBe(true);
  });

  it('markLeave returns false for an unknown bot', () => {
    expect(registry.markLeave('nope')).toBe(false);
  });

  it('unregister removes the session', () => {
    registry.register('b3');
    registry.unregister('b3');
    expect(registry.getActiveBotIds()).not.toContain('b3');
  });
});
