import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { EXTRA_KEYS, ExtraKey } from './extra-keys';

/** A row of terminal keys shown above the on-screen keyboard. */
@Component({
  selector: 'app-extra-keys',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (k of keys; track k.name) {
      <button
        type="button"
        [attr.aria-label]="k.name"
        [attr.data-key]="k.name"
        (pointerdown)="press($event, k)"
        (click)="click($event, k)"
      >
        {{ k.label }}
      </button>
    }
  `,
  styles: `
    :host
      display: flex
      gap: 4px
      padding: 4px 6px
      overflow-x: auto
      scrollbar-width: none
      background: var(--keys-bg)
      border-top: 1px solid var(--keys-border)
      touch-action: pan-x
      user-select: none
      -webkit-user-select: none

    :host::-webkit-scrollbar
      display: none

    button
      flex: 1 0 auto
      min-width: 44px
      min-height: 40px
      padding: 0 8px
      border: 0
      border-radius: 6px
      background: transparent
      color: var(--keys-fg)
      font: 600 14px/1 ui-monospace, 'SF Mono', Menlo, 'Roboto Mono', monospace

    button:active
      background: var(--keys-border)
  `,
  host: { role: 'toolbar', 'aria-label': 'Terminal keys' },
})
export class ExtraKeysComponent {
  readonly keys = EXTRA_KEYS;
  readonly key = output<ExtraKey>();

  // Pointer presses fire on pointerdown and keep focus in the terminal, so
  // the on-screen keyboard stays open.
  press(event: PointerEvent, key: ExtraKey): void {
    event.preventDefault();
    this.key.emit(key);
  }

  // Keyboard and assistive-technology activations arrive as a click with no
  // pointer behind it (detail === 0).
  click(event: MouseEvent, key: ExtraKey): void {
    if (event.detail === 0) {
      this.key.emit(key);
    }
  }
}
