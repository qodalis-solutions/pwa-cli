import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Haptics } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import {
  CliForegroundColor,
  CliProcessCommand,
  ICliCommandProcessor,
  ICliExecutionContext,
  ICliModule,
} from '@qodalis/cli-core';

/**
 * Commands for the phone the app runs on. They use Capacitor plugins on
 * Android and the matching web APIs in the PWA, and need no permissions
 * beyond the plugins' install-time ones (network state, vibration).
 */
const META = { icon: '📱', module: 'device' };

/** The text of a command: its value, or what was piped into it. */
function inputText(command: CliProcessCommand): string {
  if (command.value?.trim()) return command.value.trim();
  const data = command.data;
  if (data === undefined || data === null) return '';
  return (typeof data === 'string' ? data : JSON.stringify(data, null, 2)).trim();
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** `device`: model, system and app version. */
export class DeviceCommandProcessor implements ICliCommandProcessor {
  command = 'device';
  description = 'Show the phone model, system and app version';
  metadata = META;

  async processCommand(_: CliProcessCommand, context: ICliExecutionContext): Promise<void> {
    const info = await Device.getInfo();
    const entries: [string, string][] = [
      ['Model', [info.manufacturer, info.model].filter((v) => v && v !== 'unknown').join(' ') || info.model],
      // Browsers report osVersion with the system name already in it ("Android 14")
      ['System', info.osVersion.toLowerCase().includes(info.operatingSystem) ? info.osVersion : `${info.operatingSystem} ${info.osVersion}`.trim()],
      ['Platform', info.platform],
      ['WebView', info.webViewVersion],
    ];
    if (info.memUsed) {
      entries.push(['App memory', `${Math.round(info.memUsed / 1024 / 1024)} MB`]);
    }
    if (Capacitor.isNativePlatform()) {
      const app = await App.getInfo();
      entries.push(['App', `${app.name} ${app.version} (${app.build})`]);
    }
    entries.push(['Language', (await Device.getLanguageTag()).value]);
    context.writer.writeKeyValue(entries.filter(([, v]) => !!v));
  }
}

/** `battery`: charge level and whether it is charging. */
export class BatteryCommandProcessor implements ICliCommandProcessor {
  command = 'battery';
  description = 'Show the battery level and charging state';
  metadata = META;

  async processCommand(_: CliProcessCommand, context: ICliExecutionContext): Promise<void> {
    const { writer } = context;
    const { batteryLevel, isCharging } = await Device.getBatteryInfo();
    if (batteryLevel === undefined || batteryLevel < 0) {
      writer.writeWarning('The battery level is not available on this device or browser.');
      return;
    }
    const percent = Math.round(batteryLevel * 100);
    const filled = Math.round(percent / 5);
    const color =
      percent <= 15 ? CliForegroundColor.Red : percent <= 40 ? CliForegroundColor.Yellow : CliForegroundColor.Green;
    const bar = writer.wrapInColor('█'.repeat(filled), color) + '░'.repeat(20 - filled);
    writer.writeln(`${bar} ${percent}%${isCharging ? ' ⚡ charging' : ''}`);
  }
}

/** `network`: online or offline, and the connection type. */
export class NetworkCommandProcessor implements ICliCommandProcessor {
  command = 'network';
  aliases = ['net'];
  description = 'Show whether the phone is online and how it is connected';
  metadata = META;

  async processCommand(_: CliProcessCommand, context: ICliExecutionContext): Promise<void> {
    const { writer } = context;
    const { connected, connectionType } = await Network.getStatus();
    writer.writeKeyValue([
      ['Status', connected ? writer.wrapInColor('online', CliForegroundColor.Green) : writer.wrapInColor('offline', CliForegroundColor.Red)],
      ['Connection', connectionType],
    ]);
  }
}

/** `share`: sends text, or a command's output, to another app. */
export class ShareCommandProcessor implements ICliCommandProcessor {
  command = 'share';
  description = 'Share text, or the output of a command, with another app';
  metadata = META;
  acceptsRawInput = true;
  parameters = [{ name: 'title', description: 'Title of the shared text', required: false, type: 'string' as const }];

  async processCommand(command: CliProcessCommand, context: ICliExecutionContext): Promise<void> {
    const { writer } = context;
    const text = inputText(command);
    if (!text) {
      writer.writeError('Nothing to share. Usage: share <text>, or pipe a command into it: guid new | share');
      return;
    }
    if (!(await Share.canShare()).value) {
      writer.writeError('Sharing is not available here. Copy the text instead.');
      return;
    }
    try {
      const title = command.args['title'] as string | undefined;
      const result = await Share.share({ text, ...(title ? { title } : {}) });
      writer.writeSuccess(result.activityType ? `Shared with ${result.activityType}` : 'Shared');
    } catch (e) {
      // Closing the share sheet rejects too.
      writer.writeWarning(`Not shared: ${errorMessage(e)}`);
    }
  }
}

/** `vibrate`: buzzes the phone. */
export class VibrateCommandProcessor implements ICliCommandProcessor {
  command = 'vibrate';
  description = 'Vibrate the phone (default 200 ms): vibrate 500';
  metadata = META;
  acceptsRawInput = true;
  parameters = [{ name: 'ms', description: 'Duration in milliseconds (max 5000)', required: false, type: 'number' as const }];

  async processCommand(command: CliProcessCommand, context: ICliExecutionContext): Promise<void> {
    const requested = Number(command.args['ms'] ?? command.value ?? 200);
    if (!Number.isFinite(requested) || requested <= 0) {
      context.writer.writeError('The duration must be a positive number of milliseconds.');
      return;
    }
    const duration = Math.min(requested, 5000);
    await Haptics.vibrate({ duration });
  }
}

/** `toast`: shows a short message in a system toast. */
export class ToastCommandProcessor implements ICliCommandProcessor {
  command = 'toast';
  description = 'Show a short message as a toast';
  metadata = META;
  acceptsRawInput = true;
  parameters = [{ name: 'long', description: 'Show it for longer', required: false, type: 'boolean' as const }];

  async processCommand(command: CliProcessCommand, context: ICliExecutionContext): Promise<void> {
    const text = inputText(command);
    if (!text) {
      context.writer.writeError('Usage: toast <message>');
      return;
    }
    const long = !!command.args['long'];
    if (Capacitor.isNativePlatform()) {
      await Toast.show({ text, duration: long ? 'long' : 'short' });
    } else {
      showWebToast(text, long ? 3500 : 2000);
    }
  }
}

/** The web toast of @capacitor/toast needs @ionic/pwa-elements; this is a small one of our own. */
function showWebToast(text: string, duration: number): void {
  const toast = document.createElement('div');
  toast.className = 'app-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

export const deviceModule: ICliModule = {
  apiVersion: 2,
  name: 'device',
  description: 'Phone commands: device, battery, network, share, vibrate, toast',
  processors: [
    new DeviceCommandProcessor(),
    new BatteryCommandProcessor(),
    new NetworkCommandProcessor(),
    new ShareCommandProcessor(),
    new VibrateCommandProcessor(),
    new ToastCommandProcessor(),
  ],
};
