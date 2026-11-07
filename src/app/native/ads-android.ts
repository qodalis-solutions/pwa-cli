import { AD_UNITS } from '../ad-units';
import { Ads } from '../ads';
import { platform } from './native-shell';

/** The app's ads; the AdMob plugin loads only in the Android app, the web app shows none. */
export const ads = new Ads(
  async () => (platform === 'android' ? (await import('@capacitor-community/admob')).AdMob : undefined),
  document.documentElement,
  AD_UNITS,
);
