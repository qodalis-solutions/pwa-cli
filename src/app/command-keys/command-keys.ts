import { ExtraKey } from '../extra-keys/extra-keys';

/**
 * The `controls` a full-screen command declares (`ICliCommandControls` in
 * @qodalis/cli-core): the keys it reads, whether it reads typed text, what
 * a tap sends and whether swipes send arrows.
 */
export interface CommandControls {
  keys: { label: string; data: string; key?: string; description?: string; repeat?: boolean }[];
  textInput?: boolean;
  tap?: string;
  swipe?: boolean;
}

/** The keys of a running command, laid out for the screen. */
export interface CommandPad {
  rows: ExtraKey[][];
  /** The command reads typed text: a compact row next to the on-screen keyboard. */
  compact: boolean;
  tap?: ExtraKey;
  swipe: boolean;
}

const ARROWS: Record<string, string> = { '\x1b[D': '←', '\x1b[A': '↑', '\x1b[B': '↓', '\x1b[C': '→' };
const ARROW_ORDER = Object.keys(ARROWS);

const toKey = (k: CommandControls['keys'][number]): ExtraKey => ({
  label: k.label,
  name: k.description ?? k.label,
  text: k.data,
  ...(k.repeat ? { repeat: true } : {}),
});

/** Splits keys into rows of at most `max`, as even as possible. */
function chunk<T>(items: T[], max: number): T[][] {
  if (!items.length) return [];
  const rows = Math.ceil(items.length / max);
  const size = Math.ceil(items.length / rows);
  return Array.from({ length: rows }, (_, i) => items.slice(i * size, (i + 1) * size));
}

/**
 * Lays out a command's keys. Commands that read typed text (an editor) get
 * compact rows of up to 8 keys above the keyboard; games get big buttons, the
 * arrow keys on their own row (← ↑ ↓ →) under the other keys.
 */
export function commandPad(controls: CommandControls): CommandPad {
  const keys = controls.keys.map(toKey);
  const tapKey = controls.keys.find((k) => k.data === controls.tap);
  const pad = { tap: tapKey ? toKey(tapKey) : undefined, swipe: !!controls.swipe };
  if (controls.textInput) {
    return { ...pad, rows: chunk(keys, 8), compact: true };
  }
  const isArrow = (k: ExtraKey) => k.text !== undefined && k.text in ARROWS;
  const arrows = keys.filter(isArrow).sort((a, b) => ARROW_ORDER.indexOf(a.text!) - ARROW_ORDER.indexOf(b.text!));
  return { ...pad, rows: [...chunk(keys.filter((k) => !isArrow(k)), 7), ...(arrows.length ? [arrows] : [])], compact: false };
}

/** The arrow for a swipe, by its main direction, or undefined for a tap. */
export function swipeKey(dx: number, dy: number, minDistance = 24): ExtraKey | undefined {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) return undefined;
  const data = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? '\x1b[C' : '\x1b[D') : dy > 0 ? '\x1b[B' : '\x1b[A';
  return { label: ARROWS[data], name: ARROWS[data], text: data };
}
