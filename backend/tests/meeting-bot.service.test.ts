jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: {
    meetingBot: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../src/modules/meeting-bot/meeting-bot.queue', () => ({
  enqueueJoinJob: jest.fn(),
  publishLeave: jest.fn(),
}));

import prisma from '../src/config/database';
import { enqueueJoinJob, publishLeave } from '../src/modules/meeting-bot/meeting-bot.queue';
import { createBot, getBotById, requestLeave } from '../src/modules/meeting-bot/meeting-bot.service';
import { ForbiddenError, NotFoundError } from '../src/utils/errors';

const mockPrisma = prisma as unknown as {
  meetingBot: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
};

beforeEach(() => jest.clearAllMocks());

describe('createBot', () => {
  it('creates a PENDING record and enqueues a join job', async () => {
    mockPrisma.meetingBot.create.mockResolvedValue({ id: 'bot1', userId: 'u1', status: 'PENDING' });
    const bot = await createBot('u1', 'https://meet.google.com/abc-defg-hij', 'ZeroClutter Notetaker');
    expect(bot.id).toBe('bot1');
    expect(mockPrisma.meetingBot.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        displayName: 'ZeroClutter Notetaker',
        status: 'PENDING',
      },
    });
    expect(enqueueJoinJob).toHaveBeenCalledWith('bot1');
  });

  it('marks the record FAILED and rethrows if enqueue fails', async () => {
    mockPrisma.meetingBot.create.mockResolvedValue({ id: 'bot2', userId: 'u1', status: 'PENDING' });
    (enqueueJoinJob as jest.Mock).mockRejectedValue(new Error('redis down'));
    await expect(createBot('u1', 'https://meet.google.com/abc-defg-hij', 'Bot')).rejects.toThrow('redis down');
    expect(mockPrisma.meetingBot.update).toHaveBeenCalledWith({
      where: { id: 'bot2' },
      data: { status: 'FAILED', statusDetail: 'Failed to enqueue join job: redis down' },
    });
  });
});

describe('getBotById', () => {
  it('throws NotFoundError when missing', async () => {
    mockPrisma.meetingBot.findUnique.mockResolvedValue(null);
    await expect(getBotById('x', 'u1')).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when owned by another user', async () => {
    mockPrisma.meetingBot.findUnique.mockResolvedValue({ id: 'b', userId: 'other' });
    await expect(getBotById('b', 'u1')).rejects.toThrow(ForbiddenError);
  });

  it('returns the bot for its owner', async () => {
    mockPrisma.meetingBot.findUnique.mockResolvedValue({ id: 'b', userId: 'u1' });
    const bot = await getBotById('b', 'u1');
    expect(bot.id).toBe('b');
  });
});

describe('requestLeave', () => {
  it('publishes a leave signal for an active bot', async () => {
    mockPrisma.meetingBot.findUnique.mockResolvedValue({
      id: 'b',
      userId: 'u1',
      status: 'IN_CALL',
      leaveRequested: false,
    });
    await requestLeave('b', 'u1');
    expect(mockPrisma.meetingBot.update).toHaveBeenCalledWith({
      where: { id: 'b' },
      data: { leaveRequested: true },
    });
    expect(publishLeave).toHaveBeenCalledWith('b');
  });

  it('is a no-op for a terminal bot', async () => {
    mockPrisma.meetingBot.findUnique.mockResolvedValue({ id: 'b', userId: 'u1', status: 'LEFT' });
    await requestLeave('b', 'u1');
    expect(publishLeave).not.toHaveBeenCalled();
    expect(mockPrisma.meetingBot.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ leaveRequested: true }) }),
    );
  });
});
