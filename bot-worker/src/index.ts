import { startQueueWorker } from './queue';
import { startControlSubscriber } from './control';
import prisma from './prisma';
import * as registry from './session-registry';
import { logger } from './logger';

const main = async (): Promise<void> => {
  await prisma.$connect();
  const worker = startQueueWorker();
  const sub = startControlSubscriber();
  logger.info('bot-worker started');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info('Shutting down bot-worker', { signal });
    await registry.closeAll();
    await worker.close();
    sub.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection', { reason }));
};

main().catch((err) => {
  logger.error('bot-worker failed to start', { error: (err as Error).message });
  process.exit(1);
});
