import { expect, test } from '@playwright/test';

import { currentLine, focusTerminal, openTerminal, run, tapKey, terminalText } from './terminal';

test.describe('extra keys row', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, 'the row is only shown on touch screens');
  });

  test('is shown on touch screens with every key reachable', async ({ page }) => {
    await openTerminal(page);
    const row = page.locator('app-extra-keys');
    await expect(row).toBeVisible();
    await expect(row.getByRole('button')).toHaveCount(12);

    // Buttons meet the 40px minimum touch target height.
    const box = await row.getByRole('button').first().boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });

  test('TAB completes a command', async ({ page }) => {
    await openTerminal(page);
    await focusTerminal(page);
    await page.keyboard.type('stopwa');
    await tapKey(page, 'Tab');
    await expect.poll(() => currentLine(page)).toContain('stopwatch');
  });

  test('arrows recall history and move the cursor', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'echo first');
    await run(page, 'echo second');

    // Walk back through history until the first command is on the line.
    for (let i = 0; i < 3 && !/echo first\s*$/.test(await currentLine(page)); i++) {
      await tapKey(page, 'Up');
    }
    await expect.poll(() => currentLine(page)).toMatch(/echo first\s*$/);

    // Insert text before the last word using the left arrow.
    for (let i = 0; i < 'first'.length; i++) {
      await tapKey(page, 'Left');
    }
    await page.keyboard.type('very ');
    await page.keyboard.press('Enter');
    await expect.poll(() => terminalText(page)).toContain('very first');
  });

  test('^C abandons the line being typed', async ({ page }) => {
    await openTerminal(page);
    await focusTerminal(page);
    await page.keyboard.type('echo never-run');
    await tapKey(page, 'Control C');
    await expect.poll(() => terminalText(page)).toContain('Ctrl+C');
    await expect.poll(() => currentLine(page)).not.toContain('never-run');
  });

  test('^L clears the screen', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'echo clutter');
    await expect.poll(() => terminalText(page)).toContain('clutter');
    await tapKey(page, 'Control L');
    await expect.poll(() => terminalText(page)).not.toContain('clutter');
  });

  test('symbol keys type characters', async ({ page }) => {
    await openTerminal(page);
    await focusTerminal(page);
    for (const key of ['Pipe', 'Slash', 'Dash', 'Tilde']) {
      await tapKey(page, key);
    }
    await expect.poll(() => currentLine(page)).toMatch(/\|\/-~\s*$/);
  });

  test('tapping a key keeps the terminal focused', async ({ page }) => {
    await openTerminal(page);
    await focusTerminal(page);
    await tapKey(page, 'Left');
    const focused = await page.evaluate(() => document.activeElement?.className ?? '');
    expect(focused).toContain('xterm-helper-textarea');
  });

  test('arrow keys drive games', async ({ page }) => {
    await openTerminal(page);
    await run(page, '2048', { wait: false });
    await expect.poll(() => terminalText(page), { timeout: 10_000 }).toMatch(/score/i);
    const before = await terminalText(page);
    for (const key of ['Left', 'Up', 'Right', 'Down', 'Left', 'Up']) {
      await tapKey(page, key);
    }
    await expect.poll(() => terminalText(page)).not.toBe(before);
    await tapKey(page, 'Escape');
  });

  test('stays above the on-screen keyboard', async ({ page }) => {
    await openTerminal(page);
    const viewport = page.viewportSize()!;
    const rowsBefore = await page.evaluate(() => (window as any).qodalisCli.getTerminal().rows);

    // A soft keyboard takes roughly the bottom 40% of the screen.
    const visible = Math.round(viewport.height * 0.6);
    await page.setViewportSize({ width: viewport.width, height: visible });

    await expect
      .poll(() => page.evaluate(() => (window as any).qodalisCli.getTerminal().rows))
      .toBeLessThan(rowsBefore);
    const row = await page.locator('app-extra-keys').boundingBox();
    expect(row!.y + row!.height).toBeLessThanOrEqual(visible);
  });
});

test('desktop browsers get the terminal without the keys row', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await openTerminal(page);
  await expect(page.locator('app-extra-keys')).toHaveCount(0);
});
