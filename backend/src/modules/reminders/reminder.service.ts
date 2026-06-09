import prisma from '../../config/database';
import { sendTelegramMessage, formatReminderMessage } from '../telegram/telegram.service';
import { logger } from '../../utils/logger';

interface MeetingRelation {
  id: string;
  title: string;
}

interface OverdueItem {
  id: string;
  task: string;
  assignee: string;
  dueDate: Date | null;
  meeting: MeetingRelation;
}

export const processOverdueReminders = async (): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> => {
  const overdueItems = await prisma.actionItem.findMany({
    where: {
      status: { not: 'COMPLETED' },
      dueDate: { lt: new Date() },
    },
    include: {
      meeting: { select: { id: true, title: true } },
    },
  }) as unknown as OverdueItem[];

  if (overdueItems.length === 0) {
    logger.info('Reminder job: no overdue action items found');
    return { processed: 0, sent: 0, failed: 0 };
  }

  logger.info(`Reminder job: processing ${overdueItems.length} overdue items`);

  let sent = 0;
  let failed = 0;

  for (const item of overdueItems) {
    const message = formatReminderMessage(
      item.task,
      item.assignee,
      item.dueDate,
      item.meeting.title,
    );

    const result = await sendTelegramMessage(message);

    await prisma.reminderHistory.create({
      data: {
        actionItemId: item.id,
        channel: 'telegram',
        message,
        success: result.success,
        error: result.error || null,
      },
    });

    if (result.success) {
      sent++;
      logger.info('Reminder sent', { actionItemId: item.id, assignee: item.assignee });
    } else {
      failed++;
      logger.warn('Reminder failed', {
        actionItemId: item.id,
        assignee: item.assignee,
        error: result.error,
      });
    }
  }

  logger.info('Reminder job complete', { processed: overdueItems.length, sent, failed });
  return { processed: overdueItems.length, sent, failed };
};
