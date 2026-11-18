import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { logEvent } from '../analytics';
import { format, introText } from './intro-i18n';
import { INTRO_SLIDES, IntroTrigger } from './intro';

/** A horizontal drag this long (CSS pixels) turns the slide. */
const SWIPE_PX = 50;

/**
 * The first-run introduction: six slides over the terminal, turned by swipe,
 * the dots, Next or the arrow keys. Every slide's "Try it" closes it and runs
 * an example command; Skip, Escape and "Get started" close it.
 */
@Component({
  selector: 'app-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      #dialog
      class="intro"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="text().dialog"
      [attr.lang]="locale()"
      tabindex="-1"
      (keydown)="onKeydown($event)"
    >
      <header>
        @if (!last()) {
          <button type="button" class="skip" (click)="skip()">{{ text().skip }}</button>
        }
      </header>
      <div
        class="viewport"
        aria-roledescription="carousel"
        [attr.aria-label]="text().dialog"
        (pointerdown)="dragStart($event)"
        (pointermove)="dragMove($event)"
        (pointerup)="dragEnd($event)"
        (pointercancel)="dragCancel()"
        (scroll)="$any($event.target).scrollLeft = 0"
      >
        <div class="track" [class.dragging]="drag !== undefined" [style.transform]="transform()">
          @for (slide of slides; track $index; let i = $index) {
            <article
              class="slide"
              role="group"
              aria-roledescription="slide"
              [attr.aria-label]="slideLabel(i)"
              [attr.aria-hidden]="i === index() ? null : 'true'"
              [attr.inert]="i === index() ? null : ''"
            >
              <div class="art" aria-hidden="true">
                <span class="icon">{{ slide.icon }}</span>
                <pre class="mock">{{ slide.mock.join('\n') }}</pre>
              </div>
              <div class="copy">
                <h2>{{ text().slides[i][0] }}</h2>
                <p>{{ text().slides[i][1] }}</p>
                <button type="button" class="try" [attr.data-slide]="i" (click)="tryIt(i)">
                  <span aria-hidden="true">▶</span> {{ text().tryIt }}: <code>{{ slide.command }}</code>
                </button>
              </div>
            </article>
          }
        </div>
      </div>
      <footer>
        <div class="dots">
          @for (slide of slides; track $index; let i = $index) {
            <button
              type="button"
              class="dot"
              [class.active]="i === index()"
              [attr.aria-label]="goToLabel(i)"
              [attr.aria-current]="i === index() ? 'step' : null"
              (click)="go(i)"
            ></button>
          }
        </div>
        <button #primary type="button" class="next" (click)="next()">
          {{ last() ? text().start : text().next }}
        </button>
      </footer>
      <p class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement() }}</p>
    </section>
  `,
  styles: `
    :host
      --intro-bg: #0b0e13
      --intro-fg: #e6edf3
      --intro-muted: #9aa6b2
      --intro-card: #151a21
      --intro-border: #2a313b
      --intro-accent: #5aa9f0
      --intro-accent-fg: #06121f
      --intro-mock-bg: #000
      --intro-mock-fg: #9fe870
      position: fixed
      inset: 0
      z-index: 20
      display: flex
      justify-content: center
      box-sizing: border-box
      padding: var(--inset-top) var(--inset-right) var(--inset-bottom) var(--inset-left)
      background: var(--intro-bg)
      color: var(--intro-fg)
      font: 400 16px/1.45 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif
      color-scheme: dark

    @media (prefers-color-scheme: light)
      :host
        --intro-bg: #f6f8fa
        --intro-fg: #1b1f24
        --intro-muted: #57606a
        --intro-card: #fff
        --intro-border: #d0d7de
        --intro-accent: #0969da
        --intro-accent-fg: #fff
        --intro-mock-bg: #1b1f24
        --intro-mock-fg: #9fe870
        color-scheme: light

    .intro
      display: flex
      flex-direction: column
      width: 100%
      max-width: 560px
      height: 100%
      outline: none

    header
      display: flex
      justify-content: flex-end
      min-height: 48px
      padding: 4px 8px 0

    // Slides move by transform only; the viewport is never scrolled (see the scroll handler).
    .viewport
      flex: 1 1 auto
      min-height: 0
      overflow: hidden
      touch-action: pan-y

    .track
      display: flex
      height: 100%
      transition: transform 280ms ease

    .track.dragging
      transition: none

    .slide
      flex: 0 0 100%
      box-sizing: border-box
      display: flex
      flex-direction: column
      justify-content: center
      gap: 20px
      padding: 8px 24px
      overflow-y: auto

    .art
      display: flex
      flex-direction: column
      align-items: center
      gap: 12px

    .icon
      font-size: 48px
      line-height: 1

    .mock
      width: 100%
      max-width: 320px
      box-sizing: border-box
      margin: 0
      padding: 12px 14px
      border: 1px solid var(--intro-border)
      border-radius: 10px
      background: var(--intro-mock-bg)
      color: var(--intro-mock-fg)
      font: 13px/1.5 ui-monospace, 'SF Mono', Menlo, 'Roboto Mono', monospace
      white-space: pre
      overflow: hidden

    .copy
      display: flex
      flex-direction: column
      align-items: center
      text-align: center

    h2
      margin: 0 0 8px
      font-size: 24px
      line-height: 1.2

    p
      margin: 0 0 16px
      max-width: 34em
      color: var(--intro-muted)

    button
      font: inherit
      cursor: pointer
      -webkit-tap-highlight-color: transparent

    button:focus-visible
      outline: 2px solid var(--intro-accent)
      outline-offset: 2px

    .skip
      min-height: 44px
      padding: 0 12px
      border: 0
      background: none
      color: var(--intro-muted)

    .try
      min-height: 44px
      padding: 8px 16px
      border: 1px solid var(--intro-border)
      border-radius: 22px
      background: var(--intro-card)
      color: var(--intro-fg)

    .try code
      font: 600 14px ui-monospace, 'SF Mono', Menlo, 'Roboto Mono', monospace
      color: var(--intro-accent)

    footer
      display: flex
      align-items: center
      justify-content: space-between
      gap: 12px
      padding: 12px 24px 20px

    .dots
      display: flex

    // A small dot in a touch-sized button
    .dot
      width: 28px
      height: 44px
      padding: 0
      border: 0
      background: none

    .dot::before
      content: ''
      display: block
      width: 8px
      height: 8px
      margin: auto
      border-radius: 50%
      background: var(--intro-border)
      transition: width 200ms ease

    .dot.active::before
      width: 20px
      border-radius: 4px
      background: var(--intro-accent)

    .next
      min-width: 120px
      min-height: 48px
      padding: 0 20px
      border: 0
      border-radius: 24px
      background: var(--intro-accent)
      color: var(--intro-accent-fg)
      font-weight: 600

    .sr-only
      position: absolute
      width: 1px
      height: 1px
      margin: -1px
      overflow: hidden
      clip-path: inset(50%)
      white-space: nowrap

    // Phones on their side: the picture beside the words
    @media (orientation: landscape) and (max-height: 520px)
      header
        min-height: 0
        position: absolute
        top: calc(var(--inset-top) + 4px)
        right: calc(var(--inset-right) + 8px)
        z-index: 1
      .intro
        max-width: 900px
      .slide
        flex-direction: row
        align-items: center
        gap: 24px
      .art, .copy
        flex: 1 1 50%
      .icon
        font-size: 36px
      h2
        font-size: 20px
      footer
        padding: 4px 24px 8px

    @media (prefers-reduced-motion: reduce)
      .track, .dot::before
        transition: none
  `,
})
export class IntroComponent {
  /** The CLI language. */
  readonly locale = input('en');
  /** Why it opened (first launch, or the `intro` command), for analytics. */
  readonly trigger = input<IntroTrigger>('first_run');
  /** Emits when it closes, with the command to run when it closed through "Try it". */
  readonly closed = output<string | undefined>();

  readonly slides = INTRO_SLIDES;
  readonly index = signal(0);
  readonly text = computed(() => introText(this.locale()));
  readonly last = computed(() => this.index() === this.slides.length - 1);
  readonly announcement = signal('');
  private readonly offset = signal(0);
  readonly transform = computed(() => `translateX(calc(${-this.index() * 100}% + ${this.offset()}px))`);

  drag?: { x: number; y: number; id: number; horizontal?: boolean };
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private readonly primary = viewChild.required<ElementRef<HTMLButtonElement>>('primary');

  constructor() {
    afterNextRender(() => {
      this.primary().nativeElement.focus();
      logEvent('intro_shown', { trigger: this.trigger() });
    });
  }

  slideLabel(i: number): string {
    return format(this.text().slideOf, { n: i + 1, total: this.slides.length });
  }

  goToLabel(i: number): string {
    return format(this.text().goTo, { n: i + 1 });
  }

  go(i: number): void {
    const target = Math.max(0, Math.min(this.slides.length - 1, i));
    if (target === this.index()) {
      return;
    }
    this.index.set(target);
    this.announcement.set(`${this.slideLabel(target)}: ${this.text().slides[target][0]}`);
  }

  next(): void {
    if (this.last()) {
      logEvent('intro_completed');
      this.closed.emit(undefined);
    } else {
      this.go(this.index() + 1);
    }
  }

  skip(): void {
    logEvent('intro_skipped', { slide: this.index() + 1 });
    this.closed.emit(undefined);
  }

  tryIt(i: number): void {
    const command = this.slides[i].command;
    logEvent('intro_try_it', { slide: i + 1, command });
    this.closed.emit(command);
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowRight':
        this.go(this.index() + 1);
        break;
      case 'ArrowLeft':
        this.go(this.index() - 1);
        break;
      case 'Home':
        this.go(0);
        break;
      case 'End':
        this.go(this.slides.length - 1);
        break;
      case 'Escape':
        this.skip();
        break;
      case 'Tab':
        this.trapFocus(event);
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  /** Tab and Shift+Tab cycle through the dialog's buttons; the terminal behind is inert. */
  private trapFocus(event: KeyboardEvent): void {
    const buttons = [...this.dialog().nativeElement.querySelectorAll<HTMLElement>('button')].filter(
      (b) => !b.closest('[inert]'),
    );
    if (!buttons.length) {
      return;
    }
    const first = buttons[0];
    const lastButton = buttons[buttons.length - 1];
    const active = document.activeElement;
    const outside = !buttons.includes(active as HTMLElement);
    if (event.shiftKey && (active === first || outside)) {
      lastButton.focus();
      event.preventDefault();
    } else if (!event.shiftKey && (active === lastButton || outside)) {
      first.focus();
      event.preventDefault();
    }
  }

  dragStart(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    this.drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }

  dragMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || drag.id !== event.pointerId) {
      return;
    }
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    // The first clear movement decides: sideways turns slides, up and down scrolls the text.
    if (drag.horizontal === undefined && Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
      drag.horizontal = Math.abs(dx) > Math.abs(dy);
      if (drag.horizontal) {
        (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
      }
    }
    if (drag.horizontal) {
      // Resists past the first and last slide.
      const edge = (dx > 0 && this.index() === 0) || (dx < 0 && this.last());
      this.offset.set(edge ? dx / 3 : dx);
    }
  }

  dragEnd(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || drag.id !== event.pointerId) {
      return;
    }
    const dx = event.clientX - drag.x;
    this.dragCancel();
    if (drag.horizontal && Math.abs(dx) >= SWIPE_PX) {
      // The pointer is captured by the viewport, so a swipe that starts on "Try it" does not press it.
      this.go(this.index() + (dx < 0 ? 1 : -1));
    }
  }

  dragCancel(): void {
    this.drag = undefined;
    this.offset.set(0);
  }
}
