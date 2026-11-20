import React, { useState } from 'react';
import { View } from 'react-native';
import { T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { GroupImage } from './GroupImage';

/** Names are displayed alongside avatars; the repeated image is decorative to screen readers. */
export function FeedAvatar({
  name,
  uri,
  size = 32,
}: {
  name: string;
  uri?: string | null;
  size?: number;
}) {
  const p = usePalette();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const style = { width: size, height: size, borderRadius: size / 2 };
  return uri && failedUri !== uri ? (
    <GroupImage
      source={{ uri }}
      onError={() => setFailedUri(uri)}
      style={style}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  ) : (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        ...style,
        backgroundColor: p.subtle,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <T
        translate={false}
        bold
        size={Math.round(size * 0.42)}
        color={p.primary}
        maxFontSizeMultiplier={1.5}
      >
        {Array.from(name.trim())[0]?.toLocaleUpperCase() ?? '?'}
      </T>
    </View>
  );
}
