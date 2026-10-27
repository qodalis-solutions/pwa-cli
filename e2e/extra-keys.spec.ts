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
    await expect(row.getByRole('button')).toHaveCount(14);

    // Two rows that fit the screen: every key is in view, none scrolled away.
    const viewport = page.viewportSize()!;
    const tops = new Set<number>();
    for (const button of await row.getByRole('button').all()) {
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(40);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      tops.add(Math.round(box.y));
    }
    expect(tops.size).toBe(2);
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

  test('CTRL then a letter on the keyboard sends the shortcut (Ctrl+L clears)', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'echo clutter');
    await expect.poll(() => terminalText(page)).toContain('clutter');
    await tapKey(page, 'Control');
    await expect(page.locator('[data-key="Control"]')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.type('l');
    await expect.poll(() => terminalText(page)).not.toContain('clutter');
    // One tap applies to one key only.
    await expect(page.locator('[data-key="Control"]')).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.type('ls');
    // The letter used for the shortcut is not typed as well.
    await expect.poll(() => currentLine(page)).toMatch(/[$#] ls\s*$/);
  });

  test('CTRL+A and CTRL+E move to the start and end of the line', async ({ page }) => {
    await openTerminal(page);
    await focusTerminal(page);
    await page.keyboard.type('world');
    await tapKey(page, 'Control');
    await page.keyboard.type('a');
    await page.keyboard.type('hello ');
    await tapKey(page, 'Control');
    await page.keyboard.type('e');
    await page.keyboard.type('!');
    await expect.poll(() => currentLine(page)).toMatch(/hello world!\s*$/);
  });

  test('a double tap locks CTRL until it is tapped again', async ({ page }) => {
    await openTerminal(page);
    await focusTerminal(page);
    const ctrl = page.locator('[data-key="Control"]');
    await ctrl.tap();
    await ctrl.tap();
    await expect(ctrl).toHaveClass(/modifier-locked/);
    await page.keyboard.type('abc');
    // Still locked after several keys: Ctrl+W deletes the word typed after it.
    await page.keyboard.type('w');
    await expect(ctrl).toHaveClass(/modifier-locked/);
    await ctrl.tap();
    await expect(ctrl).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.type('echo ok');
    await expect.poll(() => currentLine(page)).toMatch(/echo ok\s*$/);
  });

  test('HOME, END and DEL edit the line', async ({ page }) => {
    await openTerminal(page);
    await focusTerminal(page);
    await page.keyboard.type('Xecho home-end');
    await tapKey(page, 'Home');
    await tapKey(page, 'Delete');
    await tapKey(page, 'End');
    await page.keyboard.type('!');
    await expect.poll(() => currentLine(page)).toMatch(/[$#] echo home-end!\s*$/);
  });

  test('holding an arrow repeats it', async ({ page }) => {
    await openTerminal(page);
    await focusTerminal(page);
    await page.keyboard.type('abcdefghijklmnop');
    const left = page.locator('[data-key="Left"]');
    const box = (await left.boundingBox())!;
    // Touch down, hold, lift: one press plus the repeats.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1000);
    await page.mouse.up();
    await page.keyboard.type('|');
    const line = await currentLine(page);
    const moved = 'abcdefghijklmnop'.length - line.replace(/^.*[$#] /, '').indexOf('|');
    expect(moved).toBeGreaterThan(3);
  });

  test('symbol keys type characters', async ({ page }) => {
    await openTerminal(page);
    await focusTerminal(page);
    for (const key of ['Pipe', 'Slash', 'Dash']) {
      await tapKey(page, key);
    }
    await expect.poll(() => currentLine(page)).toMatch(/\|\/-\s*$/);
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
    await tapKey(page, 'Quit'); // the game's Esc key
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
