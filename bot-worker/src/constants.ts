export const BOT_STATUS = {
  PENDING: 'PENDING',
  JOINING: 'JOINING',
  WAITING_ADMISSION: 'WAITING_ADMISSION',
  IN_CALL: 'IN_CALL',
  LEFT: 'LEFT',
  FAILED: 'FAILED',
} as const;

export type BotStatus = (typeof BOT_STATUS)[keyof typeof BOT_STATUS];
