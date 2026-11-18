import React, { memo } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { useCardPatterns } from '../theme';

export type CardOrnamentVariant = 'arabesque' | 'zellij' | 'lattice';
type Strength = 'subtle' | 'regular';
type Placement = 'full' | 'start' | 'end';

// Three distinct bundled alpha stencils; shared image sources, no network requests.
const ornaments: Record<CardOrnamentVariant, ImageSourcePropType> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  arabesque: require('../../../assets/ornaments/rubbed-arabesque.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  zellij: require('../../../assets/ornaments/rubbed-zellij.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  lattice: require('../../../assets/ornaments/rubbed-lattice.png'),
};
const variants: readonly CardOrnamentVariant[] = ['arabesque', 'zellij', 'lattice'];
const presets: Record<CardOrnamentVariant, { strength: Strength; placement: Placement }> = {
  arabesque: { strength: 'regular', placement: 'full' },
  zellij: { strength: 'regular', placement: 'end' },
  lattice: { strength: 'subtle', placement: 'start' },
};

/** React's instance identity keeps the choice stable while a card is mounted. */
export function ornamentVariantForId(id: string): CardOrnamentVariant {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index++) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  }
  return variants[(hash >>> 0) % variants.length]!;
}

/** A tonal, worn plaster ornament. Only this decorative layer is transparent. */
export const CardOrnament = memo(function CardOrnament({
  surface,
  radius = 0,
  variant = 'arabesque',
  strength = presets[variant].strength,
  placement = presets[variant].placement,
}: {
  surface: string;
  radius?: number;
  variant?: CardOrnamentVariant;
  strength?: Strength;
  placement?: Placement;
}) {
  const enabled = useCardPatterns();
  if (!enabled) return null;
  const tone = ornamentTone(surface, strength);
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.crop, { borderRadius: radius }]}
    >
      <Image
        source={ornaments[variant]}
        accessible={false}
        fadeDuration={0}
        resizeMode="cover"
        style={[styles.image, styles[placement], tone]}
      />
    </View>
  );
});

/** Lift dark surfaces in their own hue; chalk needs a faint darker impression to be visible. */
function ornamentTone(surface: string, strength: Strength) {
  const hex = /^#([\da-f]{6})$/i.exec(surface)?.[1] ?? '1b2d25';
  const channels = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const luminance = (channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722) / 255;
  const lightSurface = luminance > 0.65;
  const destination = lightSurface ? 0 : 255;
  const amount = lightSurface ? 0.28 : 0.36;
  const tintColor = `#${channels
    .map((channel) =>
      Math.round(channel + (destination - channel) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
  return { tintColor, opacity: (lightSurface ? 0.24 : 0.3) * (strength === 'subtle' ? 0.75 : 1) };
}

const styles = StyleSheet.create({
  crop: { position: 'absolute', inset: 0, overflow: 'hidden' },
  image: { position: 'absolute', top: 0, height: '100%' },
  full: { start: 0, width: '100%' },
  start: { start: '-16%', width: '122%' },
  end: { end: '-16%', width: '122%' },
});
