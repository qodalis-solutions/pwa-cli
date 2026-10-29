import { expect, test } from '@playwright/test';

import { currentLine, openTerminal, run, terminalText } from './terminal';

test.describe('terminal app', () => {
  test('boots to a prompt without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    await openTerminal(page);

    expect(await terminalText(page)).toContain('Welcome to Web CLI');
    expect(errors).toEqual([]);
  });

  test('fills the screen with no sideways scrolling', async ({ page }) => {
    await openTerminal(page);
    const viewport = page.viewportSize()!;

    const shell = await page.locator('main.shell').boundingBox();
    expect(shell?.width).toBe(viewport.width);
    expect(shell?.height).toBe(viewport.height);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBe(0);
  });

  test('runs commands from bundled plugins', async ({ page }) => {
    await openTerminal(page);

    await run(page, 'guid new');
    await expect.poll(() => terminalText(page)).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);

    await run(page, 'echo hello from the phone');
    await expect.poll(() => terminalText(page)).toContain('hello from the phone');

    await run(page, 'help');
    await expect.poll(() => terminalText(page)).toMatch(/snake|tetris|2048/);
  });

  test('keeps files between sessions', async ({ page }) => {
    await openTerminal(page);
    await run(page, 'mkdir /notes');
    await run(page, 'touch /notes/today.txt');

    await page.reload();
    await openTerminal(page);
    await run(page, 'ls /notes');
    await expect.poll(() => terminalText(page)).toContain('today.txt');
  });

  test('uses the terminal colour behind the safe areas', async ({ page }) => {
    await openTerminal(page);
    const colors = await page.evaluate(() => ({
      app: getComputedStyle(document.querySelector('main.shell')!).backgroundColor,
      meta: document.querySelector('meta[name="theme-color"]')!.getAttribute('content'),
      terminal: (window as any).qodalisCli.getTerminal().options.theme?.background,
    }));
    expect(colors.meta).toBe(colors.terminal);
    expect(colors.app).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('prompt is ready for input after boot', async ({ page }) => {
    await openTerminal(page);
    expect(await currentLine(page)).toMatch(/\$\s*$/);
  });
});

test('privacy command links to the published policy', async ({ page }) => {
  await openTerminal(page);
  await run(page, 'privacy');
  const text = await terminalText(page);
  expect(text).toContain('sends usage statistics');
  expect(text).toContain('https://cli.qodalis.com/privacy/');
});

test('analytics command: the web app sends none', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await openTerminal(page);
  await run(page, 'analytics');
  expect(await terminalText(page)).toContain('The web app sends no analytics');
  expect(requests.filter((url) => /google-analytics|firebase|googletagmanager/.test(url))).toEqual([]);
});
