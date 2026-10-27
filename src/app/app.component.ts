import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { CliComponent, CliModule } from '@qodalis/angular-cli';
import { CliEngine } from '@qodalis/cli';
import { CliLogLevel, CliOptions } from '@qodalis/cli-core';
import { filter } from 'rxjs';

import { CLI_MODULES } from './cli-modules';
import { applyDeviceLanguage } from './device-language';
import { ctrlLetter, EXTRA_KEYS, ExtraKey } from './extra-keys/extra-keys';
import { ExtraKeysComponent } from './extra-keys/extra-keys.component';
import { sendKey, sendPress } from './extra-keys/send-key';
import { StickyModifier } from './extra-keys/sticky-modifier';
import { GAME_PADS, GamePad, swipeKey } from './games/game-pads';
import { hideSplash, initNativeShell } from './native/native-shell';
import { hasTouchKeyboard, trackVisualViewport, watchTouchKeyboard } from './viewport';

const ESCAPE = EXTRA_KEYS.find((k) => k.name === 'Escape')!;
const BACK_TWICE_MS = 1500;

@Component({
  selector: 'app-root',
  imports: [CliModule, ExtraKeysComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass',
})
export class AppComponent {
  readonly options: CliOptions = {
    logLevel: CliLogLevel.ERROR,
    terminalOptions: {
      allowTransparency: false,
      scrollback: 5000,
    },
  };
  readonly modules = CLI_MODULES;
  readonly showKeys = signal(hasTouchKeyboard());
  readonly updateReady = signal(false);
  /** The sticky CTRL key of the extra-keys rows. */
  readonly ctrl = new StickyModifier();
  /** The touch pad of the game being played, on touch screens. */
  readonly pad = signal<GamePad | undefined>(undefined);
  gesture?: { x: number; y: number; time: number };
  /** The game being played, on any screen (its pad shows on touch screens only). */
  private game?: GamePad;
  readonly playing = signal(false);

  private readonly cli = viewChild.required(CliComponent);
  private background = '';
  private lastBack = 0;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const destroyRef = this.destroyRef;
    destroyRef.onDestroy(trackVisualViewport());
    destroyRef.onDestroy(watchTouchKeyboard((touch) => this.showKeys.set(touch)));
    initNativeShell(() => this.onBack());
    // The terminal draws within a frame or two of the first render; engineReady
    // only fires after the welcome animation, which is too late for the splash.
    afterNextRender(() => setTimeout(hideSplash, 300));

    const updates = inject(SwUpdate);
    if (updates.isEnabled) {
      updates.versionUpdates
        .pipe(
          filter((e) => e.type === 'VERSION_READY'),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe(() => this.updateReady.set(true));
      // A broken cache (e.g. files evicted by the browser) cannot be served: start fresh.
      updates.unrecoverable
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe(() => document.location.reload());
      // An installed app is resumed far more often than started: look for a
      // new version whenever it comes back to the foreground.
      const checkOnResume = () => {
        if (document.visibilityState === 'visible') {
          updates.checkForUpdate().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', checkOnResume);
      destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', checkOnResume));
    }
  }

  onEngineReady(engine: CliEngine): void {
    applyDeviceLanguage(engine);
    const terminal = engine.getTerminal();
    this.destroyRef.onDestroy(this.applyCtrlToKeyboard(terminal));
    // Games run as the context processor; their pad replaces the extra keys.
    terminal.onRender(() => this.syncGamePad(engine));
    this.syncBackground(terminal.options.theme?.background);
    // `theme` commands change the terminal colours at any time.
    terminal.onRender(() => this.syncBackground(terminal.options.theme?.background));
    // Boot and the welcome message are done; end-to-end tests wait for this.
    (window as unknown as { qodalisCli?: CliEngine }).qodalisCli = engine;
  }

  onExtraKey(key: ExtraKey): void {
    if (key.modifier === 'ctrl') {
      this.ctrl.tap();
      return;
    }
    const terminal = this.cli().getEngine()?.getTerminal();
    if (!terminal) {
      return;
    }
    // CTRL then a letter key sends Ctrl+<letter>; on any other key it is dropped.
    const ctrlPress = this.ctrl.consume() && key.text ? ctrlLetter(key.text) : undefined;
    if (ctrlPress) {
      sendPress(terminal, ctrlPress);
    } else {
      sendKey(terminal, key);
    }
  }

  onGameKey(key: ExtraKey): void {
    const terminal = this.cli().getEngine()?.getTerminal();
    if (terminal) {
      sendKey(terminal, key);
    }
  }

  /** On the board of a game, a touch starts a swipe (or a tap). */
  gestureStart(event: PointerEvent): void {
    const game = this.game;
    const touch = event.pointerType !== 'mouse' || !!this.pad();
    if (!game || !touch || !(event.target as Element).closest('.terminal')) {
      return;
    }
    // Keeps the board from scrolling, and the focus where it is.
    event.preventDefault();
    this.gesture = { x: event.clientX, y: event.clientY, time: Date.now() };
  }

  /** A swipe sends the arrow in its direction; a quick tap sends the game's tap key. */
  gestureEnd(event: PointerEvent): void {
    const start = this.gesture;
    const game = this.game;
    this.gesture = undefined;
    if (!start || !game) {
      return;
    }
    const key =
      swipeKey(event.clientX - start.x, event.clientY - start.y) ??
      (Date.now() - start.time < 300 ? game.tap : undefined);
    if (key) {
      this.onGameKey(key);
    }
  }

  /**
   * While a game runs, shows its pad on touch screens and closes the
   * on-screen keyboard so the board gets the screen. The terminal keeps
   * focus (inputmode none only hides the soft keyboard), so a hardware
   * keyboard still plays; the soft keyboard comes back at the prompt.
   */
  private syncGamePad(engine: CliEngine): void {
    const command = engine.getContext()?.contextProcessor?.command;
    const game = command ? GAME_PADS[command] : undefined;
    const pad = this.showKeys() ? game : undefined;
    if (game !== this.game) {
      this.game = game;
      this.playing.set(!!game);
      const textarea = engine.getTerminal().textarea;
      if (game) {
        textarea?.setAttribute('inputmode', 'none');
      } else {
        textarea?.removeAttribute('inputmode');
      }
    }
    if (pad !== this.pad()) {
      this.pad.set(pad);
    }
  }

  /**
   * While CTRL is on, a letter typed on the on-screen keyboard becomes
   * Ctrl+<letter> (Ctrl+A/E line start and end, Ctrl+U/K/W delete, Ctrl+L
   * clear). Keyboards send letters as a keydown or, without a key code, as
   * an input event; both are caught on the window, before xterm's own
   * listeners (on an ancestor of its textarea) see them.
   */
  private applyCtrlToKeyboard(terminal: ReturnType<CliEngine['getTerminal']>): () => void {
    const target = terminal.textarea;
    if (!target) {
      return () => {};
    }
    // The keypress and input events that follow a cancelled keydown would
    // still type the letter: they are dropped too.
    let swallow: string | undefined;
    const block = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const intercept = (char: string | null | undefined, event: Event): boolean => {
      const press = this.ctrl.active && char && char.length === 1 ? ctrlLetter(char) : undefined;
      if (!press) {
        return false;
      }
      this.ctrl.consume();
      block(event);
      sendPress(terminal, press);
      return true;
    };
    const onKeydown = (e: KeyboardEvent) => {
      swallow = undefined;
      if (!e.ctrlKey && !e.altKey && !e.metaKey && intercept(e.key, e)) {
        swallow = e.key;
      }
    };
    const onKeypress = (e: KeyboardEvent) => {
      if (swallow !== undefined && e.key === swallow) block(e);
    };
    const onBeforeInput = (e: InputEvent) => {
      if (swallow !== undefined && e.data === swallow) {
        swallow = undefined;
        block(e);
      } else if (e.inputType === 'insertText') {
        intercept(e.data, e);
      }
    };
    const onInput = (e: Event) => {
      const data = (e as InputEvent).data;
      if (swallow !== undefined && data === swallow) {
        swallow = undefined;
        block(e);
      }
    };
    const fromTerminal =
      (listener: (e: never) => void) =>
      (e: Event): void => {
        if (e.target === target) listener(e as never);
      };
    const listeners: [string, (e: never) => void][] = [
      ['keydown', onKeydown],
      ['keypress', onKeypress],
      ['beforeinput', onBeforeInput],
      ['input', onInput],
    ];
    const bound = listeners.map(([type, listener]) => [type, fromTerminal(listener)] as const);
    for (const [type, listener] of bound) window.addEventListener(type, listener, true);
    return () => {
      for (const [type, listener] of bound) window.removeEventListener(type, listener, true);
    };
  }

  /**
   * The Android back button leaves what is on screen first: in a game, a
   * full-screen app or a prompt it presses Escape. A second press within
   * {@link BACK_TWICE_MS} still sends the app to the background, for screens
   * that Escape does not close (nano exits with Ctrl+X).
   */
  private onBack(): boolean {
    const context = this.cli().getEngine()?.getContext();
    const busy = !!context && (context.isExecuting || !!context.contextProcessor);
    const now = Date.now();
    if (!busy || now - this.lastBack < BACK_TWICE_MS) {
      return false;
    }
    this.lastBack = now;
    sendKey(this.cli().getEngine()!.getTerminal(), ESCAPE);
    return true;
  }

  /** Paints the safe areas and system bars in the terminal's background colour. */
  private syncBackground(color: string | undefined): void {
    if (!color || color === this.background) {
      return;
    }
    this.background = color;
    document.documentElement.style.setProperty('--app-bg', color);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }

  reload(): void {
    document.location.reload();
  }
}
