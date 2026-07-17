import type { Browser } from 'playwright';

export interface JoinContext {
  botId: string;
  meetingUrl: string;
  displayName: string;
}

export interface JoinerDeps {
  onStatus: (status: string, detail?: string) => Promise<void>;
  isLeaveRequested: () => boolean;
  setBrowser: (browser: Browser) => void;
}

export interface Joiner {
  join(ctx: JoinContext, deps: JoinerDeps): Promise<void>;
}
