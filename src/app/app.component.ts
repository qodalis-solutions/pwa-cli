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
import { EXTRA_KEYS, ExtraKey } from './extra-keys/extra-keys';
import { ExtraKeysComponent } from './extra-keys/extra-keys.component';
import { sendKey } from './extra-keys/send-key';
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

  private readonly cli = viewChild.required(CliComponent);
  private background = '';
  private lastBack = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
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
    this.syncBackground(terminal.options.theme?.background);
    // `theme` commands change the terminal colours at any time.
    terminal.onRender(() => this.syncBackground(terminal.options.theme?.background));
    // Boot and the welcome message are done; end-to-end tests wait for this.
    (window as unknown as { qodalisCli?: CliEngine }).qodalisCli = engine;
  }

  onExtraKey(key: ExtraKey): void {
    const terminal = this.cli().getEngine()?.getTerminal();
    if (terminal) {
      sendKey(terminal, key);
    }
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
