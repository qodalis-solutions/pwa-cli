import {
  CliForegroundColor,
  CliProcessCommand,
  ICliCommandProcessor,
  ICliExecutionContext,
  ICliModule,
} from '@qodalis/cli-core';

import { ads } from './native/ads-android';
import { platform } from './native/native-shell';

/** The published policy; Google Play requires the app to link to it. */
export const PRIVACY_POLICY_URL = 'https://cli.qodalis.com/privacy/';

/** `privacy`: the privacy policy in brief, with a link to the full text. */
export class PrivacyCommandProcessor implements ICliCommandProcessor {
  command = 'privacy';
  description = 'Show the privacy policy, or change your ad consent (privacy choices)';
  metadata = { icon: '🔒', module: 'app' };
  acceptsRawInput = true;
  valueRequired = false;
  parameters = [
    {
      name: 'open',
      description: 'Open the full policy in the browser',
      required: false,
      type: 'boolean',
    },
  ];

  async processCommand(command: CliProcessCommand, context: ICliExecutionContext): Promise<void> {
    const { writer } = context;
    const action = command.value?.trim().toLowerCase();
    if (action === 'choices') {
      await this.showChoices(context);
      return;
    } else if (action) {
      writer.writeError(`Unknown option "${action}". Use: privacy [choices] [--open]`);
      return;
    }
    if (command.args['open']) {
      window.open(PRIVACY_POLICY_URL, '_blank');
    }
    writer.writeln(writer.wrapInColor('Privacy policy', CliForegroundColor.Cyan));
    writer.writeln('• The Android app sends usage statistics: app use and');
    writer.writeln('  command names, never arguments, output or files.');
    writer.writeln(`  Turn them off with ${writer.wrapInColor('analytics off', CliForegroundColor.Cyan)}. The web app sends none.`);
    writer.writeln('• The Android app shows a Google AdMob banner. Google may use the advertising ID');
    writer.writeln('  and approximate location (from the IP) to show and measure ads; in the EEA, UK');
    writer.writeln('  and Switzerland it asks for your consent first. The web app has no ads.');
    if (ads.privacyOptionsRequired) {
      writer.writeln(`  Change your choice with ${writer.wrapInColor('privacy choices', CliForegroundColor.Cyan)}.`);
    }
    writer.writeln('• No online accounts; nothing else tracks you.');
    writer.writeln('• Your user account, history, settings, files and to-dos stay on this device');
    writer.writeln('  (and in your Android backup, if you use one); passwords are stored only as a hash.');
    writer.writeln('• Apart from ads and analytics, the network is used only by commands you run');
    writer.writeln('  (curl, wget, speed-test).');
    writer.writeln('• The keyboard is asked not to learn what you type.');
    writer.writeln('');
    writer.writeln(`Full policy: ${writer.wrapInColor(PRIVACY_POLICY_URL, CliForegroundColor.Blue)}`);
    if (!command.args['open']) {
      writer.writeln(`Run ${writer.wrapInColor('privacy --open', CliForegroundColor.Cyan)} to open it.`);
    }
  }

  private async showChoices(context: ICliExecutionContext): Promise<void> {
    const { writer } = context;
    if (platform !== 'android') {
      writer.writeln('The web app shows no ads, so there is no ad consent to change.');
      return;
    }
    if (!(await ads.showPrivacyOptions())) {
      writer.writeln('Ad consent choices are only needed in the EEA, the UK and Switzerland.');
      return;
    }
    writer.writeSuccess('Your ad consent choices are saved.');
  }
}

export const appModule: ICliModule = {
  apiVersion: 2,
  name: 'app',
  processors: [new PrivacyCommandProcessor()],
};
