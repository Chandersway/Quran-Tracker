import React from 'react';
import { Image, View, type ImageProps } from 'react-native';
import { isCorsGroupStorageImage } from './groupImageSource';

type Props = Pick<ImageProps, 'source' | 'style' | 'resizeMode' | 'accessibilityLabel' | 'testID'>;

/** RN Web 0.21 Image uses no-cors loaders/CSS backgrounds and ignores crossOrigin.
 * A real CORS img permits signed private storage images under require-corp COEP.
 * Credentials stay in the signed URL; no account token is sent to image origins.
 */
export function GroupImage({
  source,
  style,
  resizeMode = 'cover',
  accessibilityLabel,
  testID,
}: Props) {
  const uri = source && typeof source === 'object' && 'uri' in source ? source.uri : undefined;
  if (!uri || !isCorsGroupStorageImage(uri))
    return (
      <Image
        source={source}
        style={style}
        resizeMode={resizeMode}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      />
    );
  return (
    <View style={[style, { overflow: 'hidden' }]} testID={testID}>
      <img
        src={uri}
        crossOrigin="anonymous"
        alt={accessibilityLabel ?? ''}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit:
            resizeMode === 'contain'
              ? 'contain'
              : resizeMode === 'stretch'
                ? 'fill'
                : resizeMode === 'center'
                  ? 'none'
                  : 'cover',
        }}
      />
    </View>
  );
}
