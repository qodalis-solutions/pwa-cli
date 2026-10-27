import { expect, Page, test } from '@playwright/test';

import { openTerminal, run } from './terminal';

/** The CLI's current locale and the page's lang attribute. */
async function languageState(page: Page): Promise<{ locale: string; lang: string }> {
  return page.evaluate(() => {
    const services = (window as any).qodalisCli.getContext().services;
    return {
      locale: services.get('cli-translation-service').getLocale(),
      lang: document.documentElement.lang,
    };
  });
}

test.describe('device language', () => {
  test.describe('on a German device', () => {
    test.use({ locale: 'de-DE' });

    test('starts in German and keeps it after a reload', async ({ page }) => {
      await openTerminal(page);
      expect(await languageState(page)).toEqual({ locale: 'de', lang: 'de' });

      await page.reload();
      await openTerminal(page);
      expect(await languageState(page)).toEqual({ locale: 'de', lang: 'de' });
    });

    test('keeps a language chosen in configure', async ({ page }) => {
      await openTerminal(page);
      await run(page, 'configure set system.language fr');
      await expect.poll(async () => (await languageState(page)).locale).toBe('fr');

      await page.reload();
      await openTerminal(page);
      expect((await languageState(page)).locale).toBe('fr');
    });
  });

  test.describe('on a device in a language without a pack', () => {
    test.use({ locale: 'nl-NL' });

    test('stays in English', async ({ page }) => {
      await openTerminal(page);
      expect(await languageState(page)).toEqual({ locale: 'en', lang: 'en' });
    });
  });
});
