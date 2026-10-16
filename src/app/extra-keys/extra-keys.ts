/** A key on the extra-keys row: either a real key press or literal text. */
export interface ExtraKey {
  label: string;
  /** Accessible name, when the label is a symbol. */
  name: string;
  /** Sent as a keydown so terminal shortcuts (Ctrl+C, Esc, Tab) work. */
  press?: { key: string; code: string; keyCode: number; ctrlKey?: boolean };
  /** Sent as typed text. */
  text?: string;
}

/** Keys that soft keyboards lack or bury, in the order Termux users expect. */
export const EXTRA_KEYS: ExtraKey[] = [
  { label: 'ESC', name: 'Escape', press: { key: 'Escape', code: 'Escape', keyCode: 27 } },
  { label: 'TAB', name: 'Tab', press: { key: 'Tab', code: 'Tab', keyCode: 9 } },
  { label: '^C', name: 'Control C', press: { key: 'c', code: 'KeyC', keyCode: 67, ctrlKey: true } },
  { label: '^L', name: 'Control L', press: { key: 'l', code: 'KeyL', keyCode: 76, ctrlKey: true } },
  { label: '←', name: 'Left', press: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 } },
  { label: '↑', name: 'Up', press: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 } },
  { label: '↓', name: 'Down', press: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 } },
  { label: '→', name: 'Right', press: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 } },
  { label: '-', name: 'Dash', text: '-' },
  { label: '/', name: 'Slash', text: '/' },
  { label: '|', name: 'Pipe', text: '|' },
  { label: '~', name: 'Tilde', text: '~' },
];
