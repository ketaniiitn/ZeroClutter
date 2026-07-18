import type { Browser } from 'playwright';

export type JoinAttemptMode = 'guest' | 'account';

export interface JoinContext {
  botId: string;
  meetingUrl: string;
  displayName: string;
}

export interface JoinerDeps {
  onStatus: (status: string, detail?: string) => Promise<void>;
  onIdentity: (botEmail: string | null) => Promise<void>;
  isLeaveRequested: () => boolean;
  setBrowser: (browser: Browser) => void;
}

export interface Joiner {
  join(ctx: JoinContext, deps: JoinerDeps): Promise<void>;
}
