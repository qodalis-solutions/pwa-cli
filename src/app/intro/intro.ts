import { signal } from '@angular/core';
import {
  CliProcessCommand,
  ICliCommandProcessor,
  ICliExecutionContext,
  ICliTranslationService,
  ICliTranslationService_TOKEN,
} from '@qodalis/cli-core';

import { matchDeviceLocale } from '../device-language';
import { INTRO_LOCALES } from './intro-i18n';

/** Set once the introduction has been closed, so it opens by itself only on the first launch. */
export const INTRO_SEEN_KEY = 'qcli.introSeen';

export interface IntroSlide {
  /** A screenshot of the app running `command` (public/intro, made by `npm run intro-images`). */
  image: string;
  /** The picture's size in pixels, so the layout does not move while it loads. */
  width: number;
  height: number;
  /** What "Try it" runs at the prompt: the command in the picture. */
  command: string;
}

/** Welcome, getting around, everyday tools, files, games, more packages, make it yours (texts in intro-i18n.ts). */
export const INTRO_SLIDES: IntroSlide[] = [
  { image: 'intro/welcome.webp', width: 784, height: 550, command: 'help' },
  { image: 'intro/getting-around.webp', width: 784, height: 326, command: 'history' },
  { image: 'intro/everyday-tools.webp', width: 784, height: 102, command: 'generate-password' },
  { image: 'intro/files.webp', width: 784, height: 102, command: 'ls' },
  { image: 'intro/games.webp', width: 784, height: 870, command: 'snake' },
  { image: 'intro/packages.webp', width: 784, height: 358, command: 'pkg browse' },
  { image: 'intro/make-it-yours.webp', width: 784, height: 422, command: 'theme list' },
];

export type IntroTrigger = 'first_run' | 'command';

export interface IntroRequest {
  trigger: IntroTrigger;
  /** The language to show it in: the CLI's, or the device's before the CLI has started. */
  locale: string;
}

/** The introduction on screen, if any; AppComponent shows it, the `intro` command opens it. */
export const introRequest = signal<IntroRequest | undefined>(undefined);

export function introSeen(): boolean {
  try {
    return !!localStorage.getItem(INTRO_SEEN_KEY);
  } catch {
    // Storage unavailable (private mode): do not show it on every launch
    return true;
  }
}

export function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // Storage unavailable: nothing to remember it in
  }
}

/** The device language when the introduction has it, before the CLI applies it (device-language.ts). */
export function deviceIntroLocale(): string {
  return matchDeviceLocale(navigator.languages ?? [navigator.language], INTRO_LOCALES) ?? 'en';
}

/** `intro`: opens the introduction again. */
export class IntroCommandProcessor implements ICliCommandProcessor {
  command = 'intro';
  aliases = ['welcome'];
  description = 'Show the introduction to the app again';
  metadata = { icon: '👋', module: 'app' };

  async processCommand(_: CliProcessCommand, context: ICliExecutionContext): Promise<void> {
    const translator = context.services.get<ICliTranslationService>(ICliTranslationService_TOKEN);
    introRequest.set({ trigger: 'command', locale: translator?.getLocale() ?? deviceIntroLocale() });
  }
}
