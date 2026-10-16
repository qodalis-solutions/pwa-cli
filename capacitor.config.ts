import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // The Play Store package name: it can never change once published.
  appId: 'com.qodalis.cli',
  appName: 'Qodalis CLI',
  webDir: 'dist/pwa-cli/browser',
  backgroundColor: '#000000',
  android: {
    // Left unset so Chrome DevTools can inspect debug builds only.
    allowMixedContent: false,
    // Keyboards send plain key events instead of predictive composition,
    // which xterm.js garbles ("guid new" arrived as "cuidnew" with Gboard).
    // It also keeps keyboards from learning what is typed, passwords included.
    captureInput: true,
  },
  plugins: {
    SystemBars: {
      // Light icons on the black terminal; content draws edge to edge and
      // reads the --safe-area-inset-* CSS variables.
      style: 'DARK',
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
    SplashScreen: {
      // The app hides the splash as soon as the terminal is ready; this is
      // only the upper bound.
      launchAutoHide: true,
      launchShowDuration: 3000,
      backgroundColor: '#142231',
      showSpinner: false,
    },
  },
};

export default config;
