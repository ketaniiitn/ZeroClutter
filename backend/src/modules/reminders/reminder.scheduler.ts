import cron from 'node-cron';
import { processOverdueReminders } from './reminder.service';
import { logger } from '../../utils/logger';

// Runs every hour at minute 0
const REMINDER_SCHEDULE = '0 * * * *';

export const startReminderScheduler = (): void => {
  if (!cron.validate(REMINDER_SCHEDULE)) {
    logger.error('Invalid cron schedule expression', { schedule: REMINDER_SCHEDULE });
    return;
  }

  cron.schedule(REMINDER_SCHEDULE, async () => {
    logger.info('Reminder scheduler triggered', { schedule: REMINDER_SCHEDULE });

    try {
      const result = await processOverdueReminders();
      logger.info('Reminder scheduler completed', result);
    } catch (err) {
      logger.error('Reminder scheduler encountered an error', {
        error: (err as Error).message,
        stack: (err as Error).stack,
      });
    }
  });

  logger.info('Reminder scheduler started', { schedule: REMINDER_SCHEDULE });
};
