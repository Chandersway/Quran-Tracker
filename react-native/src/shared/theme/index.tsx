import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '../../state/store';
import { light, palettes, type Palette } from './colors';
import { normalizeThemeMode, resolvedThemeMode } from '../../domain/themePreferences';
const Context = createContext(light);
const CardPatternsContext = createContext(true);
export function ThemeProvider({ children }: React.PropsWithChildren) {
  const { state } = useAppStore();
  const device = useColorScheme();
  const theme = resolvedThemeMode(normalizeThemeMode(state.preferences.theme), device);
  return (
    <Context.Provider value={palettes[theme]}>
      <CardPatternsContext.Provider value={state.preferences.cardPatterns}>
        {children}
      </CardPatternsContext.Provider>
    </Context.Provider>
  );
}
export const usePalette = (): Palette => useContext(Context);
/** Decorative layers subscribe only to this preference, not to the full app state. */
export const useCardPatterns = (): boolean => useContext(CardPatternsContext);
export type { Palette } from './colors';
export { isDarkPalette, palettes } from './colors';
export { space } from './spacing';
export { fonts } from './typography';
