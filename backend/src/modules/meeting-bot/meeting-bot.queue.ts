import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { ServiceUnavailableError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const JOIN_QUEUE_NAME = 'meeting-bot-join';
export const CONTROL_CHANNEL = 'meeting-bot:control';

let connection: IORedis | null = null;
let joinQueue: Queue | null = null;

const getConnection = (): IORedis => {
  if (!env.REDIS_URL) {
    throw new ServiceUnavailableError('Meeting bot feature requires Redis (REDIS_URL is not configured)');
  }
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
    connection.on('error', (err) => logger.error('Bot queue Redis error', { error: err.message }));
  }
  return connection;
};

const getJoinQueue = (): Queue => {
  if (!joinQueue) {
    joinQueue = new Queue(JOIN_QUEUE_NAME, { connection: getConnection() });
  }
  return joinQueue;
};

export const enqueueJoinJob = async (botId: string): Promise<void> => {
  await getJoinQueue().add('join', { botId }, { removeOnComplete: true, removeOnFail: 100 });
};

export const publishLeave = async (botId: string): Promise<void> => {
  await getConnection().publish(CONTROL_CHANNEL, JSON.stringify({ botId, action: 'leave' }));
};

export const closeBotQueue = async (): Promise<void> => {
  if (joinQueue) {
    await joinQueue.close();
    joinQueue = null;
  }
  if (connection) {
    await connection.quit();
    connection = null;
  }
};
