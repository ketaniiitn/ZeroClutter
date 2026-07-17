process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

jest.mock('../src/session-registry', () => ({
  markLeave: jest.fn(),
}));

import * as registry from '../src/session-registry';
import { handleControlMessage } from '../src/control';

const mockMarkLeave = registry.markLeave as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('handleControlMessage', () => {
  it('calls registry.markLeave for a leave action message', () => {
    handleControlMessage(JSON.stringify({ botId: 'b1', action: 'leave' }));
    expect(mockMarkLeave).toHaveBeenCalledWith('b1');
  });

  it('does not throw for a malformed (non-JSON) message', () => {
    expect(() => handleControlMessage('not-valid-json{')).not.toThrow();
    expect(mockMarkLeave).not.toHaveBeenCalled();
  });

  it('ignores messages with an action other than leave', () => {
    handleControlMessage(JSON.stringify({ botId: 'b1', action: 'noop' }));
    expect(mockMarkLeave).not.toHaveBeenCalled();
  });
});
