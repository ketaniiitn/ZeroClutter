import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import {
  isGoogleSignInRejected,
  launchMeetBrowser,
  resolveStorageStatePath,
} from './joiners/google-auth';

const waitForEnter = (): Promise<void> =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(
      'Sign in to the dedicated Google bot account in the Chrome window, then press Enter here to save the session. ',
      () => {
        rl.close();
        resolve();
      },
    );
  });

const main = async (): Promise<void> => {
  // System Chrome (not Playwright Chromium) — Google blocks automated Chromium sign-in.
  const browser = await launchMeetBrowser({ headless: false });
  const context = await browser.newContext({
    locale: 'en-US',
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  try {
    await page.goto('https://accounts.google.com/signin', {
      waitUntil: 'domcontentloaded',
    });

    if (isGoogleSignInRejected(page.url())) {
      throw new Error(
        'Google rejected this browser before sign-in. Close the window, ensure Google Chrome is installed, then run npm run google:login again.',
      );
    }

    await waitForEnter();

    if (isGoogleSignInRejected(page.url())) {
      throw new Error(
        'Google still rejected sign-in ("browser may not be secure"). Use a normal Gmail/Workspace bot account in the opened Chrome window, complete MFA, then press Enter.',
      );
    }

    await page.goto('https://myaccount.google.com/', {
      waitUntil: 'domcontentloaded',
    });
    if (page.url().includes('accounts.google.com') || isGoogleSignInRejected(page.url())) {
      throw new Error('Google login was not completed; no session was saved');
    }

    const output = resolveStorageStatePath();
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await context.storageState({ path: output });
    fs.chmodSync(output, 0o600);
    console.log(`Google bot session saved to ${output}`);
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
