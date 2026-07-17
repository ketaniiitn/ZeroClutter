import type { Browser } from 'playwright';

export interface ActiveSession {
  browser: Browser | null;
  leaveRequested: boolean;
}

const sessions = new Map<string, ActiveSession>();

export const register = (botId: string): ActiveSession => {
  const session: ActiveSession = { browser: null, leaveRequested: false };
  sessions.set(botId, session);
  return session;
};

export const markLeave = (botId: string): boolean => {
  const session = sessions.get(botId);
  if (!session) return false;
  session.leaveRequested = true;
  return true;
};

export const unregister = (botId: string): void => {
  sessions.delete(botId);
};

export const getActiveBotIds = (): string[] => Array.from(sessions.keys());

export const closeAll = async (): Promise<void> => {
  for (const session of sessions.values()) {
    try {
      await session.browser?.close();
    } catch {
      // ignore cleanup errors
    }
  }
  sessions.clear();
};
