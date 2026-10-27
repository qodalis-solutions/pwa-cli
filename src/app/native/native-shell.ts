import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNative = Capacitor.isNativePlatform();

/** 'web', 'android', and later 'ios' or 'electron'. */
export const platform = Capacitor.getPlatform();

/**
 * Per-platform integration for the native shells.
 *
 * @param onBack handles the Android back button first (e.g. leaving a game
 *               or prompt); returns false to send the app to the background.
 */
export function initNativeShell(onBack: () => boolean = () => false): void {
  if (platform === 'android') {
    // Otherwise the back button sends the app to the background, keeping the session.
    App.addListener('backButton', () => {
      if (!onBack()) {
        App.minimizeApp();
      }
    });
  }
}

/** Hides the launch splash once the terminal has drawn its first prompt. */
export function hideSplash(): void {
  if (isNative) {
    SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  }
}
