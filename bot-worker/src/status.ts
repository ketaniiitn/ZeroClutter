import prisma from './prisma';
import { BOT_STATUS } from './constants';

export const updateStatus = async (botId: string, status: string, detail?: string): Promise<void> => {
  const data: Record<string, unknown> = { status, statusDetail: detail ?? null };
  if (status === BOT_STATUS.IN_CALL) data.joinedAt = new Date();
  if (status === BOT_STATUS.LEFT || status === BOT_STATUS.FAILED) data.leftAt = new Date();
  await prisma.meetingBot.update({ where: { id: botId }, data });
};
