import { expect, test } from '@playwright/test';

import { openTerminal, run, terminalText } from './terminal';

test.describe('installable PWA', () => {
  test('manifest meets install and store requirements', async ({ page, request }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const res = await request.get(`/${href}`);
    expect(res.ok()).toBe(true);
    const manifest = await res.json();

    expect(manifest.name).toBe('Qodalis CLI');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.id).toBeTruthy();

    const sizes = (purpose: string) =>
      manifest.icons.filter((i: any) => i.purpose === purpose).map((i: any) => i.sizes);
    expect(sizes('any')).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(sizes('maskable')).toEqual(expect.arrayContaining(['192x192', '512x512']));

    for (const icon of manifest.icons) {
      const img = await request.get(`/${icon.src}`);
      expect(img.ok(), icon.src).toBe(true);
      expect(img.headers()['content-type']).toContain('image/png');
    }
  });

  test('works offline after the first visit', async ({ page, context }) => {
    test.setTimeout(90_000);
    await openTerminal(page);
    // The service worker registers once the app is stable, then caches the app.
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 45_000 });

    await context.setOffline(true);
    await openTerminal(page);
    await run(page, 'guid new');
    await expect.poll(() => terminalText(page)).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
    await context.setOffline(false);
  });

  test('serves the privacy policy', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByText('The app has no accounts on our servers')).toBeVisible();
  });
});
