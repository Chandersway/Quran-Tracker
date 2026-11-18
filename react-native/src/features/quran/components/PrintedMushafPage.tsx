import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { gunzipSync, strFromU8 } from 'fflate';
import { Directory, File, Paths } from 'expo-file-system';
import { printedPages } from '../../../content/generated/printedPages';
import { getAyahs } from '../../../content/quran';
import {
  pageSegments,
  maknoonRatio,
  type Edition,
  type Segment,
} from '../../../content/mushafGeometry';
import { mushafFile } from '../../../services/mushaf/storage';
import { T } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { cropSegment, mushafCropZoom, uncropPoint } from '../layout/mushafCrop';

const cache = new Map<number, string>();
// Keep the original SVG tree stable while its native host changes zoom.
const OriginalSvg = React.memo(SvgXml);
async function warshPage(page: number): Promise<string> {
  const cached = cache.get(page);
  if (cached) return cached;
  const packaged = mushafFile('warsh_maknoon', page);
  let bytes: Uint8Array;
  if (packaged.exists) bytes = await packaged.bytes();
  else {
    let file: File | undefined;
    if (Platform.OS !== 'web') {
      const dir = new Directory(Paths.document, 'mushaf', 'warsh_maknoon');
      dir.create({ intermediates: true, idempotent: true });
      file = new File(dir, `${page}.svg`);
      if (file.exists) return file.text();
    }
    const response = await fetch(`https://maknoon.com/quran/warsh/${page}.svgz`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Wirdna/1.0)' },
    });
    if (!response.ok) throw new Error('rub.open.error');
    bytes = new Uint8Array(await response.arrayBuffer());
    const xml = strFromU8(bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes);
    if (!/<svg(?:\s|>)/i.test(xml)) throw new Error('rub.open.error');
    file?.write(xml);
    cache.set(page, xml);
    if (cache.size > 8) cache.delete(cache.keys().next().value!);
    return xml;
  }
  const xml = strFromU8(bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes);
  if (!/<svg(?:\s|>)/i.test(xml)) throw new Error('rub.open.error');
  cache.set(page, xml);
  if (cache.size > 8) cache.delete(cache.keys().next().value!);
  return xml;
}

/** Displays the original printed artwork. Geometry always belongs to its own edition. */
export function PrintedMushafPage({
  edition,
  page,
  maxWidth,
  maxHeight,
  zoom,
  retry,
  selected,
  onSelect,
  onError,
}: {
  edition: Edition;
  page: number;
  maxWidth: number;
  maxHeight: number;
  zoom: number;
  retry: number;
  selected: Segment | null;
  onSelect: (segment: Segment | null, page: number) => void;
  onError: (message: string) => void;
}) {
  const { format, t } = useI18n();
  const [xml, setXml] = useState<string | null>(null);
  const [svgZoom, setSvgZoom] = useState(zoom);
  useEffect(() => {
    if (svgZoom === zoom) return;
    // Resize the vector backing once the fingers settle, keeping the final
    // artwork sharp without reconciling every path during the live gesture.
    const settle = setTimeout(() => setSvgZoom(zoom), 120);
    return () => clearTimeout(settle);
  }, [zoom, svgZoom]);
  const [ratio, setRatio] = useState(
    edition === 'muhammadi'
      ? 990 / 456
      : edition === 'warsh_maknoon'
        ? maknoonRatio(page)
        : 1834 / 1260,
  );
  useEffect(() => {
    let active = true;
    setXml(null);
    if (edition === 'warsh_maknoon') {
      setRatio(maknoonRatio(page));
      void warshPage(page)
        .then((value) => {
          if (active) setXml(value);
        })
        .catch(() => {
          if (active) onError('rub.open.error');
        });
    } else if (edition === 'hafs_maknoon') {
      const file = mushafFile('hafs_maknoon', page);
      if (!file.exists) onError('rub.open.download');
      else
        Image.getSize(
          file.uri,
          (width, height) => {
            if (active && width > 0) setRatio(height / width);
          },
          () => {
            if (active) onError('rub.open.error');
          },
        );
    } else setRatio(edition === 'muhammadi' ? 990 / 456 : 1834 / 1260);
    return () => {
      active = false;
    };
  }, [edition, page, retry, onError]);
  const baseWidth = Math.max(1, Math.min(maxWidth, maxHeight / ratio));
  const width = baseWidth * zoom,
    height = width * ratio;
  const segments = pageSegments(edition, page);
  const asset = printedPages[edition === 'muhammadi' ? 'muhammadi' : 'hafs'][page];
  const crop = mushafCropZoom(edition);
  const cropLeft = -(width * (crop - 1)) / 2;
  const cropTop = -(height * (crop - 1)) / 2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={format('repeat.page', page)}
      onPress={(event) => {
        const { x, y } = uncropPoint(
          event.nativeEvent.locationX / width,
          event.nativeEvent.locationY / height,
          crop,
        );
        onSelect(
          segments.find(
            (row) => x >= row.x && x <= row.x + row.width && y >= row.y && y <= row.y + row.height,
          ) ?? null,
          page,
        );
      }}
      style={{ width, height, overflow: 'hidden', direction: 'ltr', backgroundColor: '#FFFEF5' }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', left: cropLeft, top: cropTop }}>
        {edition === 'warsh_maknoon' ? (
          xml ? (
            <View
              style={{
                width: baseWidth * svgZoom * crop,
                height: baseWidth * ratio * svgZoom * crop,
                transform: [{ scale: zoom / svgZoom }],
                transformOrigin: 'top left',
              }}
            >
              <OriginalSvg
                xml={xml}
                width={baseWidth * svgZoom * crop}
                height={baseWidth * ratio * svgZoom * crop}
              />
            </View>
          ) : (
            <ActivityIndicator style={{ marginTop: 40 }} />
          )
        ) : edition === 'hafs_maknoon' ? (
          <Image
            source={{ uri: mushafFile('hafs_maknoon', page).uri }}
            style={{ width: width * crop, height: height * crop }}
            resizeMode="contain"
            onError={() => onError('rub.open.error')}
          />
        ) : asset === undefined ? (
          <T>{t('rub.open.error')}</T>
        ) : (
          <Image
            source={asset}
            style={{ width, height }}
            resizeMode="contain"
            accessibilityLabel={segments
              .map((row) => getAyahs(row.surah)[row.ayah - 1]?.text ?? '')
              .join(' ')}
          />
        )}
      </View>
      {selected &&
        segments
          .filter((row) => row.surah === selected.surah && row.ayah === selected.ayah)
          .map((row) => cropSegment(row, crop))
          .map((row, index) => (
            <View
              key={index}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: row.x * width,
                top: row.y * height,
                width: row.width * width,
                height: row.height * height,
                backgroundColor: '#D5B56B44',
                borderRadius: 2,
              }}
            />
          ))}
    </Pressable>
  );
}
