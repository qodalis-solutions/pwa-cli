import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { openTerminal, run, tapKey, terminalText } from './terminal';

/**
 * Writes the Google Play listing images (`npm run screenshots`) into
 * fastlane/metadata/android/en-US/images:
 *   phoneScreenshots/*.png  1080x1920 phone screenshots (Play allows at most 2:1)
 *   featureGraphic.png      1024x500 feature graphic
 * and copies the phone screenshots into public/screenshots for the web manifest.
 */
test.use({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true });

const IMAGES = 'fastlane/metadata/android/en-US/images';

const shots: { name: string; script: (page: import('@playwright/test').Page) => Promise<void> }[] = [
  {
    name: 'phone-1',
    script: async (page) => {
      await run(page, 'help');
    },
  },
  {
    name: 'phone-2',
    script: async (page) => {
      await tapKey(page, 'Control');
      await page.keyboard.type('l');
      await run(page, 'guid new');
      await run(page, 'string upper hello from my phone');
      await run(page, 'base64 encode qodalis');
      await run(page, 'hash sha256 qodalis');
      await run(page, 'generate-password');
      await run(page, 'cal');
    },
  },
  {
    name: 'phone-3',
    script: async (page) => {
      await run(page, '2048', { wait: false });
      await expect.poll(() => terminalText(page)).toMatch(/score/i);
      for (const key of ['Left', 'Up', 'Right', 'Up', 'Left', 'Down', 'Left', 'Up']) {
        await tapKey(page, key);
      }
    },
  },
];

for (const shot of shots) {
  test(shot.name, async ({ page }) => {
    await openTerminal(page);
    await shot.script(page);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${IMAGES}/phoneScreenshots/${shot.name.replace('phone-', '')}.png` });
    await page.screenshot({ path: `public/screenshots/${shot.name}.png` });
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
