import {
  CliForegroundColor,
  CliProcessCommand,
  ICliCommandProcessor,
  ICliExecutionContext,
  ICliModule,
} from '@qodalis/cli-core';

/** The published policy; Google Play requires the app to link to it. */
export const PRIVACY_POLICY_URL = 'https://cli.qodalis.com/privacy/';

/** `privacy`: the privacy policy in brief, with a link to the full text. */
export class PrivacyCommandProcessor implements ICliCommandProcessor {
  command = 'privacy';
  description = 'Show the privacy policy';
  metadata = { icon: '🔒', module: 'app' };
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
    if (command.args['open']) {
      window.open(PRIVACY_POLICY_URL, '_blank');
    }
    writer.writeln(writer.wrapInColor('Privacy policy', CliForegroundColor.Cyan));
    writer.writeln('• The app collects no data: no accounts, analytics, ads or tracking.');
    writer.writeln('• History, settings, files and to-dos stay on this device (and in your Android backup, if you use one).');
    writer.writeln('• The network is used only by commands you run (curl, wget, speed-test).');
    writer.writeln('• The keyboard is asked not to learn what you type.');
    writer.writeln('');
    writer.writeln(`Full policy: ${writer.wrapInColor(PRIVACY_POLICY_URL, CliForegroundColor.Blue)}`);
    if (!command.args['open']) {
      writer.writeln(`Run ${writer.wrapInColor('privacy --open', CliForegroundColor.Cyan)} to open it.`);
    }
  }
}

export const appModule: ICliModule = {
  apiVersion: 2,
  name: 'app',
  processors: [new PrivacyCommandProcessor()],
};
