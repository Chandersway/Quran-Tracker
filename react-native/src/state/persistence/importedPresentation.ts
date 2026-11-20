import type { AppState } from '../models';
import { restoreSurahPositions } from './readerPositions';
import { isThemeMode } from '../../domain/themePreferences';

/** Activate preserved Android UI values after import, without rewriting its source contract. */
export function importedPresentation(state: AppState): AppState {
  if (!state.legacyAndroid) return state;
  const settings = state.legacyAndroid.preferences.settings ?? {};
  const stage = settings.onboarding_language_stage_v1;
  const explicitlyPending = stage === 'LANGUAGE' || stage === 'INTRO_PENDING';
  const existingPreferences = Object.values(state.legacyAndroid.preferences).some(
    (file) => Object.keys(file).length > 0,
  );
  const existingInstallation = existingPreferences || state.legacyAndroid.databaseVersion > 0;
  return {
    ...state,
    surahPositions: restoreSurahPositions(
      state.surahPositions,
      state.legacyAndroid.readerState,
      state.cursor,
    ),
    preferences: {
      ...state.preferences,
      theme: isThemeMode(settings.theme_mode) ? settings.theme_mode : state.preferences.theme,
      // Older Android installs had settings before the explicit entry-stage flag existed.
      // This function runs only after a new import, never over later RN user choices.
      onboardingComplete:
        state.preferences.onboardingComplete || (!explicitlyPending && existingInstallation),
      hifzColorsEnabled:
        typeof settings.hifz_tint_enabled === 'boolean'
          ? settings.hifz_tint_enabled
          : state.preferences.hifzColorsEnabled,
    },
  };
}
