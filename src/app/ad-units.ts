/**
 * The banner every build except the Play bundle shows: Google's sample unit,
 * which serves test ads that are safe to tap. `npm run android:bundle` and
 * the CI upload build with the `play` configuration, which swaps in
 * ad-units.play.ts (angular.json).
 */
export const AD_UNITS = {
  live: false,
  banner: 'ca-app-pub-3940256099942544/9214589741',
};
