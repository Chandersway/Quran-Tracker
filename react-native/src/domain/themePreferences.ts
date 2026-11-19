/** Stable Android theme identifiers remain valid in the version-1 preferences record. */
export const themeModes = [
  'light',
  'dark',
  'pink',
  'mint',
  'lavender',
  'ember',
  'inferno',
  'ocean',
  'sand',
  'matte_forest',
  'matte_charcoal',
  'matte_manuscript',
  'matte_night',
  'matte_ocean',
  'matte_plum',
  'system',
] as const;

export type ThemeMode = (typeof themeModes)[number];
export type FixedThemeMode = Exclude<ThemeMode, 'system'>;

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (themeModes as readonly string[]).includes(value);
}

export function normalizeThemeMode(value: unknown): ThemeMode {
  return isThemeMode(value) ? value : 'system';
}

export function resolvedThemeMode(theme: ThemeMode, device: string | null): FixedThemeMode {
  return theme === 'system' ? (device === 'dark' ? 'dark' : 'light') : theme;
}
