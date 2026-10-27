import { ExtraKey } from '../extra-keys/extra-keys';

/** Touch controls for a full-screen game, shown in place of the extra keys. */
export interface GamePad {
  /** Rows of big buttons replacing the extra keys. */
  rows: ExtraKey[][];
  /** Key sent by a tap on the board (e.g. rotate), if any. */
  tap?: ExtraKey;
}

const arrow = (label: string, name: string, key: string, keyCode: number): ExtraKey => ({
  label,
  name,
  press: { key, code: key, keyCode },
  repeat: true,
});

export const UP = arrow('↑', 'Up', 'ArrowUp', 38);
export const DOWN = arrow('↓', 'Down', 'ArrowDown', 40);
export const LEFT = arrow('←', 'Left', 'ArrowLeft', 37);
export const RIGHT = arrow('→', 'Right', 'ArrowRight', 39);

const ESC: ExtraKey = { label: 'ESC', name: 'Escape', press: { key: 'Escape', code: 'Escape', keyCode: 27 } };
const letter = (label: string, name: string, text: string): ExtraKey => ({ label, name, text });
const SPACE = (label: string, name: string): ExtraKey => letter(label, name, ' ');
const RETRY = letter('R', 'Retry', 'r');

/**
 * Pads for the bundled games, by command. Games not listed here (wordle
 * needs letters) keep the extra keys and the on-screen keyboard.
 */
export const GAME_PADS: Record<string, GamePad> = {
  tetris: {
    rows: [
      [ESC, letter('P', 'Pause', 'p'), RETRY, { ...UP, label: '⟳', name: 'Rotate', repeat: false }],
      [LEFT, DOWN, RIGHT, SPACE('DROP', 'Drop')],
    ],
    tap: { ...UP, name: 'Rotate', repeat: false },
  },
  snake: {
    rows: [
      [ESC, UP, SPACE('PAUSE', 'Pause'), RETRY],
      [LEFT, DOWN, RIGHT],
    ],
  },
  '2048': {
    rows: [
      [ESC, UP, letter('UNDO', 'Undo', 'u'), RETRY],
      [LEFT, DOWN, RIGHT, letter('GO ON', 'Continue', 'c')],
    ],
  },
  minesweeper: {
    rows: [
      [ESC, UP, letter('FLAG', 'Flag', 'f'), RETRY],
      [LEFT, DOWN, RIGHT, SPACE('OPEN', 'Reveal')],
    ],
    tap: SPACE('OPEN', 'Reveal'),
  },
  sudoku: {
    rows: [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => letter(d, `Digit ${d}`, d)),
      [
        ESC,
        LEFT,
        UP,
        DOWN,
        RIGHT,
        letter('CLR', 'Clear', '0'),
        letter('NOTE', 'Notes', 'n'),
        letter('HINT', 'Hint', 'h'),
        letter('CHK', 'Check', 'c'),
      ],
    ],
  },
};

/** The arrow for a swipe, by its main direction, or undefined for a tap. */
export function swipeKey(dx: number, dy: number, minDistance = 24): ExtraKey | undefined {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) return undefined;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? RIGHT : LEFT;
  return dy > 0 ? DOWN : UP;
}
