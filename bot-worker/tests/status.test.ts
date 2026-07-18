jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: { meetingBot: { update: jest.fn() } },
}));

import prisma from '../src/prisma';
import { updateBotIdentity, updateStatus } from '../src/status';
import { BOT_STATUS } from '../src/constants';

const mockUpdate = (prisma as unknown as { meetingBot: { update: jest.Mock } }).meetingBot.update;

beforeEach(() => jest.clearAllMocks());

describe('updateStatus', () => {
  it('stamps joinedAt when moving to IN_CALL', async () => {
    await updateStatus('b1', BOT_STATUS.IN_CALL);
    const arg = mockUpdate.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 'b1' });
    expect(arg.data.status).toBe('IN_CALL');
    expect(arg.data.joinedAt).toBeInstanceOf(Date);
  });

  it('stamps leftAt when moving to LEFT', async () => {
    await updateStatus('b1', BOT_STATUS.LEFT, 'done');
    const arg = mockUpdate.mock.calls[0][0];
    expect(arg.data.status).toBe('LEFT');
    expect(arg.data.statusDetail).toBe('done');
    expect(arg.data.leftAt).toBeInstanceOf(Date);
  });

  it('stamps leftAt when moving to FAILED', async () => {
    await updateStatus('b1', BOT_STATUS.FAILED, 'boom');
    const arg = mockUpdate.mock.calls[0][0];
    expect(arg.data.leftAt).toBeInstanceOf(Date);
  });

  it('does not stamp timestamps for JOINING', async () => {
    await updateStatus('b1', BOT_STATUS.JOINING);
    const arg = mockUpdate.mock.calls[0][0];
    expect(arg.data.joinedAt).toBeUndefined();
    expect(arg.data.leftAt).toBeUndefined();
  });
});

describe('updateBotIdentity', () => {
  it('persists the bot email used for the join attempt', async () => {
    await updateBotIdentity('b1', 'bot@example.com');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { botEmail: 'bot@example.com' },
    });
  });

  it('clears the bot email for a guest attempt', async () => {
    await updateBotIdentity('b1', null);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { botEmail: null },
    });
  });
});
