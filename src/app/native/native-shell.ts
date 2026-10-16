import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNative = Capacitor.isNativePlatform();

/** Android integration: the back button sends the app to the background. */
export function initNativeShell(): void {
  if (!isNative) {
    return;
  }
  App.addListener('backButton', () => App.minimizeApp());
}

/** Hides the launch splash once the terminal has drawn its first prompt. */
export function hideSplash(): void {
  if (isNative) {
    SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  }
}
