import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

const makeStore = () => {
  const redis = getRedisClient();
  if (!redis) return undefined;

  return new RedisStore({
    sendCommand: (...args: string[]) => {
      const [cmd, ...rest] = args;
      return redis.call(cmd, ...rest) as unknown as Promise<number>;
    },
  });
};

// 100 requests per 15 minutes for all routes
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  handler: (_req, res) => {
    const traceId = res.locals.traceId || '';
    logger.warn('Global rate limit exceeded', { traceId });
    res.status(429).json({
      traceId,
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.' },
    });
  },
});

// 10 requests per 15 minutes on auth routes (brute-force protection)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  handler: (_req, res) => {
    const traceId = res.locals.traceId || '';
    logger.warn('Auth rate limit exceeded', { traceId });
    res.status(429).json({
      traceId,
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth attempts. Please try again in 15 minutes.' },
    });
  },
});

// 5 requests per minute on the AI analyze endpoint (expensive operation)
export const analyzeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  handler: (_req, res) => {
    const traceId = res.locals.traceId || '';
    logger.warn('Analyze rate limit exceeded', { traceId });
    res.status(429).json({
      traceId,
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many analysis requests. Maximum 5 per minute.' },
    });
  },
});
