export const BOT_STATUS = {
  PENDING: 'PENDING',
  JOINING: 'JOINING',
  WAITING_ADMISSION: 'WAITING_ADMISSION',
  IN_CALL: 'IN_CALL',
  LEFT: 'LEFT',
  FAILED: 'FAILED',
} as const;

export type BotStatus = (typeof BOT_STATUS)[keyof typeof BOT_STATUS];

export const TERMINAL_STATUSES: BotStatus[] = [BOT_STATUS.LEFT, BOT_STATUS.FAILED];
