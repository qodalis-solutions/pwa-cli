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
import { ExtraKey } from './extra-keys/extra-keys';
import { ExtraKeysComponent } from './extra-keys/extra-keys.component';
import { sendKey } from './extra-keys/send-key';
import { hideSplash, initNativeShell } from './native/native-shell';
import { hasTouchKeyboard, trackVisualViewport } from './viewport';

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

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(trackVisualViewport());
    initNativeShell();
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
    }
  }

  onEngineReady(engine: CliEngine): void {
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
