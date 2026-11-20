import React, { useId } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { usePalette } from '../theme';
import { s } from './styles';
import { CardOrnament, ornamentVariantForId, type CardOrnamentVariant } from './CardOrnament';

export function Card({
  children,
  color,
  style,
  ornament = true,
}: React.PropsWithChildren<{
  color?: string;
  style?: StyleProp<ViewStyle>;
  ornament?: boolean | CardOrnamentVariant;
}>) {
  const p = usePalette();
  const instanceId = useId();
  const surfaceStyle = [s.card, { backgroundColor: color ?? p.surface }, style];
  const resolved: ViewStyle = StyleSheet.flatten(surfaceStyle) ?? {};
  return (
    <View style={surfaceStyle}>
      {ornament && (
        <CardOrnament
          variant={typeof ornament === 'string' ? ornament : ornamentVariantForId(instanceId)}
          surface={
            typeof resolved.backgroundColor === 'string' ? resolved.backgroundColor : p.surface
          }
          radius={typeof resolved.borderRadius === 'number' ? resolved.borderRadius : 16}
        />
      )}
      {children}
    </View>
  );
}
