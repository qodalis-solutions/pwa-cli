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
  icon: string;
  /** A few lines of a terminal: the example command and what it prints. */
  mock: string[];
  /** What "Try it" runs at the prompt. */
  command: string;
}

/** Welcome, getting around, everyday tools, files, games, make it yours (texts in intro-i18n.ts). */
export const INTRO_SLIDES: IntroSlide[] = [
  { icon: '👋', mock: ['$ help', 'Available commands:', '  echo  guid  qr  snake …'], command: 'help' },
  { icon: '🧭', mock: ['$ he⇥', '$ help', '$ ↑  history'], command: 'history' },
  { icon: '🧰', mock: ['$ generate-password', 'kX9#vQ2!mL7$wR4p'], command: 'generate-password' },
  { icon: '📁', mock: ['$ ls', 'notes/  todo.txt', '$ nano todo.txt'], command: 'ls' },
  { icon: '🎮', mock: ['$ snake', '┌────────────┐', '│ ■■■■▶    ● │', '└────────────┘'], command: 'snake' },
  { icon: '🎨', mock: ['$ theme list', '■■■ dracula', '■■■ solarized'], command: 'theme list' },
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
