import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { logger } from './utils/logger';
import { startReminderScheduler } from './modules/reminders/reminder.scheduler';
import { closeBotQueue } from './modules/meeting-bot/meeting-bot.queue';
import app from './app';

const start = async (): Promise<void> => {
  await connectDatabase();
  await connectRedis();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server started`, {
      port: env.PORT,
      env: env.NODE_ENV,
      swagger: `http://localhost:${env.PORT}/api-docs`,
    });
  });

  startReminderScheduler();

  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      await closeBotQueue();
      logger.info('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { message: err.message, stack: err.stack });
    process.exit(1);
  });
};

start().catch((err) => {
  logger.error('Failed to start server', { message: err.message, stack: err.stack });
  process.exit(1);
});
