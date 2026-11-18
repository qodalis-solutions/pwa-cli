import { mkdirSync } from 'node:fs';

import { expect, Page, test } from '@playwright/test';
import sharp from 'sharp';

import { focusTerminal, openTerminal, run, terminalLines } from './terminal';

/**
 * Writes the introduction's pictures (`npm run intro-images`) into
 * public/intro: the real app running each slide's "Try it" command
 * (src/app/intro/intro.ts), cropped to the rows that matter, at phone width.
 */
test.use({ viewport: { width: 412, height: 839 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

const OUT = 'public/intro';
/** Kept small: the six pictures ship with the app. */
const WEBP = { quality: 72, effort: 6 };

/** Clears the screen without adding to the history (Ctrl+L). */
async function clearScreen(page: Page): Promise<void> {
  await focusTerminal(page);
  await page.keyboard.press('Control+l');
  await expect.poll(async () => (await visibleRows(page)).filter(Boolean).length).toBe(1);
}

/** The rows on screen. */
async function visibleRows(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const terminal = (window as any).qodalisCli.getTerminal();
    const buffer = terminal.buffer.active;
    const rows: string[] = [];
    for (let i = 0; i < terminal.rows; i++) {
      rows.push(buffer.getLine(buffer.viewportY + i)?.translateToString(true) ?? '');
    }
    return rows;
  });
}

/** Scrolls the line where `command` was typed to the top, for output longer than the screen. */
async function scrollToCommand(page: Page, command: string): Promise<void> {
  await page.evaluate((command) => {
    const terminal = (window as any).qodalisCli.getTerminal();
    const buffer = terminal.buffer.active;
    for (let i = buffer.length - 1; i >= 0; i--) {
      if (buffer.getLine(i)?.translateToString(true).endsWith(`$ ${command}`)) {
        terminal.scrollToLine(i);
        return;
      }
    }
  }, command);
  await expect.poll(async () => (await visibleRows(page))[0]).toMatch(new RegExp(`\\$ ${command}$`));
}

/**
 * Saves the top of the terminal, down to the last row with text (at most
 * `maxRows`), as public/intro/<name>.webp.
 */
async function capture(page: Page, name: string, maxRows: number, settleMs = 400): Promise<void> {
  await page.waitForTimeout(settleMs);
  const rows = await visibleRows(page);
  const filled = rows.map((r) => r.trim() !== '').lastIndexOf(true) + 1;
  const used = Math.min(maxRows, filled);
  const screen = (await page.locator('.xterm-screen').boundingBox())!;
  // The rows as drawn (DOM renderer), so the crop ends on a row's edge.
  const last = (await page.locator('.xterm-rows > div').nth(used - 1).boundingBox())!;
  const pad = 6;
  const top = Math.max(0, screen.y - pad);
  const png = await page.screenshot({
    clip: {
      x: Math.max(0, screen.x - pad),
      y: top,
      width: screen.width + pad,
      // Only the left and top are padded: below the last row the next one starts.
      height: last.y + last.height - 1 - top,
    },
  });
  mkdirSync(OUT, { recursive: true });
  await sharp(png).webp(WEBP).toFile(`${OUT}/${name}.webp`);
}

test('welcome: help', async ({ page }) => {
  await openTerminal(page);
  await clearScreen(page);
  await run(page, 'help');
  // The start of the list: the banner, the versions and the first commands.
  await scrollToCommand(page, 'help');
  await capture(page, 'welcome', 17);
});

test('getting around: history and Tab', async ({ page }) => {
  await openTerminal(page);
  await run(page, 'history clear');
  await clearScreen(page);
  await run(page, 'guid new');
  await run(page, 'echo Hello from my phone');
  await run(page, 'history');
  await expect.poll(() => terminalLines(page)).toContainEqual(expect.stringMatching(/echo Hello from my phone/));
  // Tab completes the command being typed.
  await page.keyboard.type('gen');
  await page.keyboard.press('Tab');
  await expect.poll(async () => (await visibleRows(page)).join('\n')).toMatch(/\$ generate-password\s*$/m);
  await capture(page, 'getting-around', 18);
});

test('everyday tools: generate-password', async ({ page }) => {
  await openTerminal(page);
  await clearScreen(page);
  await run(page, 'generate-password');
  await expect.poll(() => terminalLines(page)).toContainEqual(expect.stringMatching(/Generated Password/));
  await capture(page, 'everyday-tools', 6);
});

test('files: ls', async ({ page }) => {
  await openTerminal(page);
  await run(page, 'mkdir notes');
  await run(page, 'touch todo.txt');
  await run(page, 'touch notes/ideas.md');
  await clearScreen(page);
  await run(page, 'ls');
  await expect.poll(() => terminalLines(page)).toContainEqual(expect.stringMatching(/todo\.txt/));
  await capture(page, 'files', 10);
});

test('games: snake', async ({ page }) => {
  await openTerminal(page);
  await clearScreen(page);
  await run(page, 'snake', { wait: false });
  await expect.poll(async () => (await visibleRows(page)).join('\n')).toMatch(/Score:.*Best/);
  // The board alone, taken as the game starts (the snake heads for the wall); the status
  // rows below it wrap at phone width.
  const status = (await visibleRows(page)).findIndex((r) => /Score:.*Best/.test(r));
  await capture(page, 'games', status, 150);
});

test('more packages: pkg browse', async ({ page }) => {
  // Searches the npm registry: needs the network.
  await openTerminal(page);
  await clearScreen(page);
  await run(page, 'pkg browse');
  await expect.poll(() => terminalLines(page)).toContainEqual(expect.stringMatching(/Available packages/));
  await scrollToCommand(page, 'pkg browse');
  await capture(page, 'packages', 11);
});

test('make it yours: theme list', async ({ page }) => {
  await openTerminal(page);
  await clearScreen(page);
  await run(page, 'theme list');
  await scrollToCommand(page, 'theme list');
  await capture(page, 'make-it-yours', 13);
});
