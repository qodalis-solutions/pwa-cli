import { expect, test } from '@playwright/test';

import {
  AdMobApi,
  Ads,
  BANNER_HEIGHT_VAR,
  INTERSTITIAL_EVERY,
  INTERSTITIAL_FIRST_MS,
  INTERSTITIAL_GAP_MS,
} from '../src/app/ads';
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
    prepareInterstitial: async (options: { adId: string }) => void calls.push(`prepareInterstitial ${options.adId}`),
    showInterstitial: async () => void calls.push('showInterstitial'),
  };
  return { admob: admob as unknown as AdMobApi, calls };
}

function root() {
  const vars: Record<string, string> = {};
  return { vars, style: { setProperty: (name: string, value: string) => void (vars[name] = value) } };
}

const UNITS = { live: false, banner: 'test-banner', interstitial: 'test-interstitial' };

/** A clock the tests move by hand. */
function clock() {
  let time = 1_000_000;
  return { now: () => time, advance: (ms: number) => void (time += ms) };
}

/** Runs n commands, letting each one's ad calls finish. */
async function runCommands(ads: Ads, n: number) {
  for (let i = 0; i < n; i++) {
    await ads.commandRun();
  }
}

const shown = (calls: string[]) => calls.filter((c) => c === 'showInterstitial').length;

test.describe('ads (Android app logic)', () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, 'plain logic, runs once'));

  test('consent comes first, then a test banner at the top, with room left for it', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true, required: true });
    const element = root();
    const ads = new Ads(async () => ({ AdMob: admob }), element, UNITS);
    await ads.init();

    expect(calls.slice(0, 3)).toEqual(['requestConsentInfo', 'showConsentForm', 'requestConsentInfo']);
    expect(calls).toContain('initialize {"initializeForTesting":true}');
    expect(calls).toContain('showBanner TOP_CENTER test-banner testing=true');
    expect(element.vars[BANNER_HEIGHT_VAR]).toBe('56px');
    expect(ads.privacyOptionsRequired).toBe(true);
  });

  test('a plugin that answers `then`, like every Capacitor plugin, still loads', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true, required: false });
    // Capacitor plugins are proxies: any property is a method, so `then` exists and never settles.
    const plugin = Object.assign(Object.create(admob), { then: () => new Promise(() => {}) });
    const ads = new Ads(async () => ({ AdMob: plugin }), root(), UNITS);
    await ads.init();

    expect(calls).toContain('showBanner TOP_CENTER test-banner testing=true');
  });

  test('no consent decision, no ads', async () => {
    for (const consent of [{ canRequestAds: false }, { canRequestAds: true, fails: true }]) {
      const { admob, calls } = fakeAdMob(consent);
      const ads = new Ads(async () => ({ AdMob: admob }), root(), UNITS);
      await ads.init();
      expect(calls.some((c) => c.startsWith('initialize') || c.startsWith('showBanner'))).toBe(false);
    }
  });

  test('a full-screen command hides the banner and gives the room back; it returns after', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const element = root();
    const ads = new Ads(async () => ({ AdMob: admob }), element, UNITS);
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
    const ads = new Ads(async () => ({ AdMob: admob }), root(), UNITS);
    await ads.setWanted(false);
    await ads.init();
    expect(calls.some((c) => c.startsWith('showBanner'))).toBe(false);
    await ads.setWanted(true);
    expect(calls.at(-1)).toMatch(/^showBanner/);
  });

  test('a full-screen ad comes after enough commands, not in the first minutes', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const time = clock();
    const ads = new Ads(async () => ({ AdMob: admob }), root(), UNITS, time.now);
    await ads.init();
    expect(calls).toContain('prepareInterstitial test-interstitial');

    await runCommands(ads, INTERSTITIAL_EVERY);
    expect(shown(calls)).toBe(0);

    time.advance(INTERSTITIAL_FIRST_MS);
    await runCommands(ads, 1);
    expect(shown(calls)).toBe(1);
    // The next one is loaded right away.
    expect(calls.filter((c) => c.startsWith('prepareInterstitial'))).toHaveLength(2);
  });

  test('full-screen ads keep their distance, however fast commands run', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const time = clock();
    const ads = new Ads(async () => ({ AdMob: admob }), root(), UNITS, time.now);
    await ads.init();
    time.advance(INTERSTITIAL_FIRST_MS);
    await runCommands(ads, INTERSTITIAL_EVERY);
    expect(shown(calls)).toBe(1);

    await runCommands(ads, INTERSTITIAL_EVERY * 3);
    expect(shown(calls)).toBe(1);
    time.advance(INTERSTITIAL_GAP_MS);
    await runCommands(ads, 1);
    expect(shown(calls)).toBe(2);
  });

  test('no full-screen ad over a game, or without consent', async () => {
    const time = clock();
    const playing = fakeAdMob({ canRequestAds: true });
    const ads = new Ads(async () => ({ AdMob: playing.admob }), root(), UNITS, time.now);
    await ads.init();
    time.advance(INTERSTITIAL_FIRST_MS);
    await ads.setWanted(false);
    await runCommands(ads, INTERSTITIAL_EVERY);
    expect(shown(playing.calls)).toBe(0);
    await ads.setWanted(true);
    await runCommands(ads, 1);
    expect(shown(playing.calls)).toBe(1);

    const refused = fakeAdMob({ canRequestAds: false });
    const noConsent = new Ads(async () => ({ AdMob: refused.admob }), root(), UNITS, time.now);
    await noConsent.init();
    time.advance(INTERSTITIAL_GAP_MS);
    await runCommands(noConsent, INTERSTITIAL_EVERY);
    expect(refused.calls.some((c) => c.includes('Interstitial'))).toBe(false);
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
