import TelegramBot from 'node-telegram-bot-api';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

let bot: TelegramBot | null = null;

const getBot = (): TelegramBot => {
  if (!bot) {
    bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: false });
  }
  return bot;
};

export const sendTelegramMessage = async (
  message: string,
  chatId?: string,
): Promise<{ success: boolean; error?: string }> => {
  const targetChatId = chatId || env.TELEGRAM_CHAT_ID;

  try {
    const telegramBot = getBot();
    await telegramBot.sendMessage(targetChatId, message, {
      parse_mode: 'Markdown',
    });

    logger.info('Telegram message sent', {
      chatId: targetChatId,
      messageLength: message.length,
    });

    return { success: true };
  } catch (err) {
    const error = (err as Error).message;
    logger.error('Failed to send Telegram message', {
      chatId: targetChatId,
      error,
    });
    return { success: false, error };
  }
};

export const formatReminderMessage = (
  task: string,
  assignee: string,
  dueDate: Date | null,
  meetingTitle: string,
): string => {
  const dueDateStr = dueDate
    ? dueDate.toISOString().split('T')[0]
    : 'No due date set';

  return (
    `*Overdue Action Item Reminder* ⚠️\n\n` +
    `*Task:* ${task}\n` +
    `*Assigned To:* ${assignee}\n` +
    `*Due Date:* ${dueDateStr}\n` +
    `*Meeting:* ${meetingTitle}\n\n` +
    `_This action item is overdue. Please update its status._`
  );
};
