import assert from 'node:assert/strict';
import test from 'node:test';
import { themeModes, normalizeThemeMode, resolvedThemeMode } from '../src/domain/themePreferences';
import { contrastRatio, isDarkPalette, palettes } from '../src/shared/theme/colors';
import { initialState } from '../src/state/models';
import { decodeState } from '../src/state/persistence/decodeState';
import { importedPresentation } from '../src/state/persistence/importedPresentation';
import { importLegacyRoomRows, type LegacyRoomRows } from '../src/migration/legacyRoom';
import { hydrateState, stateStorageKey } from '../src/state/persistence/hydrateState';
import { appearanceCopy } from '../src/features/account/appearanceCopy';

const emptyRows: LegacyRoomRows = {
  version: 20,
  progress: [],
  history: [],
  notes: [],
  plans: [],
  dailyGoals: [],
  goalDays: [],
  checkinRequests: [],
  journey: [],
};

test('all original themes, matte midnight and system survive persistence with localized names', () => {
  assert.equal(themeModes.length, 16);
  assert.equal(new Set(themeModes).size, 16);
  for (const theme of themeModes) {
    const saved = { ...initialState, preferences: { ...initialState.preferences, theme } };
    assert.equal(decodeState(JSON.stringify(saved)).preferences.theme, theme);
    for (const copy of Object.values(appearanceCopy)) assert.ok(copy.themes[theme]);
  }
  assert.equal(normalizeThemeMode('unknown'), 'system');
  assert.equal(normalizeThemeMode(undefined), 'system');
  assert.equal(resolvedThemeMode('system', 'dark'), 'dark');
  assert.equal(resolvedThemeMode('system', 'light'), 'light');
  assert.equal(resolvedThemeMode('system', null), 'light');
  assert.equal(resolvedThemeMode('pink', 'dark'), 'pink');
});

test('every palette keeps body, secondary, action and state text readable and uses the correct status-bar contrast', () => {
  const nightThemes = [
    'dark',
    'inferno',
    'matte_forest',
    'matte_charcoal',
    'matte_manuscript',
    'matte_night',
    'matte_ocean',
    'matte_plum',
  ];
  for (const [name, palette] of Object.entries(palettes)) {
    for (const foreground of ['ink', 'muted', 'primary', 'clay', 'blue'] as const) {
      for (const background of ['background', 'surface', 'subtle'] as const) {
        assert.ok(
          contrastRatio(palette[foreground], palette[background]) >= 4.5,
          `${name}: ${foreground} on ${background} must reach 4.5:1`,
        );
      }
    }
    for (const [foreground, background] of [
      ['onPrimary', 'primary'],
      ['onLime', 'lime'],
      ['danger', 'dangerWash'],
      ['ink', 'peach'],
      ['muted', 'peach'],
      ['blue', 'blueWash'],
    ] as const) {
      assert.ok(
        contrastRatio(palette[foreground], palette[background]) >= 4.5,
        `${name}: ${foreground} on ${background} must reach 4.5:1`,
      );
    }
    assert.equal(isDarkPalette(palette), nightThemes.includes(name), name);
  }
});

test('fresh Android imports activate every preserved theme without modifying the source snapshot', () => {
  for (const theme of themeModes) {
    const imported = importLegacyRoomRows(initialState, emptyRows, {
      settings: { theme_mode: theme, app_language: 'nl', hifz_tint_enabled: false },
    });
    const before = JSON.stringify(imported.legacyAndroid);
    const restored = importedPresentation(imported);
    assert.equal(restored.preferences.theme, theme);
    assert.equal(restored.preferences.onboardingComplete, true);
    assert.equal(restored.preferences.hifzColorsEnabled, false);
    assert.equal(restored.preferences.cardPatterns, true);
    assert.equal(JSON.stringify(restored.legacyAndroid), before);
  }
});

test('existing Android installations skip onboarding, while fresh and explicitly unfinished starts resume', () => {
  const imported = (settings: Record<string, string>) =>
    importedPresentation(importLegacyRoomRows(initialState, emptyRows, { settings }));
  assert.equal(imported({ app_language: 'nl' }).preferences.onboardingComplete, true);
  // emptyRows is still an existing v20 database. Kotlin LanguageEntryStore checks
  // the database file's existence, independently of whether any rows/settings exist.
  assert.equal(imported({}).preferences.onboardingComplete, true);
  assert.equal(importedPresentation(initialState).preferences.onboardingComplete, false);
  for (const stage of ['LANGUAGE', 'INTRO_PENDING']) {
    const state = imported({
      app_language: 'ar',
      onboarding_language_stage_v1: stage,
      onboarding_intro_step_v1: 'planning',
    });
    assert.equal(state.preferences.onboardingComplete, false);
    assert.equal(state.preferences.onboardingStep, stage === 'LANGUAGE' ? 'language' : 'planning');
  }
  for (const stage of ['COMPLETED', 'EXISTING_USER']) {
    assert.equal(
      imported({ onboarding_language_stage_v1: stage }).preferences.onboardingComplete,
      true,
    );
  }
});

test('successful first hydration activates presentation once; later RN choices survive reopening', async () => {
  const imported = importLegacyRoomRows(initialState, emptyRows, {
    settings: { theme_mode: 'inferno', app_language: 'ar', hifz_tint_enabled: false },
  });
  const data = new Map<string, string>();
  const storage = {
    async getItem(key: string) {
      return data.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
  let imports = 0;
  const importer = async () => {
    imports++;
    return { state: imported, imported: true, sourceFound: true, sourceVersion: 20, warnings: [] };
  };
  const first = await hydrateState(storage, importer);
  assert.equal(first.preferences.theme, 'inferno');
  assert.equal(first.preferences.onboardingComplete, true);
  for (const theme of ['light', 'dark', 'system', 'ocean'] as const) {
    data.set(
      stateStorageKey,
      JSON.stringify({
        ...first,
        preferences: {
          ...first.preferences,
          theme,
          hifzColorsEnabled: true,
          cardPatterns: false,
        },
      }),
    );
    const reopened = await hydrateState(storage, importer);
    assert.equal(reopened.preferences.theme, theme);
    assert.equal(reopened.preferences.hifzColorsEnabled, true);
    assert.equal(reopened.preferences.cardPatterns, false);
    assert.equal(reopened.legacyAndroid?.preferences.settings?.theme_mode, 'inferno');
  }
  assert.equal(imports, 1);
});
