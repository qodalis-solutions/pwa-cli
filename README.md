# Qodalis CLI for phones

The [Qodalis CLI](https://cli.qodalis.com) as a mobile app: an offline terminal with 100+ commands,
a file system, an editor and terminal games. It ships two ways from one codebase:

- **PWA**: installable from the browser, works offline through a service worker.
- **Android app**: the same build wrapped with [Capacitor](https://capacitorjs.com) and published to
  Google Play as `com.qodalis.cli`.

Built with Angular 22, `@qodalis/angular-cli` 2.x and Capacitor 8 (Android target SDK 36).

## Mobile features

- **Extra keys row** on touch screens: Esc, Tab, Ctrl+C, Ctrl+L, arrows, `-` `/` `|` `~`. Keys are
  delivered as real key presses, so terminal shortcuts and games work.
- **Keyboard-aware layout**: the terminal shrinks above the on-screen keyboard
  (`interactive-widget=resizes-content` plus a `visualViewport` fallback for iOS).
- **Edge to edge**: content respects notches and the navigation bar via `env(safe-area-inset-*)` and
  the `--safe-area-inset-*` variables Capacitor's SystemBars injects on Android.
- **No autocorrect on Android**: `captureInput` makes keyboards send plain key events, so commands
  arrive exactly as typed and keyboards don't learn what you type.
- **Back button** closes the keyboard, then sends the app to the background (the session is kept).
- The safe areas and browser chrome follow the terminal theme colour.

The bundled plugins are listed in [`src/app/cli-modules.ts`](src/app/cli-modules.ts). All of them run
on the device; none needs a CLI server.

## Development

Requires Node 22.22+/24.15+. Android builds also need JDK 21 (or 17) and the Android SDK.

```bash
npm install
npm start                 # dev server on http://localhost:4310
npm run build             # production build in dist/pwa-cli/browser
npm run serve:dist        # serve the production build (service worker enabled) on :8080
```

## Tests

End-to-end tests use Playwright against the production build, on an emulated Pixel 7 and on desktop
Chrome:

```bash
npm run build
npx playwright install chromium   # once
npm test
```

They cover boot, running plugin commands, file persistence, the extra keys (Tab completion, history,
Ctrl+C, Ctrl+L, symbols, focus, games), the layout with the keyboard open, the web manifest, offline
use through the service worker and the privacy page.

## Android

```bash
npm run android:apk       # debug APK: android/app/build/outputs/apk/debug/app-debug.apk
npm run android:bundle    # signed release bundle: android/app/build/outputs/bundle/release/app-release.aab
npm run android:open      # open the project in Android Studio
```

`scripts/gradlew.sh` runs Gradle on JDK 21/17 even when a newer JDK is the default. The release
bundle is signed with the upload key from `android/keystore.properties` (git-ignored) or the
`ANDROID_KEYSTORE_*` environment variables.

The version shown in the store comes from `package.json`; `versionCode` is derived from it
(`1.2.3` → `10203`). Bump the version before every Play upload.

## Store assets

```bash
npm run assets        # icons, adaptive icons and splash from resources/logo.png
npm run screenshots   # Play screenshots + feature graphic (needs a production build)
```

Listing text and images live in [`fastlane/metadata/android/en-US`](fastlane/metadata/android/en-US).
The privacy policy lives at https://cli.qodalis.com/privacy/ (source in web-cli,
`apps/docs/src/static/privacy`); [`public/privacy.html`](public/privacy.html) is the copy shipped with
the PWA, and the `privacy` command shows it in the app. Keep the two in sync.

Publishing steps, Play Console answers and CI secrets: [PLAY_STORE.md](PLAY_STORE.md).

## CI

- `ci.yml`: pull requests and `develop`: build, Playwright tests, Android debug APK.
- `release.yml`: pushes to `main`: tests, PWA to GitHub Pages, signed bundle, and upload to the Play
  internal testing track when `PLAY_SERVICE_ACCOUNT_JSON` is set.
