import React from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import type { StatsDistribution, StatsReadingBucket } from '../../../domain/statistics';
import { sourceText, useI18n } from '../../../i18n';
import { Icon, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { ReadingDistributionRing } from './ReadingDistributionRing';
import { StatisticsSurface } from './StatisticsSurface';
import { ArabicWatermark } from './ArabicWatermark';

const shortLabels = {
  nl: {
    type: 'Eenheid',
    hizb: 'Hizb',
    surah: 'Soera',
    registrations: 'Leesregistraties',
    all: 'Alle statistieken',
  },
  en: {
    type: 'Unit',
    hizb: 'Hizb',
    surah: 'Surah',
    registrations: 'Reading entries',
    all: 'All statistics',
  },
  ar: {
    type: 'الوحدة',
    hizb: 'الحزب',
    surah: 'السورة',
    registrations: 'سجلّات القراءة',
    all: 'جميع الإحصاءات',
  },
};

export function ReadingStatisticsSummary({
  buckets,
  colors,
  titles,
  label,
  pages,
  ayahs,
  onSelect,
  onOpen,
}: {
  buckets: Record<StatsDistribution, StatsReadingBucket[]>;
  colors: string[];
  titles: Record<StatsDistribution, string>;
  label: (kind: StatsDistribution, bucket: StatsReadingBucket) => string;
  pages: number;
  ayahs: number;
  onSelect: (kind: StatsDistribution, key: string | null) => void;
  onOpen: () => void;
}) {
  const p = usePalette();
  const { t, format, locale } = useI18n();
  const { width, fontScale } = useWindowDimensions();
  const labels = shortLabels[locale];
  const stacked = width < 350 || fontScale > 1.3;
  const size = stacked ? 78 : Math.min(104, Math.floor((Math.min(width, 880) - 112) / 3));
  return (
    <StatisticsSurface
      ornament="lattice"
      style={{
        backgroundColor: p.surface,
        borderRadius: 20,
        padding: 20,
        gap: 20,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <ArabicWatermark label={sourceText('app.stats', 'ar')} />
        <View style={{ flex: 1 }}>
          <T bold size={32} style={{ fontVariant: ['tabular-nums'] }}>
            {pages.toLocaleString(locale)}
          </T>
          <T size={13} muted>
            {t('stats.pagesRead')}
          </T>
          <T size={11} muted>
            {format('stats.ayahEquivalent', ayahs.toLocaleString(locale))}
          </T>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.all}
          onPress={onOpen}
          style={({ pressed }) => ({
            minHeight: 48,
            minWidth: 48,
            borderRadius: 24,
            backgroundColor: p.subtle,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Icon
            name={locale === 'ar' ? 'arrow-up-left' : 'arrow-up-right'}
            size={21}
            color={p.primary}
          />
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: stacked ? 'column' : 'row',
          gap: stacked ? 20 : 12,
        }}
      >
        {(['type', 'hizb', 'surah'] as const).map((kind) => (
          <View
            key={kind}
            style={{
              flex: stacked ? undefined : 1,
              flexDirection: stacked ? 'row' : 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <ReadingDistributionRing
              entries={buckets[kind]}
              colors={colors}
              size={size}
              title={titles[kind]}
              onSelect={(key) => onSelect(kind, key)}
            />
            <View
              style={{
                flex: stacked ? 1 : undefined,
                alignItems: stacked ? 'flex-start' : 'center',
                gap: 3,
              }}
            >
              <T bold size={13}>
                {labels[kind]}
              </T>
              <T size={11} muted style={{ textAlign: stacked ? 'auto' : 'center' }}>
                {buckets[kind][0] ? label(kind, buckets[kind][0]!) : '—'}
              </T>
            </View>
          </View>
        ))}
      </View>
      <T size={11} muted>
        {labels.registrations} · {t('inline.StatsScreen.e4eb090acd')}
      </T>
    </StatisticsSurface>
  );
}
