import React, { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { RevealBlock } from '../../../shared/components/RevealBlock';
import {
  CardOrnament,
  ornamentVariantForId,
  type CardOrnamentVariant,
} from '../../../shared/components/CardOrnament';
import { usePalette } from '../../../shared/theme';

/** Opaque surfaces keep folded statistics from showing text behind them. */
export function StatisticsSurface({
  children,
  style,
  reveal = true,
  ornament = true,
}: React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  reveal?: boolean;
  ornament?: boolean | CardOrnamentVariant;
}>) {
  const p = usePalette();
  const instanceId = useId();
  const surfaceStyle = [{ backgroundColor: p.background }, style];
  const resolved: ViewStyle = StyleSheet.flatten(surfaceStyle) ?? {};
  const content = (
    <>
      {ornament && (
        <CardOrnament
          variant={typeof ornament === 'string' ? ornament : ornamentVariantForId(instanceId)}
          surface={
            typeof resolved.backgroundColor === 'string' ? resolved.backgroundColor : p.background
          }
          radius={typeof resolved.borderRadius === 'number' ? resolved.borderRadius : 0}
        />
      )}
      {children}
    </>
  );
  return reveal ? (
    <RevealBlock keepOpaque style={surfaceStyle}>
      {content}
    </RevealBlock>
  ) : (
    <View style={surfaceStyle}>{content}</View>
  );
}
