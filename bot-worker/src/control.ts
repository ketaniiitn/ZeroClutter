import IORedis from 'ioredis';
import { config } from './config';
import * as registry from './session-registry';
import { logger } from './logger';

const CONTROL_CHANNEL = 'meeting-bot:control';

export const startControlSubscriber = (): IORedis => {
  const sub = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });

  sub.subscribe(CONTROL_CHANNEL, (err) => {
    if (err) logger.error('Failed to subscribe to control channel', { error: err.message });
    else logger.info('Subscribed to control channel', { channel: CONTROL_CHANNEL });
  });

  sub.on('message', (_channel, message) => {
    try {
      const { botId, action } = JSON.parse(message) as { botId: string; action: string };
      if (action === 'leave') {
        const found = registry.markLeave(botId);
        logger.info('Leave signal received', { botId, found });
      }
    } catch (err) {
      logger.error('Malformed control message', { message, error: (err as Error).message });
    }
  });

  return sub;
};
