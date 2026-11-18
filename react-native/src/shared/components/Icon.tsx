import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { usePalette } from '../theme';
import { useI18n } from '../../i18n';
import { mirroredIconScale } from '../../domain/layoutDirection';

export type IconName = React.ComponentProps<typeof Feather>['name'];
export function Icon({
  name,
  size = 22,
  color,
  mirrorInRtl = false,
}: {
  name: IconName;
  size?: number;
  color?: string;
  /** Use for semantic back/forward navigation, never for book/media geometry. */
  mirrorInRtl?: boolean;
}) {
  const p = usePalette();
  const { locale } = useI18n();
  return (
    <Feather
      name={name}
      size={size}
      color={color ?? p.ink}
      style={{ transform: [{ scaleX: mirroredIconScale(locale, mirrorInRtl) }] }}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    />
  );
}
