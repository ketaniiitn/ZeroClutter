import Redis from 'ioredis';
import { logger } from '../utils/logger';

let client: Redis | null = null;

export const getRedisClient = (): Redis | null => client;

export const connectRedis = async (): Promise<void> => {
  const url = process.env.REDIS_URL;
  if (!url) {
    logger.warn('REDIS_URL not set — caching and Redis rate limiting disabled');
    return;
  }

  client = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
  });

  try {
    await client.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis unavailable — running without cache', { error: (err as Error).message });
    client = null;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (client) {
    await client.quit();
    client = null;
  }
};
