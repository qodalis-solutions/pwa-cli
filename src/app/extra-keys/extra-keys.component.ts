import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output } from '@angular/core';

import { EXTRA_KEY_ROWS, ExtraKey } from './extra-keys';
import { ModifierState } from './sticky-modifier';

/** A held key repeats after this delay, then at this interval (like a keyboard). */
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 60;

/** Two rows of terminal keys shown above the on-screen keyboard. */
@Component({
  selector: 'app-extra-keys',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (row of rows(); track $index) {
      <div class="row" [style.grid-template-columns]="'repeat(' + row.length + ', minmax(0, 1fr))'">
        @for (k of row; track k.name) {
          <button
            type="button"
            [attr.aria-label]="k.name"
            [attr.data-key]="k.name"
            [attr.aria-pressed]="k.modifier ? ctrl() !== 'off' : null"
            [class.modifier-once]="k.modifier && ctrl() === 'once'"
            [class.modifier-locked]="k.modifier && ctrl() === 'locked'"
            (pointerdown)="press($event, k)"
            (pointerup)="release()"
            (pointercancel)="release()"
            (pointerleave)="release()"
            (contextmenu)="$event.preventDefault()"
            (click)="click($event, k)"
          >
            {{ k.label }}
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host
      display: flex
      flex-direction: column
      gap: 2px
      padding: 3px 4px
      background: var(--keys-bg)
      border-top: 1px solid var(--keys-border)
      touch-action: manipulation
      user-select: none
      -webkit-user-select: none
      -webkit-touch-callout: none

    .row
      display: grid
      gap: 2px

    :host(.game)
      gap: 4px
      padding: 6px

    :host(.game) .row
      gap: 4px

    :host(.game) button
      min-height: 52px
      border-color: var(--keys-border)
      font-size: 15px

    button
      min-width: 0
      min-height: 40px
      padding: 0 2px
      border: 1px solid transparent
      border-radius: 6px
      background: transparent
      color: var(--keys-fg)
      font: 600 13px/1 ui-monospace, 'SF Mono', Menlo, 'Roboto Mono', monospace
      white-space: nowrap
      -webkit-tap-highlight-color: transparent

    button:active
      background: var(--keys-border)

    button.modifier-once
      border-color: var(--keys-accent)
      color: var(--keys-accent)

    button.modifier-locked
      background: var(--keys-accent)
      color: var(--keys-bg)
  `,
  host: { role: 'toolbar', 'aria-label': 'Terminal keys' },
})
export class ExtraKeysComponent {
  /** The keys, row by row: the extra keys, or a game's pad. */
  readonly rows = input<ExtraKey[][]>(EXTRA_KEY_ROWS);
  /** State of the sticky CTRL key, shown on its button. */
  readonly ctrl = input<ModifierState>('off');
  readonly key = output<ExtraKey>();

  private repeatTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.release());
  }

  // Pointer presses fire on pointerdown and keep focus in the terminal, so
  // the on-screen keyboard stays open.
  press(event: PointerEvent, key: ExtraKey): void {
    event.preventDefault();
    this.release();
    this.key.emit(key);
    if (key.repeat) {
      const repeat = () => {
        this.key.emit(key);
        this.repeatTimer = setTimeout(repeat, REPEAT_INTERVAL_MS);
      };
      this.repeatTimer = setTimeout(repeat, REPEAT_DELAY_MS);
    }
  }

  release(): void {
    clearTimeout(this.repeatTimer);
    this.repeatTimer = undefined;
  }

  // Keyboard and assistive-technology activations arrive as a click with no
  // pointer behind it (detail === 0).
  click(event: MouseEvent, key: ExtraKey): void {
    if (event.detail === 0) {
      this.key.emit(key);
    }
  }
}
