import type { FixedThemeMode } from '../../domain/themePreferences';

export const light = {
  background: '#F3EFE4',
  surface: '#FFFDF6',
  ink: '#18382E',
  muted: '#53685D',
  line: '#D9DDCF',
  primary: '#1D493A',
  onPrimary: '#FFF9EB',
  lime: '#D9C69E',
  onLime: '#243A2D',
  clay: '#934B34',
  peach: '#F0DFD1',
  blue: '#315B60',
  blueWash: '#DFEAE4',
  subtle: '#E7ECE1',
  danger: '#A2322D',
  dangerWash: '#FBE6DF',
};
export const dark: typeof light = {
  background: '#111F1A',
  surface: '#1B2D25',
  ink: '#F1F3E9',
  muted: '#B6C8BA',
  line: '#344A3E',
  primary: '#D4DFBE',
  onPrimary: '#182E1E',
  lime: '#5E563E',
  onLime: '#F4E3BC',
  clay: '#F0B497',
  peach: '#49352C',
  blue: '#B4D5CE',
  blueWash: '#263F3B',
  subtle: '#293C2E',
  danger: '#FFAFA8',
  dangerWash: '#4B2826',
};
export type Palette = typeof light;

// The original twelve choices keep their hue and light/night character within the
// current paper, ink and restrained-accent system. Every color is authored, never random.
export const palettes: Record<FixedThemeMode, Palette> = {
  light,
  dark,
  pink: {
    ...light,
    background: '#F8EBEF',
    surface: '#FFF8FA',
    ink: '#442C36',
    muted: '#71525F',
    line: '#E1CCD5',
    primary: '#793B58',
    subtle: '#F0DFE6',
    peach: '#F0DCD5',
    blueWash: '#E4E9E4',
  },
  mint: {
    ...light,
    background: '#EAF4EB',
    surface: '#F8FCF7',
    ink: '#213D30',
    muted: '#4D6B58',
    line: '#C9DECE',
    primary: '#285E45',
    subtle: '#DCECE0',
    blueWash: '#DAEBE7',
  },
  lavender: {
    ...light,
    background: '#F0EAF7',
    surface: '#FCF9FF',
    ink: '#382E49',
    muted: '#665775',
    line: '#D9CCE5',
    primary: '#604579',
    subtle: '#E6DDED',
    blueWash: '#E1E7EF',
  },
  ember: {
    ...light,
    background: '#F9EADD',
    surface: '#FFF8F0',
    ink: '#4C3025',
    muted: '#775544',
    line: '#E5CCB7',
    primary: '#8C402B',
    subtle: '#F0DDCB',
    peach: '#F1D8C9',
    clay: '#93452D',
  },
  inferno: {
    ...dark,
    background: '#150D0C',
    surface: '#2C1C19',
    ink: '#FFF0E5',
    muted: '#D6B9AB',
    line: '#573B32',
    primary: '#FFBB93',
    onPrimary: '#3D2014',
    subtle: '#3D2821',
    lime: '#524127',
    onLime: '#F8E7C5',
    peach: '#4D3025',
    clay: '#FFB68A',
    blueWash: '#283B38',
  },
  ocean: {
    ...light,
    background: '#E5F1F4',
    surface: '#F7FCFD',
    ink: '#203D47',
    muted: '#4A6771',
    line: '#C8DCE2',
    primary: '#2C5D70',
    subtle: '#D9E8EC',
    blue: '#315B70',
    blueWash: '#D8E9EE',
  },
  sand: {
    ...light,
    background: '#F5ECD8',
    surface: '#FFF9EB',
    ink: '#463A27',
    muted: '#6B5A43',
    line: '#DFD1B4',
    primary: '#67502B',
    subtle: '#EDE1C7',
    lime: '#DECDA9',
    onLime: '#44371F',
    peach: '#EEDBC5',
  },
  matte_forest: {
    ...dark,
    background: '#27392F',
    surface: '#31483A',
    ink: '#F1F3E5',
    muted: '#C5D1BD',
    line: '#52654E',
    primary: '#D9E0B3',
    onPrimary: '#293823',
    subtle: '#3B5140',
  },
  matte_charcoal: {
    ...dark,
    background: '#2D3134',
    surface: '#383C3F',
    ink: '#F3F0E8',
    muted: '#CAC8C0',
    line: '#575D5E',
    primary: '#DCD4B4',
    onPrimary: '#353328',
    subtle: '#43484A',
    blueWash: '#35494A',
  },
  matte_manuscript: {
    ...dark,
    background: '#3B3126',
    surface: '#4B3E2E',
    ink: '#FBF0D7',
    muted: '#D5C6A8',
    line: '#6C5A40',
    primary: '#ECD49C',
    onPrimary: '#43351E',
    subtle: '#564731',
    lime: '#655333',
    onLime: '#FFF0CD',
    peach: '#573D2C',
  },
};

/** WCAG relative luminance, also used to choose readable system bar content. */
export function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

export function contrastRatio(first: string, second: string): number {
  const values = [relativeLuminance(first), relativeLuminance(second)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

export function isDarkPalette(palette: Palette): boolean {
  return (
    contrastRatio('#FFFFFF', palette.background) > contrastRatio('#000000', palette.background)
  );
}
