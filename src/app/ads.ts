import type { AdMobPlugin } from '@capacitor-community/admob';

/**
 * Ads, Android app only: one adaptive AdMob banner at the top of the screen,
 * below the status bar (the bottom has the extra keys and the keyboard, where
 * a banner invites accidental taps), and now and then a full-screen ad between
 * commands (see commandRun). Google's consent message (UMP) comes
 * first; without a consent decision no ad is requested. The banner hides
 * while a full-screen command (a game, nano) runs. The web app loads none of
 * this: the plugin is imported only on Android.
 */

/** The parts of the AdMob plugin the app uses. */
export type AdMobApi = Pick<
  AdMobPlugin,
  | 'initialize'
  | 'requestConsentInfo'
  | 'showConsentForm'
  | 'showPrivacyOptionsForm'
  | 'showBanner'
  | 'hideBanner'
  | 'resumeBanner'
  | 'removeBanner'
  | 'prepareInterstitial'
  | 'showInterstitial'
  | 'addListener'
>;

/** The banner's height in CSS pixels; the shell leaves that much room above the terminal. */
export const BANNER_HEIGHT_VAR = '--ad-banner-height';

/** A full-screen ad comes after this many commands... */
export const INTERSTITIAL_EVERY = 15;
/** ...at least this long after the previous one... */
export const INTERSTITIAL_GAP_MS = 5 * 60_000;
/** ...and never in the first minutes after the app opens. */
export const INTERSTITIAL_FIRST_MS = 3 * 60_000;

/** The plugin's event names and options, as strings so this file loads without the plugin. */
const SIZE_CHANGED = 'bannerAdSizeChanged';
const CONSENT_REQUIRED = 'REQUIRED';

export interface AdUnits {
  /** Whether these are the real units (the Play bundle) or Google's test units. */
  live: boolean;
  banner: string;
  interstitial: string;
}

export class Ads {
  private admob?: AdMobApi;
  private initialization?: Promise<void>;
  private canRequestAds = false;
  /** Whether the Mobile Ads SDK was started (only after consent allows ads). */
  private started = false;
  private privacyOptions = false;
  /** Whether the app wants the banner on screen (no full-screen command running). */
  private wanted = true;
  /** Whether the banner view exists: shown once, then hidden and resumed. */
  private created = false;
  private visible = false;
  /** Banner calls run one after another, so a quick hide and show cannot cross. */
  private queue: Promise<void> = Promise.resolve();
  /** Commands run since the last full-screen ad. */
  private commands = 0;
  /** When the last full-screen ad showed, or the app opened. */
  private lastFullScreen: number;
  private interstitial: 'none' | 'loading' | 'ready' = 'none';

  constructor(
    /**
     * Loads the plugin module. The module, not the plugin: Capacitor plugins answer every property,
     * `then` included, so a promise resolved with the plugin itself never settles.
     */
    private readonly load: () => Promise<{ AdMob: AdMobApi } | undefined>,
    private readonly root: { style: { setProperty(name: string, value: string): void } },
    private readonly units: AdUnits,
    private readonly now: () => number = Date.now,
  ) {
    this.lastFullScreen = now() - INTERSTITIAL_GAP_MS + INTERSTITIAL_FIRST_MS;
  }

  /** Whether the user must be offered a way to change their consent (EEA, UK, Switzerland). */
  get privacyOptionsRequired(): boolean {
    return this.privacyOptions;
  }

  /** Gathers consent, starts the Mobile Ads SDK and shows the banner. Safe to call more than once. */
  init(): Promise<void> {
    this.initialization ??= this.initialize();
    return this.initialization;
  }

  /** Shows the banner, or hides it while a full-screen command needs the whole screen. */
  setWanted(wanted: boolean): Promise<void> {
    this.wanted = wanted;
    return this.sync();
  }

  /**
   * Counts a command the user ran. Every INTERSTITIAL_EVERY commands, once the
   * last full-screen ad is INTERSTITIAL_GAP_MS old, a preloaded one shows: the
   * command has finished, so it never interrupts work, and never while a
   * full-screen command (game, nano) is open. Without a loaded ad or consent
   * the count waits for the next command.
   */
  commandRun(): Promise<void> {
    this.commands++;
    if (
      this.commands < INTERSTITIAL_EVERY ||
      this.now() - this.lastFullScreen < INTERSTITIAL_GAP_MS ||
      !this.wanted ||
      !this.canRequestAds ||
      !this.started
    ) {
      return Promise.resolve();
    }
    if (this.interstitial !== 'ready') {
      this.prepareInterstitial();
      return Promise.resolve();
    }
    this.commands = 0;
    this.lastFullScreen = this.now();
    this.interstitial = 'none';
    this.queue = this.queue
      .then(() => this.admob!.showInterstitial())
      .catch((e) => console.error(e))
      .then(() => this.prepareInterstitial());
    return this.queue;
  }

  /** Reopens Google's consent form; resolves to false when the user's region needs none. */
  async showPrivacyOptions(): Promise<boolean> {
    await this.init();
    if (!this.admob || !this.privacyOptions) {
      return false;
    }
    await this.admob.showPrivacyOptionsForm();
    await this.readConsent();
    if (this.canRequestAds) {
      await this.start();
    }
    await this.sync();
    return true;
  }

  private async initialize(): Promise<void> {
    try {
      this.admob = (await this.load())?.AdMob;
    } catch (e) {
      console.error('AdMob is not available', e);
    }
    const admob = this.admob;
    if (!admob) {
      return;
    }
    try {
      const info = await admob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === CONSENT_REQUIRED) {
        await admob.showConsentForm();
      }
      await this.readConsent();
    } catch (e) {
      // No consent message in AdMob (Privacy & messaging), or no network: without a
      // consent decision users in the EEA, UK and Switzerland may not be served ads.
      console.error('Consent gathering failed, requesting no ads', e);
      this.canRequestAds = false;
    }
    if (this.canRequestAds) {
      await this.start();
    }
    await this.sync();
  }

  private async readConsent(): Promise<void> {
    const info = await this.admob!.requestConsentInfo();
    this.canRequestAds = info.canRequestAds;
    this.privacyOptions = info.privacyOptionsRequirementStatus === CONSENT_REQUIRED;
  }

  private async start(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;
    await this.admob!.addListener(SIZE_CHANGED as never, ((size: { height: number }) =>
      this.setHeight(size.height)) as never);
    await this.admob!.initialize({ initializeForTesting: !this.units.live });
    this.prepareInterstitial();
  }

  /** Loads the next full-screen ad in the background, so it is ready when its turn comes. */
  private prepareInterstitial(): void {
    if (!this.admob || !this.canRequestAds || this.interstitial !== 'none') {
      return;
    }
    this.interstitial = 'loading';
    this.admob
      .prepareInterstitial({ adId: this.units.interstitial, isTesting: !this.units.live })
      .then(() => (this.interstitial = 'ready'))
      .catch((e) => {
        console.error('Full-screen ad failed to load', e);
        this.interstitial = 'none';
      });
  }

  private sync(): Promise<void> {
    this.queue = this.queue.then(() => this.apply()).catch((e) => console.error(e));
    return this.queue;
  }

  private async apply(): Promise<void> {
    const admob = this.admob;
    if (!admob || !this.started) {
      return;
    }
    const show = this.wanted && this.canRequestAds;
    if (show === this.visible) {
      return;
    }
    this.visible = show;
    if (!show) {
      this.setHeight(0);
      if (this.created) {
        await (this.canRequestAds ? admob.hideBanner() : this.remove(admob));
      }
      return;
    }
    if (this.created) {
      await admob.resumeBanner();
    } else {
      this.created = true;
      await admob.showBanner({
        adId: this.units.banner,
        adSize: 'ADAPTIVE_BANNER' as never,
        position: 'TOP_CENTER' as never,
        isTesting: !this.units.live,
      });
    }
  }

  private async remove(admob: AdMobApi): Promise<void> {
    this.created = false;
    await admob.removeBanner();
  }

  private setHeight(height: number): void {
    const value = this.visible ? Math.max(0, Math.ceil(height || 0)) : 0;
    this.root.style.setProperty(BANNER_HEIGHT_VAR, `${value}px`);
  }
}
