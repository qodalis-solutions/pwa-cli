import { CliEngine, CliStateStoreManager_TOKEN } from '@qodalis/cli';
import {
  CLI_CONFIGURE_STORE_NAME,
  ICliTranslationService,
  ICliTranslationService_TOKEN,
} from '@qodalis/cli-core';

/** Set once the device language has been offered, so a later choice in `configure` stays. */
const DETECTED_KEY = 'qcli.deviceLanguageApplied';
const DEFAULT_LOCALE = 'en';

interface ConfigureState {
  system?: Record<string, unknown>;
}

/**
 * The first bundled locale among the device's languages (`de-AT` -> `de`),
 * or undefined when none is bundled.
 */
export function matchDeviceLocale(
  deviceLanguages: readonly string[],
  available: readonly string[],
): string | undefined {
  const bundled = new Set(available.map((l) => l.toLowerCase()));
  for (const language of deviceLanguages) {
    const tag = language.toLowerCase();
    if (bundled.has(tag)) return tag;
    const base = tag.split('-')[0];
    if (bundled.has(base)) return base;
  }
  return undefined;
}

/**
 * On first launch, switches the CLI to the device language when a language
 * pack for it is bundled, and saves it as the `configure` language so it
 * sticks. Afterwards the user's choice in `configure` is left alone.
 */
export function applyDeviceLanguage(engine: CliEngine): void {
  const services = engine.getContext()?.services;
  const translator = services?.get<ICliTranslationService>(ICliTranslationService_TOKEN);
  if (!services || !translator) return;

  try {
    if (!localStorage.getItem(DETECTED_KEY)) {
      localStorage.setItem(DETECTED_KEY, '1');
      const locale = matchDeviceLocale(navigator.languages ?? [navigator.language], translator.getAvailableLocales());
      if (locale && locale !== translator.getLocale()) {
        const store = services
          .get<{ getStateStore(name: string): { getState<T>(): T; updateState(s: object): void; persist(): Promise<void> } }>(
            CliStateStoreManager_TOKEN,
          )
          ?.getStateStore(CLI_CONFIGURE_STORE_NAME);
        const system = store?.getState<ConfigureState>().system ?? {};
        // Only replace the default; a language chosen before stays
        if (store && (!system['language'] || system['language'] === DEFAULT_LOCALE)) {
          store.updateState({ system: { ...system, language: locale } });
          store.persist().catch(() => {});
          translator.setLocale(locale);
        }
      }
    }
  } catch {
    // Storage unavailable (private mode): keep the CLI's language
  }

  document.documentElement.lang = translator.getLocale();
}
