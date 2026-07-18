import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { paginatedResponse } from '../../utils/response';
import { enqueueJoinJob, publishLeave } from './meeting-bot.queue';
import { BOT_STATUS, TERMINAL_STATUSES, BotStatus } from './meeting-bot.constants';

export const createBot = async (userId: string, meetingUrl: string, displayName: string) => {
  const bot = await prisma.meetingBot.create({
    data: { userId, meetingUrl, displayName, status: BOT_STATUS.PENDING },
  });

  try {
    await enqueueJoinJob(bot.id);
  } catch (err) {
    await prisma.meetingBot.update({
      where: { id: bot.id },
      data: { status: BOT_STATUS.FAILED, statusDetail: `Failed to enqueue join job: ${(err as Error).message}` },
    });
    throw err;
  }

  return bot;
};

export const getBotById = async (id: string, userId: string) => {
  const bot = await prisma.meetingBot.findUnique({ where: { id } });
  if (!bot) throw new NotFoundError('Bot');
  if (bot.userId !== userId) throw new ForbiddenError('You do not have access to this bot');
  return bot;
};

export const listBots = async (userId: string, page: number, limit: number) => {
  const [total, items] = await Promise.all([
    prisma.meetingBot.count({ where: { userId } }),
    prisma.meetingBot.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return paginatedResponse(items, total, page, limit);
};

export const requestLeave = async (id: string, userId: string) => {
  const bot = await getBotById(id, userId);
  if (TERMINAL_STATUSES.includes(bot.status as BotStatus)) return bot;
  await prisma.meetingBot.update({ where: { id: bot.id }, data: { leaveRequested: true } });
  await publishLeave(bot.id);
  return { ...bot, leaveRequested: true };
};
