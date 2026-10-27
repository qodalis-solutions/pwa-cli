import { expect, test } from '@playwright/test';

import { completeFirstRunSetup, openTerminal, run, TEST_USER, terminalText } from './terminal';

test.describe('user account', () => {
  test('the first launch asks to create the user account', async ({ page }) => {
    await page.goto('/');
    await expect
      .poll(async () => page.locator('.xterm-rows').innerText(), { timeout: 30_000 })
      .toContain("Let's create your user account");
    await completeFirstRunSetup(page);

    await run(page, 'whoami');
    await expect.poll(() => terminalText(page)).toContain(TEST_USER.name);
  });

  test('later launches sign in without asking again', async ({ page }) => {
    await openTerminal(page);
    await page.reload();
    await page.waitForFunction(() => !!(window as any).qodalisCli, null, { timeout: 30_000 });
    expect(await terminalText(page)).not.toContain("Let's create your user account");
    await run(page, 'whoami');
    await expect.poll(() => terminalText(page)).toContain(TEST_USER.name);
  });

  test('the owner is an administrator', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'groups');
    await expect.poll(() => terminalText(page)).toContain('admin');
  });
});
