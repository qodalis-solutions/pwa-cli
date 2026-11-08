import { CliProcessorsRegistry_TOKEN } from '@qodalis/cli';
import { ICliCommandProcessorRegistry, ICliExecutionContext, ICliModule } from '@qodalis/cli-core';

import { AD_UNITS } from '../ad-units';
import { Ads } from '../ads';
import { commandName } from '../analytics';
import { platform } from './native-shell';

/** The app's ads; the AdMob plugin loads only in the Android app, the web app shows none. */
export const ads = new Ads(
  async () => (platform === 'android' ? import('@capacitor-community/admob') : undefined),
  document.documentElement,
  AD_UNITS,
);

/** Counts the commands the user runs for the full-screen ads (registered commands only, not typos). */
export const adsModule: ICliModule = {
  apiVersion: 2,
  name: 'ads',
  async onAfterBoot(context: ICliExecutionContext): Promise<void> {
    const registry = context.services.get<ICliCommandProcessorRegistry>(CliProcessorsRegistry_TOKEN);
    if (platform !== 'android' || !registry || !context.events) {
      return;
    }
    context.events.on('command:executed', ({ data }) => {
      if (commandName(data.command, registry)) {
        ads.commandRun();
      }
    });
  },
};
