import { readFileSync } from 'node:fs';

import { expect, Page, test } from '@playwright/test';

import { focusTerminal, openTerminal, run, tapKey, terminalLines, terminalText } from './terminal';

/**
 * Writes the Google Play listing images (`npm run screenshots`) into
 * fastlane/metadata/android/en-US/images:
 *   phoneScreenshots/*.png      1080x1920 phone screenshots (Play allows at most 2:1)
 *   sevenInchScreenshots/*.png  1200x1920 7-inch tablet screenshots
 *   tenInchScreenshots/*.png    2560x1600 10-inch tablet screenshots (landscape)
 *   featureGraphic.png          1024x500 feature graphic
 * and copies the phone screenshots into public/screenshots for the web manifest.
 * pkg browse searches the npm registry, so the run needs the network.
 */

const IMAGES = 'fastlane/metadata/android/en-US/images';

const DEVICES = [
  { folder: 'phoneScreenshots', viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5, copyToPublic: true },
  { folder: 'sevenInchScreenshots', viewport: { width: 600, height: 960 }, deviceScaleFactor: 2, copyToPublic: false },
  { folder: 'tenInchScreenshots', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, copyToPublic: false },
];

/** Clears the screen without adding to the history (Ctrl+L). */
async function clearScreen(page: Page): Promise<void> {
  await focusTerminal(page);
  await page.keyboard.press('Control+l');
  // Wait for the redraw, or it can wipe the next command's output.
  await expect.poll(async () => (await visibleRows(page)).filter((r) => r.trim()).length).toBe(1);
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

/** Scrolls the last line matching `pattern` to the top, for output longer than the screen. */
async function scrollToLine(page: Page, pattern: RegExp): Promise<void> {
  await page.evaluate(
    ([source, flags]) => {
      const terminal = (window as any).qodalisCli.getTerminal();
      const buffer = terminal.buffer.active;
      const regex = new RegExp(source, flags);
      for (let i = buffer.length - 1; i >= 0; i--) {
        if (regex.test(buffer.getLine(i)?.translateToString(true) ?? '')) {
          terminal.scrollToLine(i);
          return;
        }
      }
    },
    [pattern.source, pattern.flags],
  );
}

/** Scrolls the line where `command` was typed to the top. */
async function scrollToCommand(page: Page, command: string): Promise<void> {
  await scrollToLine(page, new RegExp(`\\$ ${command}$`));
}

/**
 * One screenshot per strength of the app, in listing order; `locale` sets the browser (device)
 * language and `expect` lists output the screenshot must show. Commands stay on one row at phone
 * width: typing a command that wraps onto more rows erases as many rows of output above it
 * (a CLI line-editor bug), so longer data goes into files before the screen is cleared.
 */
const shots: { name: string; locale?: string; expect?: RegExp[]; script: (page: Page) => Promise<void> }[] = [
  {
    name: 'overview',
    expect: [/CLI\s+v\d/, /Clears the terminal/],
    script: async (page) => {
      await clearScreen(page);
      await run(page, 'help');
      await scrollToCommand(page, 'help');
    },
  },
  {
    name: 'tools',
    expect: [/^[0-9a-f]{8}-[0-9a-f]{4}-/m, /Generated Password/, /^29 30/m, /qr-code\.png/],
    script: async (page) => {
      await clearScreen(page);
      await run(page, 'string upper hello world');
      await run(page, 'base64 encode qodalis');
      await run(page, 'hash sha256 qodalis');
      await run(page, 'guid new');
      await run(page, 'generate-password');
      await run(page, 'cal');
      await run(page, 'qr generate --text=qodalis');
    },
  },
  {
    name: 'game',
    expect: [/Score:/],
    script: async (page) => {
      await run(page, '2048', { wait: false });
      await expect.poll(() => terminalText(page)).toMatch(/score/i);
      for (const key of ['Left', 'Up', 'Right', 'Up', 'Left', 'Down', 'Left', 'Up', 'Right', 'Up', 'Left', 'Up']) {
        await tapKey(page, key);
      }
    },
  },
  {
    name: 'nano',
    expect: [/Sunset at Miradouro/, /\^X Exit/],
    script: async (page) => {
      await run(page, 'nano trip.md', { wait: false });
      await expect.poll(() => terminalText(page)).toMatch(/\^X Exit/);
      await page.keyboard.type(
        '# Weekend in Lisbon\n\n## Packing\n- passport\n- charger\n- sunscreen\n\n' +
          '## Ideas\n- Tram 28 at sunrise\n- Pasteis de Belem\n- Sunset at Miradouro\n',
      );
    },
  },
  {
    name: 'charts',
    expect: [/Small steps every day/, /Fri \|/, /^\s+1\s+2\s+3/m],
    script: async (page) => {
      // Wrapped lines erase the prompts above them, which run() counts: these do not wait for one.
      await run(page, 'echo "Mon:6\\nTue:9\\nWed:7\\nThu:11\\nFri:14" > week.txt', { wait: false });
      await page.waitForTimeout(400);
      await run(page, 'echo "3\\n5\\n4\\n8\\n6\\n9\\n12\\n10\\n14" > steps.txt', { wait: false });
      await page.waitForTimeout(400);
      await run(page, 'echo "# Weekly goals\\n- **Run** three times\\n- *Read* one book\\n- Small steps *every* day" > goals.md', { wait: false });
      await page.waitForTimeout(400);
      await clearScreen(page);
      await run(page, 'cat week.txt | chart bar');
      await run(page, 'cat steps.txt | chart line');
      await run(page, 'cat goals.md | md');
    },
  },
  {
    name: 'packages',
    expect: [/Available packages/],
    script: async (page) => {
      await clearScreen(page);
      // The registry search can take a while.
      await run(page, 'pkg browse', { wait: false });
      await expect
        .poll(() => terminalLines(page), { timeout: 40_000 })
        .toContainEqual(expect.stringMatching(/Available packages/));
      await scrollToCommand(page, 'pkg browse');
    },
  },
  {
    name: 'theme',
    expect: [/brightWhite/],
    script: async (page) => {
      await run(page, 'theme apply tokyoNight');
      await run(page, 'todo add Buy concert tickets');
      await run(page, 'todo add Call the bank');
      await run(page, 'todo add Water the plants');
      await clearScreen(page);
      await run(page, 'todo ls');
      await run(page, 'theme current');
    },
  },
  {
    name: 'language',
    locale: 'de-DE',
    expect: [/spielen/, /kodieren/],
    script: async (page) => {
      await clearScreen(page);
      await run(page, 'help');
      // Encoding, charts and games, with their German descriptions.
      await scrollToLine(page, /^\s*Encoding$/);
    },
  },
];

for (const device of DEVICES) {
  test.describe(device.folder, () => {
    test.describe.configure({ retries: 3 });
    test.use({ viewport: device.viewport, deviceScaleFactor: device.deviceScaleFactor, isMobile: true, hasTouch: true });

    shots.forEach((shot, index) => {
      test.describe(shot.name, () => {
        if (shot.locale) test.use({ locale: shot.locale });

        test(`${index + 1}`, async ({ page }) => {
          test.setTimeout(90_000);
          await openTerminal(page);
          await shot.script(page);
          await page.waitForTimeout(600);
          // Guards against lost output (see the note above `shots`).
          const screen = (await visibleRows(page)).join('\n');
          for (const pattern of shot.expect ?? []) expect(screen).toMatch(pattern);
          await page.screenshot({ path: `${IMAGES}/${device.folder}/${index + 1}.png` });
          if (device.copyToPublic) await page.screenshot({ path: `public/screenshots/phone-${index + 1}.png` });
        });
      });
    });
  });
}

test('feature-graphic', async ({ page }) => {
  const icon = readFileSync('resources/icon.svg').toString('base64');
  await page.setViewportSize({ width: 1024, height: 500 });
  await page.setContent(`
    <html><body style="margin:0;width:1024px;height:500px;display:flex;align-items:center;gap:56px;
      padding:0 72px;box-sizing:border-box;background:linear-gradient(120deg,#142231 0%,#0a0e17 70%);
      font-family:ui-monospace,Menlo,monospace;color:#e6edf5">
      <img src="data:image/svg+xml;base64,${icon}" style="width:260px;height:260px;border-radius:48px">
      <div>
        <div style="font:700 64px/1.1 system-ui,sans-serif">Qodalis CLI</div>
        <div style="margin-top:18px;font-size:26px;color:#9cc7ea">A terminal in your pocket</div>
        <div style="margin-top:28px;font-size:22px;color:#6fb3e0">$ <span style="color:#e6edf5">guid new | tetris | qr</span></div>
      </div>
    </body></html>`);
  await page.screenshot({ path: `${IMAGES}/featureGraphic.png`, scale: 'css' });
});
