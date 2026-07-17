import { chromium, Browser, Page } from 'playwright';
import { config } from '../config';
import { BOT_STATUS } from '../constants';
import { logger } from '../logger';
import { Joiner, JoinContext, JoinerDeps } from './joiner.interface';
import { SELECTORS } from './selectors';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isVisible = async (page: Page, selector: string): Promise<boolean> =>
  page.locator(selector).first().isVisible().catch(() => false);

const waitForAdmission = async (page: Page, timeoutMs: number, isLeaveRequested: () => boolean): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (isLeaveRequested()) return false;
    if (await isVisible(page, SELECTORS.inCall)) return true;
    await sleep(2000);
  }
  return false;
};

export const googleMeetJoiner: Joiner = {
  async join(ctx: JoinContext, deps: JoinerDeps): Promise<void> {
    await deps.onStatus(BOT_STATUS.JOINING);

    const browser: Browser = await chromium.launch({
      headless: config.HEADLESS,
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
      ],
    });
    deps.setBrowser(browser);

    const context = await browser.newContext({ permissions: [] });
    const page = await context.newPage();

    await page.goto(ctx.meetingUrl, { waitUntil: 'networkidle', timeout: config.NAV_TIMEOUT_MS });

    const nameInput = page.locator(SELECTORS.nameInput).first();
    await nameInput.waitFor({ timeout: config.NAV_TIMEOUT_MS });
    await nameInput.fill(ctx.displayName);

    // Best-effort: ensure mic + camera are off before joining.
    await page.locator(SELECTORS.turnOffMic).first().click({ timeout: 2000 }).catch(() => undefined);
    await page.locator(SELECTORS.turnOffCam).first().click({ timeout: 2000 }).catch(() => undefined);

    let clicked = false;
    for (const selector of SELECTORS.joinButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) throw new Error('Join button not found (Google Meet UI may have changed)');

    await deps.onStatus(BOT_STATUS.WAITING_ADMISSION);

    const admitted = await waitForAdmission(page, config.ADMISSION_TIMEOUT_MS, deps.isLeaveRequested);
    if (!admitted) {
      if (deps.isLeaveRequested()) {
        await deps.onStatus(BOT_STATUS.LEFT, 'Left before admission');
        return;
      }
      throw new Error(`Not admitted within ${Math.round(config.ADMISSION_TIMEOUT_MS / 60000)} min`);
    }

    await deps.onStatus(BOT_STATUS.IN_CALL);
    logger.info('Bot admitted to meeting', { botId: ctx.botId });

    while (true) {
      if (deps.isLeaveRequested()) break;
      if (!(await isVisible(page, SELECTORS.inCall))) break;
      await sleep(config.IN_CALL_POLL_MS);
    }

    await deps.onStatus(BOT_STATUS.LEFT);
  },
};
