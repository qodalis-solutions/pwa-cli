import { signal } from '@angular/core';

export type ModifierState = 'off' | 'once' | 'locked';

/** Two taps this close together lock the modifier. */
const DOUBLE_TAP_MS = 350;

/**
 * A sticky modifier key, as on Termux: one tap applies it to the next key,
 * a double tap locks it until it is tapped again.
 */
export class StickyModifier {
  readonly state = signal<ModifierState>('off');
  private lastTap = 0;

  tap(now = Date.now()): void {
    const quick = now - this.lastTap < DOUBLE_TAP_MS;
    this.lastTap = now;
    const state = this.state();
    if (state === 'off') this.state.set('once');
    else if (state === 'once' && quick) this.state.set('locked');
    else this.state.set('off');
  }

  get active(): boolean {
    return this.state() !== 'off';
  }

  /** Whether the modifier applies to this key; a one-shot modifier is used up. */
  consume(): boolean {
    const state = this.state();
    if (state === 'once') this.state.set('off');
    return state !== 'off';
  }
}
