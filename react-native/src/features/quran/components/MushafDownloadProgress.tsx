import React, { useState, useSyncExternalStore } from 'react';
import { Pressable, View } from 'react-native';
import { useI18n } from '../../../i18n';
import {
  mushafDownloads,
  type MushafDownloadSnapshot,
} from '../../../services/mushaf/mushafDownloads';
import { optionFor } from '../../../services/mushaf/library';
import { usePalette } from '../../../shared/theme';
import { downloadCopy, remainingDownloadTime } from '../model/mushafDownloadCopy';

const copy = {
  en: {
    open: 'Open download progress',
    failed: 'The Mushaf download stopped. Open downloads to try again.',
    checking: 'Preparing the Mushaf download',
  },
  nl: {
    open: 'Downloadvoortgang bekijken',
    failed: 'De mushaf-download is gestopt. Open downloads om het opnieuw te proberen.',
    checking: 'De mushaf-download wordt voorbereid',
  },
  ar: {
    open: 'عرض تقدم التنزيل',
    failed: 'توقف تنزيل المصحف. افتح التنزيلات للمحاولة مرة أخرى.',
    checking: 'جارٍ تحضير تنزيل المصحف',
  },
} as const;

/** Mounted above navigation: the line observes the task and never owns its lifetime. */
export function MushafDownloadProgress({ onOpen }: { onOpen: () => void }) {
  const snapshot = useSyncExternalStore(
    mushafDownloads.subscribe,
    mushafDownloads.getSnapshot,
    mushafDownloads.getSnapshot,
  );
  const [acknowledged, setAcknowledged] = useState<MushafDownloadSnapshot['lastTask']>(null);
  const { locale } = useI18n();
  const p = usePalette();
  const active = snapshot.active;
  const failed = snapshot.lastTask?.status === 'failed' && snapshot.lastTask !== acknowledged;
  if (!active && !failed) return null;

  const fraction = active?.fraction;
  const percent = fraction == null ? undefined : Math.floor(fraction * 100);
  const detail = failed
    ? copy[locale].failed
    : active?.status === 'checking'
      ? copy[locale].checking
      : active?.status === 'cancelling'
        ? downloadCopy[locale].cancelling
        : active?.stalled
          ? downloadCopy[locale].waiting
          : remainingDownloadTime(locale, active?.remainingSeconds ?? null);
  const title = active ? optionFor(active.edition).title : '';

  return (
    <Pressable
      testID="mushaf-download-progress"
      accessibilityRole="button"
      accessibilityLabel={[title, percent === undefined ? '' : `${percent}%`, detail]
        .filter(Boolean)
        .join('. ')}
      accessibilityHint={copy[locale].open}
      accessibilityValue={
        percent === undefined ? { text: detail } : { min: 0, max: 100, now: percent, text: detail }
      }
      hitSlop={{ top: 14, bottom: 14 }}
      onPress={() => {
        if (failed) setAcknowledged(snapshot.lastTask);
        onOpen();
      }}
      style={({ pressed }) => ({
        height: 4,
        backgroundColor: p.line,
        opacity: pressed ? 0.65 : 1,
        zIndex: 2,
      })}
    >
      <View
        pointerEvents="none"
        style={{
          height: 4,
          width: failed ? '100%' : fraction == null ? '24%' : `${fraction * 100}%`,
          backgroundColor: failed ? p.danger : p.primary,
          opacity: fraction == null && !failed ? 0.5 : 1,
          alignSelf: locale === 'ar' ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
  );
}
