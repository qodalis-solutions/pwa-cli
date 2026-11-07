import { expect, test } from '@playwright/test';

import { AdMobApi, Ads, BANNER_HEIGHT_VAR } from '../src/app/ads';
import { openTerminal, run, terminalText } from './terminal';

/** A stand-in for the AdMob plugin that records the calls the app makes. */
function fakeAdMob(consent: { canRequestAds: boolean; required?: boolean; fails?: boolean }) {
  const calls: string[] = [];
  let sizeListener: ((size: { height: number }) => void) | undefined;
  const info = () => ({
    canRequestAds: consent.canRequestAds,
    status: consent.required ? 'REQUIRED' : 'NOT_REQUIRED',
    isConsentFormAvailable: !!consent.required,
    privacyOptionsRequirementStatus: consent.required ? 'REQUIRED' : 'NOT_REQUIRED',
  });
  const admob = {
    requestConsentInfo: async () => {
      calls.push('requestConsentInfo');
      if (consent.fails) throw new Error('no consent message');
      return info();
    },
    showConsentForm: async () => (calls.push('showConsentForm'), info()),
    showPrivacyOptionsForm: async () => void calls.push('showPrivacyOptionsForm'),
    initialize: async (options: unknown) => void calls.push(`initialize ${JSON.stringify(options)}`),
    addListener: async (event: string, listener: (size: { height: number }) => void) => {
      if (event === 'bannerAdSizeChanged') sizeListener = listener;
      return { remove: async () => {} };
    },
    showBanner: async (options: { adId: string; position: string; isTesting: boolean }) => {
      calls.push(`showBanner ${options.position} ${options.adId} testing=${options.isTesting}`);
      sizeListener?.({ height: 56 });
    },
    hideBanner: async () => (calls.push('hideBanner'), sizeListener?.({ height: 0 })),
    resumeBanner: async () => (calls.push('resumeBanner'), sizeListener?.({ height: 56 })),
    removeBanner: async () => void calls.push('removeBanner'),
  };
  return { admob: admob as unknown as AdMobApi, calls };
}

function root() {
  const vars: Record<string, string> = {};
  return { vars, style: { setProperty: (name: string, value: string) => void (vars[name] = value) } };
}

const UNITS = { live: false, banner: 'test-banner' };

test.describe('ads (Android app logic)', () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, 'plain logic, runs once'));

  test('consent comes first, then a test banner at the top, with room left for it', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true, required: true });
    const element = root();
    const ads = new Ads(async () => admob, element, UNITS);
    await ads.init();

    expect(calls.slice(0, 3)).toEqual(['requestConsentInfo', 'showConsentForm', 'requestConsentInfo']);
    expect(calls).toContain('initialize {"initializeForTesting":true}');
    expect(calls).toContain('showBanner TOP_CENTER test-banner testing=true');
    expect(element.vars[BANNER_HEIGHT_VAR]).toBe('56px');
    expect(ads.privacyOptionsRequired).toBe(true);
  });

  test('no consent decision, no ads', async () => {
    for (const consent of [{ canRequestAds: false }, { canRequestAds: true, fails: true }]) {
      const { admob, calls } = fakeAdMob(consent);
      const ads = new Ads(async () => admob, root(), UNITS);
      await ads.init();
      expect(calls.some((c) => c.startsWith('initialize') || c.startsWith('showBanner'))).toBe(false);
    }
  });

  test('a full-screen command hides the banner and gives the room back; it returns after', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const element = root();
    const ads = new Ads(async () => admob, element, UNITS);
    await ads.init();

    await ads.setWanted(false);
    expect(calls.at(-1)).toBe('hideBanner');
    expect(element.vars[BANNER_HEIGHT_VAR]).toBe('0px');

    await ads.setWanted(true);
    expect(calls.at(-1)).toBe('resumeBanner');
    expect(element.vars[BANNER_HEIGHT_VAR]).toBe('56px');
    expect(calls.filter((c) => c.startsWith('showBanner'))).toHaveLength(1);
  });

  test('a game started before the ads are ready gets no banner until it exits', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const ads = new Ads(async () => admob, root(), UNITS);
    await ads.setWanted(false);
    await ads.init();
    expect(calls.some((c) => c.startsWith('showBanner'))).toBe(false);
    await ads.setWanted(true);
    expect(calls.at(-1)).toMatch(/^showBanner/);
  });

  test('the web app loads no ad plugin and has no consent choices', async () => {
    const ads = new Ads(async () => undefined, root(), UNITS);
    await ads.init();
    await ads.setWanted(true);
    expect(await ads.showPrivacyOptions()).toBe(false);
  });
});

test('the web app shows no ads and leaves no room for a banner', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await openTerminal(page);

  const banner = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ad-banner-height'));
  expect(banner).toBe('');
  await run(page, 'privacy choices');
  await expect.poll(() => terminalText(page)).toContain('The web app shows no ads');
  expect(requests.filter((url) => /googlesyndication|doubleclick|googleads|admob/.test(url))).toEqual([]);
});
