/** A key on the extra-keys rows: a real key press, literal text or a modifier. */
export interface ExtraKey {
  label: string;
  /** Accessible name, when the label is a symbol. */
  name: string;
  /** Sent as a keydown so terminal shortcuts (Ctrl+C, Esc, Tab) work. */
  press?: KeyPress;
  /** Sent as typed text. */
  text?: string;
  /** Held down, the key repeats (arrows, Delete). */
  repeat?: boolean;
  /** A sticky modifier applied to the next key (from the rows or the keyboard). */
  modifier?: 'ctrl';
}

export interface KeyPress {
  key: string;
  code: string;
  keyCode: number;
  ctrlKey?: boolean;
}

const key = (label: string, name: string, press: KeyPress, repeat = false): ExtraKey => ({
  label,
  name,
  press,
  ...(repeat ? { repeat } : {}),
});

/**
 * Two rows that fit a phone's width without scrolling, laid out like Termux:
 * the arrows form a cross, the keys soft keyboards lack or bury around them.
 */
export const EXTRA_KEY_ROWS: ExtraKey[][] = [
  [
    key('ESC', 'Escape', { key: 'Escape', code: 'Escape', keyCode: 27 }),
    { label: '/', name: 'Slash', text: '/' },
    { label: '|', name: 'Pipe', text: '|' },
    key('HOME', 'Home', { key: 'Home', code: 'Home', keyCode: 36 }),
    key('↑', 'Up', { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 }, true),
    key('END', 'End', { key: 'End', code: 'End', keyCode: 35 }),
    key('DEL', 'Delete', { key: 'Delete', code: 'Delete', keyCode: 46 }, true),
  ],
  [
    key('TAB', 'Tab', { key: 'Tab', code: 'Tab', keyCode: 9 }),
    { label: 'CTRL', name: 'Control', modifier: 'ctrl' },
    key('^C', 'Control C', { key: 'c', code: 'KeyC', keyCode: 67, ctrlKey: true }),
    key('←', 'Left', { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 }, true),
    key('↓', 'Down', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 }, true),
    key('→', 'Right', { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 }, true),
    { label: '-', name: 'Dash', text: '-' },
  ],
];

export const EXTRA_KEYS: ExtraKey[] = EXTRA_KEY_ROWS.flat();

/** The keydown for Ctrl+<letter>, or undefined when `char` is not a letter. */
export function ctrlLetter(char: string): KeyPress | undefined {
  if (!/^[a-z]$/i.test(char)) return undefined;
  const upper = char.toUpperCase();
  return { key: char.toLowerCase(), code: `Key${upper}`, keyCode: upper.charCodeAt(0), ctrlKey: true };
}
