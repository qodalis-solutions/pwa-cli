import { expect, test } from '@playwright/test';

import { openTerminal, run, terminalText } from './terminal';

test.describe('device commands', () => {
  test('device shows the phone and system', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'device');
    const text = await terminalText(page);
    expect(text).toMatch(/Model\s+:/);
    expect(text).toMatch(/System\s+:/);
    expect(text).toMatch(/Platform\s+:\s+web/);
  });

  test('network says whether the phone is online', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'net');
    await expect.poll(() => terminalText(page)).toMatch(/Status\s+:\s+online/);
  });

  test('battery shows a level or says it is not available', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'battery');
    await expect.poll(() => terminalText(page)).toMatch(/\d+%|not available/);
  });

  test('vibrate takes a duration and rejects a bad one', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'vibrate 50');
    expect(await terminalText(page)).not.toMatch(/not found|must be/);
    await run(page, 'vibrate abc');
    await expect.poll(() => terminalText(page)).toContain('positive number');
  });

  test('toast shows the message on screen', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'toast Hello from the CLI');
    await expect(page.locator('.app-toast')).toHaveText('Hello from the CLI');
    await expect(page.locator('.app-toast')).toHaveCount(0, { timeout: 5_000 });
  });

  test('share needs text, typed or piped', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'share');
    await expect.poll(() => terminalText(page)).toContain('Nothing to share');
  });

  test('share hands text to the share sheet', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__shared = [];
      Object.assign(navigator, {
        canShare: () => true,
        share: async (data: unknown) => (window as any).__shared.push(data),
      });
    });
    await openTerminal(page);
    await run(page, 'share hello from the phone');
    await run(page, 'echo piped text | share --title Note');
    const shared = await page.evaluate(() => (window as any).__shared);
    expect(shared).toEqual([
      expect.objectContaining({ text: 'hello from the phone' }),
      expect.objectContaining({ text: 'piped text', title: 'Note' }),
    ]);
  });
});
