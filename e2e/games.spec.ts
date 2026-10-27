import { expect, Page, test } from '@playwright/test';

import { openTerminal, run, tapKey, terminalText } from './terminal';

const pad = (page: Page) => page.locator('app-extra-keys.game');

async function startGame(page: Page, command: string): Promise<void> {
  await openTerminal(page);
  await run(page, command, { wait: false });
  await expect(pad(page)).toBeVisible({ timeout: 10_000 });
}

/** Drags across the middle of the terminal, like a finger swipe. */
async function swipe(page: Page, dx: number, dy: number): Promise<void> {
  const box = (await page.locator('cli.terminal').boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2);
  await page.mouse.move(x + dx, y + dy);
  await page.mouse.up();
}

const textareaFocused = (page: Page) =>
  page.evaluate(() => document.activeElement?.classList.contains('xterm-helper-textarea') ?? false);

/** Whether the on-screen keyboard is suppressed (inputmode none) on the terminal's input. */
const softKeyboardHidden = (page: Page) =>
  page.evaluate(() => document.querySelector('.xterm-helper-textarea')?.getAttribute('inputmode') === 'none');

test.describe('games on touch screens', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, 'the pads are only shown on touch screens');
  });

  test('a game swaps the extra keys for its pad and closes the on-screen keyboard', async ({ page }) => {
    await startGame(page, 'tetris');
    await expect(pad(page).locator('[data-key="Rotate"]')).toBeVisible();
    await expect(pad(page).locator('[data-key="Drop"]')).toBeVisible();
    expect(await softKeyboardHidden(page)).toBe(true);
    // The terminal keeps focus, so a hardware keyboard still plays.
    expect(await textareaFocused(page)).toBe(true);

    // Big buttons, all on screen.
    const viewport = page.viewportSize()!;
    for (const button of await pad(page).getByRole('button').all()) {
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    }

    // Leaving the game brings back the extra keys and the keyboard.
    await tapKey(page, 'Escape');
    await expect(pad(page)).toHaveCount(0);
    await expect(page.locator('app-extra-keys [data-key="Control"]')).toBeVisible();
    await expect.poll(() => softKeyboardHidden(page)).toBe(false);
    expect(await textareaFocused(page)).toBe(true);
  });

  test('a hardware keyboard plays too, mixed with touch', async ({ page }) => {
    await startGame(page, '2048');
    await expect.poll(() => terminalText(page)).toMatch(/score/i);
    const before = await terminalText(page);
    for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) {
      await page.keyboard.press(key);
    }
    await pad(page).locator('[data-key="Left"]').tap();
    await swipe(page, 0, -120);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => terminalText(page)).not.toBe(before);
    expect(await textareaFocused(page)).toBe(true);
    // Esc on the keyboard quits too.
    await page.keyboard.press('Escape');
    await expect(pad(page)).toHaveCount(0);
  });

  test('pad buttons drive the game', async ({ page }) => {
    await startGame(page, '2048');
    await expect.poll(() => terminalText(page)).toMatch(/score/i);
    const before = await terminalText(page);
    for (const key of ['Left', 'Up', 'Right', 'Down', 'Left', 'Up']) {
      await pad(page).locator(`[data-key="${key}"]`).tap();
    }
    await expect.poll(() => terminalText(page)).not.toBe(before);
  });

  test('swipes on the board send arrows', async ({ page }) => {
    await startGame(page, '2048');
    await expect.poll(() => terminalText(page)).toMatch(/score/i);
    const before = await terminalText(page);
    for (const [dx, dy] of [[-120, 0], [0, -120], [120, 0], [0, 120], [-120, 0], [0, -120]]) {
      await swipe(page, dx, dy);
    }
    await expect.poll(() => terminalText(page)).not.toBe(before);
  });

  test('a tap on the board sends the game\'s tap key (minesweeper reveals)', async ({ page }) => {
    await startGame(page, 'minesweeper');
    await expect.poll(() => terminalText(page)).toMatch(/flag/i);
    const before = await terminalText(page);
    await page.locator('cli.terminal').tap();
    await expect.poll(() => terminalText(page)).not.toBe(before);
  });

  test('sudoku gets a digit row', async ({ page }) => {
    await startGame(page, 'sudoku');
    for (let d = 1; d <= 9; d++) {
      await expect(pad(page).locator(`[data-key="Digit ${d}"]`)).toBeVisible();
    }
  });

  test('wordle keeps the keyboard and the extra keys', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'wordle', { wait: false });
    await expect.poll(() => terminalText(page), { timeout: 10_000 }).toMatch(/wordle/i);
    await expect(pad(page)).toHaveCount(0);
    await expect(page.locator('app-extra-keys [data-key="Control"]')).toBeVisible();
  });
});

test('desktop: games play with the keyboard, no pad, and mouse drags are not swipes', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await openTerminal(page);
  await run(page, '2048', { wait: false });
  await expect.poll(() => terminalText(page), { timeout: 10_000 }).toMatch(/score/i);
  await expect(pad(page)).toHaveCount(0);

  const start = await terminalText(page);
  await swipe(page, -120, 0);
  await page.waitForTimeout(300);
  expect(await terminalText(page)).toBe(start);

  for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
    await page.keyboard.press(key);
  }
  await expect.poll(() => terminalText(page)).not.toBe(start);
  await page.keyboard.press('Escape');
});
