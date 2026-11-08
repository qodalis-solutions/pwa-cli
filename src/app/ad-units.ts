/**
 * The ads every build except the Play production bundle shows: Google's
 * sample units, which serves test ads that are safe to tap. Internal-testing
 * bundles (`play-internal`) keep it too, so testers never tap the real unit.
 * `npm run android:bundle` and the CI production build use the `play`
 * configuration, which swaps in ad-units.play.ts (angular.json).
 */
export const AD_UNITS = {
  live: false,
  banner: 'ca-app-pub-3940256099942544/9214589741',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
};
