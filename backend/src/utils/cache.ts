import { getRedisClient } from '../config/redis';
import { logger } from './logger';

const DEFAULT_TTL = 300; // 5 minutes

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    logger.warn('Cache get failed', { key, error: (err as Error).message });
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> => {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.warn('Cache set failed', { key, error: (err as Error).message });
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (err) {
    logger.warn('Cache delete failed', { key, error: (err as Error).message });
  }
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    logger.warn('Cache pattern delete failed', { pattern, error: (err as Error).message });
  }
};

export const meetingKey = (userId: string, meetingId: string) =>
  `meeting:${userId}:${meetingId}`;

export const meetingListKey = (userId: string, query: string) =>
  `meetings:${userId}:${query}`;
