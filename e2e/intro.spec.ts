import { expect, Page, test } from '@playwright/test';

import { completeFirstRunSetup, openTerminal, run, terminalText } from './terminal';

/** Collects the app's analytics events (the web app sends none; see logEvent in analytics.ts). */
async function recordEvents(page: Page): Promise<void> {
  await page.addInitScript(() => ((window as any).qodalisAnalyticsLog = []));
}

async function events(page: Page): Promise<{ name: string; params: Record<string, unknown> }[]> {
  return page.evaluate(() => (window as any).qodalisAnalyticsLog);
}

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Introduction' });
/** The slide on screen (the others are aria-hidden). */
const currentSlide = (page: Page) => dialog(page).locator('article.slide:not([aria-hidden])');

test.describe('first-run introduction', () => {
  // A fresh install: nothing in storage, not even the "seen" flag the other tests start with.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows on the first launch, over the terminal', async ({ page }) => {
    await recordEvents(page);
    await page.goto('/');

    await expect(dialog(page)).toBeVisible();
    await expect(currentSlide(page).getByRole('heading')).toHaveText('Welcome');
    await expect(dialog(page).getByRole('button', { name: 'Next' })).toBeFocused();
    await expect(page.locator('main.shell')).toHaveAttribute('inert', '');
    await expect.poll(() => events(page)).toContainEqual({ name: 'intro_shown', params: { trigger: 'first_run' } });

    const box = await dialog(page).boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  });

  test('Skip closes it, and it does not come back on the next launch', async ({ page }) => {
    await recordEvents(page);
    await page.goto('/');
    await dialog(page).getByRole('button', { name: 'Next' }).click();
    await dialog(page).getByRole('button', { name: 'Skip' }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('main.shell')).not.toHaveAttribute('inert', '');
    expect(await events(page)).toContainEqual({ name: 'intro_skipped', params: { slide: 2 } });
    await completeFirstRunSetup(page);

    await page.reload();
    await openTerminal(page);
    await expect(dialog(page)).toHaveCount(0);
  });

  test('Next leads through the six slides to Get started', async ({ page }) => {
    await recordEvents(page);
    await page.goto('/');
    const titles = ['Welcome', 'Getting around', 'Everyday tools', 'Files', 'Games', 'Make it yours'];
    for (const [i, title] of titles.entries()) {
      await expect(currentSlide(page).getByRole('heading')).toHaveText(title);
      await expect(dialog(page).locator('.dot').nth(i)).toHaveAttribute('aria-current', 'step');
      if (i > 0) {
        // Screen readers hear the slide change.
        await expect(dialog(page).locator('[aria-live]')).toHaveText(`Slide ${i + 1} of 6: ${title}`);
      }
      if (i < titles.length - 1) {
        await dialog(page).getByRole('button', { name: 'Next' }).click();
      }
    }
    await expect(dialog(page).getByRole('button', { name: 'Skip' })).toHaveCount(0);
    await dialog(page).getByRole('button', { name: 'Get started' }).click();

    await expect(dialog(page)).toBeHidden();
    expect(await events(page)).toContainEqual({ name: 'intro_completed', params: {} });
  });

  test('Try it runs the example once the terminal is ready', async ({ page }) => {
    await recordEvents(page);
    await page.goto('/');
    await dialog(page).locator('.dot').nth(3).click();
    await expect(currentSlide(page).getByRole('heading')).toHaveText('Files');
    await currentSlide(page).getByRole('button', { name: /Try it/ }).click();

    await expect(dialog(page)).toBeHidden();
    expect(await events(page)).toContainEqual({ name: 'intro_try_it', params: { slide: 4, command: 'ls' } });
    // The account setup comes first; the command runs at the first prompt.
    await completeFirstRunSetup(page);
    await expect.poll(() => terminalText(page)).toMatch(/[$#] ls$/m);
  });

  test('arrow keys turn the slides, Tab stays inside, Escape skips', async ({ page }) => {
    await page.goto('/');
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(currentSlide(page).getByRole('heading')).toHaveText('Everyday tools');
    await page.keyboard.press('ArrowLeft');
    await expect(currentSlide(page).getByRole('heading')).toHaveText('Getting around');

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('app-intro'))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
  });

  test('a swipe turns the slide', async ({ page }) => {
    await page.goto('/');
    const box = (await dialog(page).locator('.viewport').boundingBox())!;
    const y = box.y + box.height / 4;
    await page.mouse.move(box.x + box.width * 0.8, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, y, { steps: 5 });
    await page.mouse.move(box.x + box.width * 0.2, y, { steps: 5 });
    await page.mouse.up();
    await expect(currentSlide(page).getByRole('heading')).toHaveText('Getting around');
  });

  test.describe('on a German device', () => {
    test.use({ locale: 'de-DE' });

    test('speaks the device language', async ({ page }) => {
      await page.goto('/');
      const intro = page.getByRole('dialog', { name: 'Einführung' });
      await expect(intro.getByRole('heading', { name: 'Willkommen' })).toBeVisible();
      await expect(intro.getByRole('button', { name: 'Weiter' })).toBeVisible();
    });
  });
});

test('the intro command opens it again and is listed in help', async ({ page }) => {
  await recordEvents(page);
  await openTerminal(page);
  await run(page, 'help');
  expect(await terminalText(page)).toContain('intro');

  await run(page, 'intro');
  await expect(dialog(page)).toBeVisible();
  expect(await events(page)).toContainEqual({ name: 'intro_shown', params: { trigger: 'command' } });

  await dialog(page).locator('.dot').nth(4).click();
  await expect(currentSlide(page).getByRole('heading')).toHaveText('Games');
  await dialog(page).locator('.dot').nth(0).click();
  await expect(currentSlide(page).getByRole('heading')).toHaveText('Welcome');
  await currentSlide(page).getByRole('button', { name: /Try it/ }).click();
  await expect(dialog(page)).toBeHidden();
  await expect.poll(() => terminalText(page)).toMatch(/[$#] help$/m);
});
