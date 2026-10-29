import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { CliProcessorsRegistry_TOKEN } from '@qodalis/cli';
import {
  CliForegroundColor,
  CliProcessCommand,
  ICliCommandProcessor,
  ICliCommandProcessorRegistry,
  ICliExecutionContext,
  ICliModule,
} from '@qodalis/cli-core';

import { platform } from './native/native-shell';

/**
 * Usage analytics, Android app only (Firebase Analytics, configured by
 * android/app/google-services.json). Firebase records installs, sessions,
 * app version, device model, OS and country by itself; the app adds one
 * event per command run with the command's name, never its arguments or
 * output. The advertising ID is not collected (AndroidManifest.xml). The PWA
 * sends nothing.
 */
export const analyticsAvailable = platform === 'android';

/**
 * The command a line runs, if it is a registered command: its first word,
 * resolved to the processor's own name (so aliases count once). Anything
 * else (a typo, text typed at the prompt by mistake) is not reported.
 */
export function commandName(line: string, registry: ICliCommandProcessorRegistry): string | undefined {
  const first = line.trim().split(/\s+/)[0];
  if (!first) return undefined;
  return registry.findProcessor(first, [])?.command;
}

/** `analytics`: whether usage analytics is on, and turning it on or off. */
export class AnalyticsCommandProcessor implements ICliCommandProcessor {
  command = 'analytics';
  description = 'Show or change whether anonymous usage analytics is sent';
  metadata = { icon: '📊', module: 'app' };
  acceptsRawInput = true;
  valueRequired = false;

  async processCommand(command: CliProcessCommand, context: ICliExecutionContext): Promise<void> {
    const { writer } = context;
    if (!analyticsAvailable) {
      writer.writeln('The web app sends no analytics. Usage analytics is only in the Android app.');
      return;
    }
    const action = command.value?.trim().toLowerCase();
    if (action === 'on' || action === 'off') {
      // Firebase keeps this setting across app restarts.
      await FirebaseAnalytics.setEnabled({ enabled: action === 'on' });
    } else if (action) {
      writer.writeError(`Unknown option "${action}". Use: analytics [on|off]`);
      return;
    }
    const { enabled } = await FirebaseAnalytics.isEnabled();
    const state = enabled
      ? writer.wrapInColor('on', CliForegroundColor.Green)
      : writer.wrapInColor('off', CliForegroundColor.Yellow);
    writer.writeln(`Usage analytics is ${state}.`);
    writer.writeln('It counts app use and the names of the commands you run, never their arguments,');
    writer.writeln('output or your files. It has no advertising ID and is not linked to your account.');
    writer.writeln(
      `Run ${writer.wrapInColor(enabled ? 'analytics off' : 'analytics on', CliForegroundColor.Cyan)} to turn it ${enabled ? 'off' : 'on'}.`,
    );
  }
}

export const analyticsModule: ICliModule = {
  apiVersion: 2,
  name: 'analytics',
  processors: [new AnalyticsCommandProcessor()],
  async onAfterBoot(context: ICliExecutionContext): Promise<void> {
    const registry = context.services.get<ICliCommandProcessorRegistry>(CliProcessorsRegistry_TOKEN);
    if (!analyticsAvailable || !registry || !context.events) {
      return;
    }
    context.events.on('command:executed', ({ data }) => {
      const command = commandName(data.command, registry);
      if (command) {
        FirebaseAnalytics.logEvent({
          name: 'command_run',
          params: { command, success: data.exitCode === 0 ? 1 : 0 },
        }).catch(() => {});
      }
    });
  },
};
