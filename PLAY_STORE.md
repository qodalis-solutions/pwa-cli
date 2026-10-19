# Publishing to Google Play

Everything in the repository is ready for Play: a signed Android App Bundle targeting API 36, store
listing text and images, a privacy policy and a CI pipeline. What remains are the steps only the
Play Console account owner can do.

| Item | Where |
| --- | --- |
| Package name | `com.qodalis.cli` (permanent once published) |
| App name | Qodalis CLI |
| Target / compile SDK | 36 (Android 16), minimum SDK 24 (Android 7.0) |
| Permissions | `INTERNET` (plus AndroidX's internal, signature-level receiver permission) |
| Bundle | `npm run android:bundle` → `android/app/build/outputs/bundle/release/app-release.aab` |
| Listing text and images | `fastlane/metadata/android/en-US/` |
| Privacy policy | https://cli.qodalis.com/privacy/ (web-cli `apps/docs/src/static/privacy`); a copy ships with the PWA at `/privacy.html`; in the app: `privacy` |

## 1. Upload key

Play App Signing holds the real app signing key; you sign uploads with an **upload key**. One was
created on the release machine:

- keystore: `~/.android-keystores/qodalis-cli-upload.jks` (alias `upload`, valid 10,000 days)
- passwords: `android/keystore.properties` (git-ignored)

Back both up in a password manager. If the upload key is lost, Play support can reset it (that is the
point of Play App Signing), but it takes days.

To create a new one instead:

```bash
keytool -genkeypair -v -keystore ~/.android-keystores/qodalis-cli-upload.jks -storetype PKCS12 \
  -alias upload -keyalg RSA -keysize 4096 -validity 10000
```

and write `android/keystore.properties`:

```properties
storeFile=/Users/<you>/.android-keystores/qodalis-cli-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

## 2. Create the app in Play Console

1. **Create app**: name *Qodalis CLI*, default language English (US), type *App*, *Free*.
2. **Dashboard → Set up your app**, answer as follows:
   - **Privacy policy**: `https://cli.qodalis.com/privacy/`. The app links to it from the `privacy`
     command, as Play requires.
   - **App access**: all functionality is available without special access.
   - **Ads**: the app does not contain ads.
   - **Content rating**: questionnaire category *Utility, Productivity, Communication, or Other*.
     Answer *No* to violence, sexuality, language, controlled substances and gambling. The app can
     reach the internet through `curl`/`wget` but has no user-to-user interaction or content
     sharing. Expected rating: Everyone / PEGI 3.
   - **Target audience**: 18 and over (a developer tool; avoids the Families policy).
   - **News app**: no. **COVID-19 tracing**: no. **Government app**: no.
   - **Financial features**: none. **Health**: none.
   - **Data safety**:
     - Does your app collect or share any of the required user data types? **No.**
     - Data is stored on the device only (to-do items, files, history, settings) and never sent to
       the developer, which Play does not count as collection.
     - Is all user data encrypted in transit? Not applicable (no data collected); answer per the
       form if asked.
     - Account deletion: not applicable, the app has no accounts.
3. **Store listing**: copy from `fastlane/metadata/android/en-US/`:
   - App name: `title.txt` (≤ 30 chars)
   - Short description: `short_description.txt` (≤ 80 chars)
   - Full description: `full_description.txt`
   - App icon: `images/icon.png` (512×512)
   - Feature graphic: `images/featureGraphic.png` (1024×500)
   - Phone screenshots: `images/phoneScreenshots/*.png` (1080×1920)
   - Category: *Tools*. Tags: developer tools, terminal. Contact email: required, use a support
     address you monitor.

## 3. First release (manual)

The Play API cannot create the first release, so upload the first bundle in the console:

```bash
npm run android:bundle
```

**Testing → Internal testing → Create new release**, accept Play App Signing, upload
`app-release.aab`, paste `changelogs/10000.txt` as release notes, roll out to internal testers.

**Personal developer accounts** created after November 2023 must run a **closed test with at least
12 testers for 14 consecutive days** before production access is granted. Organisation accounts are
exempt. Plan for this before the launch date.

Then promote the release to **Production** (or Closed → Production) and submit for review.

## 4. Automated uploads from CI

The `Release` workflow builds a signed bundle on every push to `main` and uploads it to the internal
testing track when the Play service account secret exists.

Repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -i ~/.android-keystores/qodalis-cli-upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | `storePassword` from `keystore.properties` |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | `keyPassword` from `keystore.properties` |
| `PLAY_SERVICE_ACCOUNT_JSON` | JSON key of a Google Cloud service account (optional) |

For the service account: Google Cloud Console → create a service account and a JSON key; Play Console
→ **Users and permissions → Invite new user** with the service account email, app access to
*Qodalis CLI*, permission *Release apps to testing tracks*.

Optional repository variable `PLAY_RELEASE_STATUS`: `draft` (default, you roll out from the console)
or `completed` (testers get it immediately).

Enable GitHub Pages once: Settings → Pages → Source: *GitHub Actions*.

## 5. Every release after that

1. Bump `version` in `package.json` (`1.0.1` → versionCode `10001`). Play rejects a bundle whose
   versionCode was already uploaded.
2. Add `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt`.
3. Merge `develop` into `main`. CI tests, publishes the PWA and uploads the bundle to internal testing.
4. Promote the release in Play Console.

## Checks done before submission

- `npm test`: Playwright suite on Pixel 7 emulation and desktop Chrome.
- Release APK installed on an Android 16 (API 36) emulator: boots in about 2.4 s with R8 minification
  on, typing through Gboard arrives exactly, extra keys and Tab completion work, the layout stays
  above the keyboard, Back closes the keyboard then backgrounds the app with the session kept.
- `apksigner verify`: signed with the upload key; `aapt2 dump badging`: target SDK 36, `INTERNET` is
  the only user-facing permission.
