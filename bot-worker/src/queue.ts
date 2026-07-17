import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config';
import prisma from './prisma';
import { BOT_STATUS } from './constants';
import { updateStatus } from './status';
import * as registry from './session-registry';
import { googleMeetJoiner } from './joiners/google-meet.joiner';
import { logger } from './logger';

const JOIN_QUEUE_NAME = 'meeting-bot-join';

export const processJoin = async (botId: string): Promise<void> => {
  const bot = await prisma.meetingBot.findUnique({ where: { id: botId } });
  if (!bot) {
    logger.warn('Join job for unknown bot', { botId });
    return;
  }
  if (bot.status === BOT_STATUS.LEFT || bot.status === BOT_STATUS.FAILED) {
    logger.info('Skipping join for terminal bot', { botId, status: bot.status });
    return;
  }
  if (bot.leaveRequested) {
    await updateStatus(botId, BOT_STATUS.LEFT, 'Leave requested before join');
    return;
  }

  const session = registry.register(botId);
  try {
    await googleMeetJoiner.join(
      { botId, meetingUrl: bot.meetingUrl, displayName: bot.displayName },
      {
        onStatus: (status, detail) => updateStatus(botId, status, detail),
        isLeaveRequested: () => session.leaveRequested,
        setBrowser: (browser) => {
          session.browser = browser;
        },
      },
    );
  } catch (err) {
    logger.error('Join failed', { botId, error: (err as Error).message });
    await updateStatus(botId, BOT_STATUS.FAILED, (err as Error).message);
  } finally {
    try {
      await session.browser?.close();
    } catch {
      // ignore cleanup errors
    }
    registry.unregister(botId);
  }
};

export const startQueueWorker = (): Worker => {
  const connection = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });
  const worker = new Worker(
    JOIN_QUEUE_NAME,
    async (job) => {
      const { botId } = job.data as { botId: string };
      await processJoin(botId);
    },
    { connection, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error('Join job errored', { botId: job?.data?.botId, error: err.message });
  });

  logger.info('Join queue worker started', { queue: JOIN_QUEUE_NAME });
  return worker;
};
