# Publishing to Google Play

Everything in the repository is ready for Play: a signed Android App Bundle targeting API 36, store
listing text and images, a privacy policy and a CI pipeline. What remains are the steps only the
Play Console account owner can do.

| Item | Where |
| --- | --- |
| Package name | `com.qodalis.cli` (permanent once published) |
| App name | Qodalis CLI |
| Target / compile SDK | 36 (Android 16), minimum SDK 24 (Android 7.0) |
| Permissions | `INTERNET`; since 1.0.4 `ACCESS_NETWORK_STATE` (`network` command) and `VIBRATE` (`vibrate`), both install-time, no runtime prompt (plus AndroidX's internal, signature-level receiver permission). Firebase Analytics (since 1.0.5) adds the install-time `WAKE_LOCK` and Play install-referrer permissions; its ad permissions (`AD_ID`, `ACCESS_ADSERVICES_AD_ID`, `ACCESS_ADSERVICES_ATTRIBUTION`) are removed in the manifest |
| Analytics | Firebase project `qodalis-cli`; its config `android/app/google-services.json` is committed (it holds identifiers, not secrets: restrict the API key to `com.qodalis.cli` in Google Cloud). Events: Firebase's automatic ones plus `command_run` (`command`, `success`), see `src/app/analytics.ts`; users opt out with `analytics off` |
| Bundle | `npm run android:bundle` → `android/app/build/outputs/bundle/release/app-release.aab`; CI uploads from `develop` |
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
   - **App access** ("Is any part of your app restricted?"): **No**, all functionality is available
     without special access.
   - **Ads**: the app does not contain ads.
   - **Content rating**: questionnaire category *Utility, Productivity, Communication, or Other*.
     Answer *No* to violence, sexuality, language, controlled substances and gambling. The app can
     reach the internet through `curl`/`wget` but has no user-to-user interaction or content
     sharing. Expected rating: Everyone / PEGI 3.
   - **Target audience**: ages 13–15, 16–17 and 18 and over (students and developers). No group
     under 13, so the Families policy does not apply; turn off the "Committed to follow the Play
     Families policy" answer in Data safety. Adding an under-13 group would bring it back, with
     limits on SDKs such as Firebase Analytics.
   - **News app**: no. **COVID-19 tracing**: no. **Government app**: no.
   - **Financial features**: none. **Health**: none.
   - **Data safety**:
     - Does your app collect or share any of the required user data types? **Yes** since 1.0.5
       (Firebase Analytics, `src/app/analytics.ts`). Declare:
       - **App activity → App interactions** (app opens, commands run) and **Device or other
         IDs** (the Firebase app instance ID). For both: collected, not shared, not processed
         ephemerally, optional (users can turn it off with `analytics off`), purpose **Analytics**.
       - Not collected: location (only country, from the IP), personal info, advertising ID.
     - Data is stored on the device only (the user account, to-do items, files, history, settings)
       and never sent to the developer, which Play does not count as collection.
     - Is all user data encrypted in transit? **Yes** (Firebase uses HTTPS).
     - **Advertising ID** declaration (App content → Advertising ID): **No**, the app does not use
       it (`AD_ID` is removed in `AndroidManifest.xml`).
     - Account deletion (since 1.0.4 the first launch creates a local user account): the account
       lives only on the device; deletion is `userdel`, clearing storage or uninstalling. If the
       form asks for a deletion URL, use https://cli.qodalis.com/privacy/#delete-account.
3. **Store listing**: copy from `fastlane/metadata/android/en-US/`:
   - App name: `title.txt` (≤ 30 chars)
   - Short description: `short_description.txt` (≤ 80 chars)
   - Full description: `full_description.txt`
   - App icon: `images/icon.png` (512×512)
   - Feature graphic: `images/featureGraphic.png` (1024×500)
   - Phone screenshots: `images/phoneScreenshots/*.png` (1080×1920)
   - Category: *Tools*. Tags (at most 5, from Google's list): *Tools*, *Productivity*, *Network
     connectivity*, *Clock, alarm & timer*, *Notebook*. Contact email: required, use a support
     address you monitor.
   - The images can also be pushed with `fastlane listing images_only:true`; `fastlane listing` pushes
     the text too (title from `title.txt`: *Qodalis CLI: Offline Terminal*).

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

## 4. Testers

Who can install test builds is set only in Play Console; the Play API cannot read the email lists.

1. **Testing → Internal testing → Testers**: create an email list with the testers' Google accounts,
   **tick it** and save. Creating the list is not enough.
2. Under **How testers join your test**, copy the **Join on the web** link and send it to testers.
3. Each tester opens it in Chrome, signed in with the listed account, taps **Accept invite**, then
   **download it on Google Play**.

"Not found" on the phone means the account is not on a ticked list, or the Play Store app is signed
in with another account (switch it under the avatar). A brand-new app or list can take 10–15 minutes
to show up.

Internal testing skips review ("Not reviewed" next to a release is normal). Open testing and
production go through Google's review, from hours to days for a new app.

## 5. Release flow: develop for testers, main for production

| Push to | CI does | Who gets it |
| --- | --- | --- |
| pull request | build, Playwright tests, debug APK | nobody |
| `develop` | tests, then builds a signed bundle and uploads it to **internal testing**, rolled out | internal testers, minutes later |
| `main` | tests, PWA to GitHub Pages, then **promotes the tested internal build** to production | everyone, after Google's review |

Production gets exactly the bundle testers had: `main` never rebuilds. The `production` lane looks
for the internal build whose version matches `package.json`, and stops with an error if develop has
not uploaded it yet. If production already has it (a docs-only merge, a re-run), it does nothing.

Every develop upload takes the next free versionCode from Play (`fastlane status` prints it), so
several builds of one version can go to testers. Release notes are still named after the version:
`changelogs/10203.txt` for 1.2.3.

Repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -i ~/.android-keystores/qodalis-cli-upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | `storePassword` from `keystore.properties` |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | `keyPassword` from `keystore.properties` |
| `PLAY_SERVICE_ACCOUNT_JSON` | JSON key of the Google Cloud service account |

For the service account: Google Cloud Console → create a service account and a JSON key; Play Console
→ **Users and permissions → Invite new user** with the service account email, app access to
*Qodalis CLI*, permissions *Release to production* and *Release apps to testing tracks*.

Optional repository variable `PLAY_PRODUCTION_ROLLOUT`: a fraction such as `0.2` for a staged
rollout to 20% of users (widen it with `fastlane promote from:production to:production rollout:0.5`).
Unset means everyone.

The upload and promotion jobs run in the GitHub environments `play-internal` and `play-production`.
Add a required reviewer to `play-production` (Settings → Environments) to approve each production
release by hand.

Enable GitHub Pages once: Settings → Pages → Source: *GitHub Actions*.

## 6. Every release

1. On a feature branch, bump `version` in `package.json` and add
   `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt` (1.0.3 → `10003.txt`, at most 500
   characters). Merge it into `develop`: testers get the build.
2. Test it on a phone. Further merges into `develop` upload new builds of the same version.
3. Fast-forward `main` to `develop` (no release pull request), once `develop`'s CI has passed:
   `git fetch origin && git push origin origin/develop:refs/heads/main`. CI promotes the tested
   build to production. `main` and `develop` keep one linear history: the **main history** ruleset
   blocks force pushes and anything but a fast-forward, for everyone; **main changes** (pull request
   and checks) lets admins push the release directly.

## Play API notes

- Uploads and promotions report success before Google processes them. To see the real state of each
  track (status and version codes), use `fastlane status` or check Play Console.
- A draft release is rolled out with `fastlane rollout`, which promotes the release onto its own
  track. Passing `release_status: completed` with only a version code reports success but leaves the
  draft untouched.
- The service account key for local fastlane runs is
  `~/.android-keystores/qodalis-cli-play-publisher.json` (override with `PLAY_JSON_KEY`). It needs
  the *Release to production* and *Release apps to testing tracks* permissions.

## Checks done before submission

- `npm test`: Playwright suite on Pixel 7 emulation and desktop Chrome.
- Release APK installed on an Android 16 (API 36) emulator: boots in about 2.4 s with R8 minification
  on, typing through Gboard arrives exactly, extra keys and Tab completion work, the layout stays
  above the keyboard, Back closes the keyboard, leaves a game or prompt (Escape), then backgrounds the app with the session kept.
- `apksigner verify`: signed with the upload key; `aapt2 dump badging`: target SDK 36, `INTERNET` is
  the only user-facing permission (up to 1.0.3; 1.0.4 adds the install-time `ACCESS_NETWORK_STATE` and `VIBRATE`).
