import { expect, Page, test } from '@playwright/test';

import { openTerminal, run } from './terminal';

/** Drags a finger across the terminal with real touch events, `steps` moves long. */
async function drag(page: Page, dy: number, steps = 12): Promise<void> {
  const box = (await page.locator('cli.terminal').boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2 - dy / 2;
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', points: { x: number; y: number }[]) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  await touch('touchStart', [{ x, y }]);
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', [{ x, y: y + (dy * i) / steps }]);
  }
  await touch('touchEnd', []);
}

/** How many rows the terminal is scrolled up from the bottom of its output. */
const rowsAboveBottom = (page: Page) =>
  page.evaluate(() => {
    const buffer = (window as any).qodalisCli.getTerminal().buffer.active;
    return buffer.baseY - buffer.viewportY;
  });

test.describe('touch scrolling', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch screens only');

  test('a finger drag scrolls back through long output and down again', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'help');
    expect(await rowsAboveBottom(page)).toBe(0);

    await drag(page, 300);
    await expect.poll(() => rowsAboveBottom(page)).toBeGreaterThan(5);

    const above = await rowsAboveBottom(page);
    for (let i = 0; i < 6 && (await rowsAboveBottom(page)) > 0; i++) {
      await drag(page, -400);
    }
    expect(above).toBeGreaterThan(0);
    await expect.poll(() => rowsAboveBottom(page)).toBe(0);
  });

  test('a scroll leaves the keyboard setting as it was', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'help');

    await drag(page, 300);
    // inputmode=none only holds the keyboard back while the finger scrolls.
    await expect
      .poll(() => page.evaluate(() => document.querySelector('.xterm-helper-textarea')?.hasAttribute('inputmode')))
      .toBe(false);
  });
});
