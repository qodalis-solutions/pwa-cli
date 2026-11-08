/**
 * The release channel tagged onto the app version (`device`): none in
 * production and the PWA. The Play internal-testing bundle builds with the
 * `play-internal` configuration, which swaps in build-channel.internal.ts
 * (angular.json), so testers can tell their build from the store one.
 */
export const BUILD_CHANNEL: string = '';
