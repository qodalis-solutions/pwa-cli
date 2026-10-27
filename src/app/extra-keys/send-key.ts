import type { CliEngine } from '@qodalis/cli';

import { ExtraKey, KeyPress } from './extra-keys';

type Terminal = ReturnType<CliEngine['getTerminal']>;

/**
 * Delivers an extra key to the terminal the way a hardware keyboard would.
 * Key presses go through xterm's keydown path, so the CLI's own shortcut
 * handling (Ctrl+C, Esc, Ctrl+L) sees them; text is typed as input.
 */
export function sendKey(terminal: Terminal, key: ExtraKey): void {
  if (key.text !== undefined) {
    terminal.input(key.text, true);
    return;
  }
  if (key.press) {
    sendPress(terminal, key.press);
  }
}

/** Dispatches a keydown on the terminal's input, as a hardware keyboard would. */
export function sendPress(terminal: Terminal, press: KeyPress): void {
  const target = terminal.textarea;
  if (!target) {
    return;
  }
  const event = new KeyboardEvent('keydown', {
    key: press.key,
    code: press.code,
    ctrlKey: !!press.ctrlKey,
    bubbles: true,
    cancelable: true,
  });
  // xterm still maps keys by the legacy keyCode, which KeyboardEventInit
  // cannot set.
  Object.defineProperty(event, 'keyCode', { get: () => press.keyCode });
  Object.defineProperty(event, 'which', { get: () => press.keyCode });
  target.dispatchEvent(event);
}
