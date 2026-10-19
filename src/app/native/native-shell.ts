import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNative = Capacitor.isNativePlatform();

/** 'web', 'android', and later 'ios' or 'electron'. */
export const platform = Capacitor.getPlatform();

/** Per-platform integration for the native shells. */
export function initNativeShell(): void {
  if (platform === 'android') {
    // The back button sends the app to the background, keeping the session.
    App.addListener('backButton', () => App.minimizeApp());
  }
}

/** Hides the launch splash once the terminal has drawn its first prompt. */
export function hideSplash(): void {
  if (isNative) {
    SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  }
}
