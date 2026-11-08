import { expect, test } from '@playwright/test';

import {
  AdMobApi,
  Ads,
  BANNER_DELAY_MS,
  BANNER_HEIGHT_VAR,
  INTERSTITIAL_EVERY,
  INTERSTITIAL_FIRST_MS,
  INTERSTITIAL_GAP_MS,
  INTERSTITIAL_IDLE_MS,
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

/** A clock the tests move by hand; timers run when it passes them. */
function clock() {
  let time = 1_000_000;
  const timers: { at: number; fn: () => unknown }[] = [];
  return {
    now: () => time,
    after: (ms: number, fn: () => unknown) => void timers.push({ at: time + ms, fn }),
    async advance(ms: number) {
      time += ms;
      for (const timer of timers.filter((t) => t.at <= time)) {
        timers.splice(timers.indexOf(timer), 1);
        await timer.fn();
      }
      // Let the banner queue settle.
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
  };
}

/** Ads with a fake clock, initialized; the banner's delay not yet passed. */
async function startAds(admob: AdMobApi, element = root()) {
  const time = clock();
  const ads = new Ads(async () => ({ AdMob: admob }), element, UNITS, time);
  await ads.init();
  return { ads, time, element };
}

/** Ads past the banner delay and the first minutes, ready for full-screen ads. */
async function settledAds(admob: AdMobApi) {
  const started = await startAds(admob);
  await started.time.advance(INTERSTITIAL_FIRST_MS);
  return started;
}

function runCommands(ads: Ads, n: number) {
  for (let i = 0; i < n; i++) {
    ads.commandRun();
  }
}

const shown = (calls: string[]) => calls.filter((c) => c === 'showInterstitial').length;

test.describe('ads (Android app logic)', () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, 'plain logic, runs once'));

  test('consent comes first, then, after a minute, a test banner at the top with room left for it', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true, required: true });
    const { ads, time, element } = await startAds(admob);

    expect(calls.slice(0, 3)).toEqual(['requestConsentInfo', 'showConsentForm', 'requestConsentInfo']);
    expect(calls).toContain('initialize {"initializeForTesting":true}');
    expect(calls.some((c) => c.startsWith('showBanner'))).toBe(false);
    expect(element.vars[BANNER_HEIGHT_VAR] ?? '0px').toBe('0px');

    await time.advance(BANNER_DELAY_MS);
    expect(calls).toContain('showBanner TOP_CENTER test-banner testing=true');
    expect(element.vars[BANNER_HEIGHT_VAR]).toBe('56px');
    expect(ads.privacyOptionsRequired).toBe(true);
  });

  test('a plugin that answers `then`, like every Capacitor plugin, still loads', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true, required: false });
    // Capacitor plugins are proxies: any property is a method, so `then` exists and never settles.
    const plugin = Object.assign(Object.create(admob), { then: () => new Promise(() => {}) });
    const { time } = await startAds(plugin);
    await time.advance(BANNER_DELAY_MS);

    expect(calls).toContain('showBanner TOP_CENTER test-banner testing=true');
  });

  test('no consent decision, no ads', async () => {
    for (const consent of [{ canRequestAds: false }, { canRequestAds: true, fails: true }]) {
      const { admob, calls } = fakeAdMob(consent);
      const { ads, time } = await startAds(admob);
      await time.advance(INTERSTITIAL_GAP_MS);
      runCommands(ads, INTERSTITIAL_EVERY);
      await time.advance(INTERSTITIAL_IDLE_MS);
      expect(calls.some((c) => /^(initialize|showBanner|prepareInterstitial|showInterstitial)/.test(c))).toBe(false);
    }
  });

  test('a full-screen command hides the banner and gives the room back; it returns after', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const { ads, time, element } = await startAds(admob);
    await time.advance(BANNER_DELAY_MS);

    await ads.setWanted(false);
    expect(calls.at(-1)).toBe('hideBanner');
    expect(element.vars[BANNER_HEIGHT_VAR]).toBe('0px');

    await ads.setWanted(true);
    expect(calls.at(-1)).toBe('resumeBanner');
    expect(element.vars[BANNER_HEIGHT_VAR]).toBe('56px');
    expect(calls.filter((c) => c.startsWith('showBanner'))).toHaveLength(1);
  });

  test('a game open when the banner is due keeps it away until it exits', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const { ads, time } = await startAds(admob);
    await ads.setWanted(false);
    await time.advance(BANNER_DELAY_MS);
    expect(calls.some((c) => c.startsWith('showBanner'))).toBe(false);
    await ads.setWanted(true);
    expect(calls.filter((c) => c.startsWith('showBanner'))).toHaveLength(1);
  });

  test('a full-screen ad comes after enough commands and a pause, not in the first minutes', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const { ads, time } = await startAds(admob);
    expect(calls).toContain('prepareInterstitial test-interstitial');

    runCommands(ads, INTERSTITIAL_EVERY);
    await time.advance(INTERSTITIAL_IDLE_MS);
    expect(shown(calls)).toBe(0);

    await time.advance(INTERSTITIAL_FIRST_MS);
    runCommands(ads, 1);
    await time.advance(INTERSTITIAL_IDLE_MS - 1);
    expect(shown(calls)).toBe(0);
    await time.advance(1);
    expect(shown(calls)).toBe(1);
    // The next one is loaded right away.
    expect(calls.filter((c) => c.startsWith('prepareInterstitial'))).toHaveLength(2);
  });

  test('typing or touching during the pause puts the full-screen ad off to a later command', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const { ads, time } = await settledAds(admob);
    runCommands(ads, INTERSTITIAL_EVERY);
    await time.advance(INTERSTITIAL_IDLE_MS / 2);
    ads.userActive();
    await time.advance(INTERSTITIAL_IDLE_MS);
    expect(shown(calls)).toBe(0);

    runCommands(ads, 1);
    await time.advance(INTERSTITIAL_IDLE_MS);
    expect(shown(calls)).toBe(1);
  });

  test('full-screen ads keep their distance, however fast commands run', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const { ads, time } = await settledAds(admob);
    runCommands(ads, INTERSTITIAL_EVERY);
    await time.advance(INTERSTITIAL_IDLE_MS);
    expect(shown(calls)).toBe(1);

    runCommands(ads, INTERSTITIAL_EVERY * 3);
    await time.advance(INTERSTITIAL_IDLE_MS);
    expect(shown(calls)).toBe(1);
    await time.advance(INTERSTITIAL_GAP_MS);
    runCommands(ads, 1);
    await time.advance(INTERSTITIAL_IDLE_MS);
    expect(shown(calls)).toBe(2);
  });

  test('no full-screen ad over a game, even one opened during the pause', async () => {
    const { admob, calls } = fakeAdMob({ canRequestAds: true });
    const { ads, time } = await settledAds(admob);
    runCommands(ads, INTERSTITIAL_EVERY);
    await ads.setWanted(false);
    await time.advance(INTERSTITIAL_IDLE_MS);
    expect(shown(calls)).toBe(0);

    runCommands(ads, 1);
    await time.advance(INTERSTITIAL_IDLE_MS);
    expect(shown(calls)).toBe(0);
    await ads.setWanted(true);
    runCommands(ads, 1);
    await time.advance(INTERSTITIAL_IDLE_MS);
    expect(shown(calls)).toBe(1);
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
