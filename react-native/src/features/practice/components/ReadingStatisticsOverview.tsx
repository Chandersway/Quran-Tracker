import { ReadingDistributionRing } from './ReadingDistributionRing';
import { ReadingStatisticsSummary } from './ReadingStatisticsSummary';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../../app/navigation/types';
import { chapterById } from '../../../content/quran';
import {
  newestFirst,
  statsHistoryOpening,
  statsHistoryRange,
  statsHistoryTitle,
  statsOverview,
  statsPeriodHistory,
  statsReadingBuckets,
  weeklyHistoryActivity,
  type StatsDistribution,
  type StatsReadingBucket,
  type StatsReadingPeriod,
} from '../../../domain/statistics';
import { sourceText, useI18n } from '../../../i18n';
import {
  Button,
  Card,
  Empty,
  IconButton,
  ProgressBar,
  Screen,
  Segments,
  T,
  s,
} from '../../../shared/components';
import { ProgressRing } from '../../../shared/components/ProgressRing';
import { StatisticsSurface } from './StatisticsSurface';
import { usePalette } from '../../../shared/theme';
import type { ReadingEntry } from '../../../state/models';
import { localDate } from '../../../domain/localDate';

import { useAppStore } from '../../../state/store';
import { ArabicWatermark } from '../components/ArabicWatermark';
import { StatisticsHistory } from '../components/StatisticsHistory';

const periodLabels = {
  all: 'inline.StatsReadingDetails.9755c8d7d4',
  week: 'inline.StatsReadingDetails.7f920bb639',
  month: 'inline.StatsReadingDetails.ffd7280513',
};

function StatisticsSection({
  title,
  arabicLabel,
  children,
  reveal = true,
}: React.PropsWithChildren<{
  title: string;
  arabicLabel?: string;
  reveal?: boolean;
}>) {
  const p = usePalette();
  return (
    <StatisticsSurface ornament="lattice" reveal={reveal} style={styles.section}>
      <View style={[styles.sectionHeading, { borderTopColor: p.line }]}>
        {arabicLabel && <ArabicWatermark label={arabicLabel} />}
        <T bold size={22} style={{ flexShrink: 1 }}>
          {title}
        </T>
      </View>
      {children}
    </StatisticsSurface>
  );
}

/** Shared Home/Stats circles use the same rows and detail membership. */
export function ReadingStatisticsOverview({
  home = false,
  embedded = false,
  beforeHistory,
}: {
  home?: boolean;
  /** Inside the Stats page tabs: the page owns the header, streaks, Hifz and reset. */
  embedded?: boolean;
  beforeHistory?: React.ReactNode;
}) {
  const p = usePalette();
  const nav = useAppNavigation();
  const { state, dispatch } = useAppStore();
  const { t, locale, format } = useI18n();
  const rtl = locale === 'ar';
  const [contentWidth, setContentWidth] = useState(0);
  const wide = contentWidth >= 600;
  const [period, setPeriod] = useState<StatsReadingPeriod>('all');
  const [detail, setDetail] = useState<{
    distribution: StatsDistribution;
    selected: string | null;
  } | null>(null);
  const history = useMemo(() => statsPeriodHistory(state.history, period), [state.history, period]);
  const buckets = useMemo(
    () => ({
      type: statsReadingBuckets(history, 'type'),
      hizb: statsReadingBuckets(history, 'hizb'),
      surah: statsReadingBuckets(history, 'surah'),
      juz: statsReadingBuckets(history, 'juz'),
    }),
    [history],
  );
  const titles = {
    type: t('stats.distributionByType'),
    hizb: t('stats.mostReadHizbRub'),
    surah: t('stats.mostReadSurahs'),
    juz: t('app.juz'),
  };
  const colors = [p.primary, p.blue, p.clay, p.lime, p.muted, '#5C6C86', '#998667', '#6A8D75'];
  const unitLabel = (unit: string) => {
    const keys: Record<string, string> = {
      page: 'app.groupUnitOption.page',
      pages: 'app.groupUnitOption.pages',
      ayah: 'app.groupUnitOption.ayah',
      ayahs: 'app.groupUnitOption.ayahs',
      surah: 'app.surah',
      juz: 'app.juz',
      hizb: 'app.hizbRub',
      rub: 'stats.rub',
    };
    return keys[unit] ? t(keys[unit]!) : t(unit);
  };
  const label = (kind: StatsDistribution, bucket: StatsReadingBucket) =>
    kind === 'juz'
      ? format('common.juzNumber', bucket.key)
      : kind === 'hizb'
        ? format('common.hizbNumber', bucket.key)
        : kind === 'surah'
          ? locale === 'ar'
            ? chapterById(Number(bucket.key)).nameAr
            : bucket.rows[0]?.surahName || chapterById(Number(bucket.key)).name
          : unitLabel(bucket.key);
  const selectedEntries = detail ? buckets[detail.distribution] : [];
  const selectedRows = (
    detail?.selected === null
      ? selectedEntries.flatMap((bucket) => bucket.rows)
      : (selectedEntries.find((bucket) => bucket.key === detail?.selected)?.rows ?? [])
  )
    .slice()
    .sort(newestFirst);
  const today = localDate();
  const periodOverview = useMemo(
    () => statsOverview(history, state.progress),
    [history, state.progress],
  );
  const overview = useMemo(
    () => statsOverview(state.history, state.progress),
    [state.history, state.progress],
  );
  const assessed = Object.values(state.progress).filter(
    (row) => row.type === 'hizb' && row.hasHifzScore && row.progress > 0,
  );
  const mastery = assessed.length
    ? Math.floor(
        assessed.reduce((sum, row) => sum + Math.min(100, row.progress), 0) / assessed.length,
      )
    : null;
  const activity = weeklyHistoryActivity(state.history);
  const maximum = Math.max(1, ...activity.map((day) => day.count));

  function referenceLabel(point: { surah: number; ayah: number }) {
    const chapter = chapterById(point.surah);
    const number = (n: number) => n.toLocaleString(locale, { useGrouping: false });
    return `${locale === 'ar' ? chapter.nameAr : chapter.name} (${number(point.surah)}:${number(point.ayah)})`;
  }
  function historyRow(row: ReadingEntry) {
    const range = statsHistoryRange(row);
    const opening = statsHistoryOpening(row);
    const page = row.mushafPage;
    const canOpen = Boolean(range || page);
    return (
      <Pressable
        accessibilityRole={canOpen ? 'button' : undefined}
        disabled={!canOpen}
        onPress={() => {
          setDetail(null);
          if (page)
            nav.navigate('Mushaf', {
              edition: page.edition,
              page: page.page,
              bookPresentation:
                page.bookPresentation ?? (page.edition === 'hafs' ? 'selectable' : 'original'),
              surah:
                range?.start.surah ?? (row.surahId >= 1 && row.surahId <= 114 ? row.surahId : 1),
              ayah: range?.start.ayah,
            });
          else if (range)
            nav.navigate('Mushaf', {
              surah: range.start.surah,
              ayah: range.start.ayah,
            });
        }}
        style={{
          paddingVertical: 16,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: p.line,
          gap: 8,
        }}
      >
        <T translate={false} bold>
          {statsHistoryTitle(row)}
        </T>
        <T translate={false} muted size={12}>
          {new Date(row.timestamp).toLocaleString(locale)} ·{' '}
          {t('inline.StatsReadingDetails.49e96d7cdf')}: {row.amount.toLocaleString(locale)}{' '}
          {unitLabel(row.type)}
        </T>
        {range && (
          <T translate={false} size={13} muted>
            {format(
              'groups.reading.ayahRange',
              referenceLabel(range.start),
              referenceLabel(range.end),
            )}
          </T>
        )}
        {opening && (
          <T arabic size={18}>
            {opening}
          </T>
        )}
      </Pressable>
    );
  }
  function clearReading() {
    Alert.alert(t('stats.clearHistoryTitle'), t('stats.clearHistoryMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('stats.clearHistoryConfirm'),
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'history/clear' });
          setDetail(null);
        },
      },
    ]);
  }
  const Container = home || embedded ? View : Screen;
  return (
    <Container>
      <View
        onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}
        style={styles.content}
      >
        {home ? (
          <View style={{ gap: 16 }}>
            <Segments
              value={period}
              onChange={setPeriod}
              options={(['all', 'week', 'month'] as const).map((value) => ({
                value,
                label: t(periodLabels[value]),
              }))}
            />
            <ReadingStatisticsSummary
              buckets={buckets}
              colors={colors}
              titles={titles}
              label={label}
              pages={periodOverview.pages}
              ayahs={periodOverview.ayahs}
              onSelect={(distribution, selected) => setDetail({ distribution, selected })}
              onOpen={() => nav.navigate('Stats')}
            />
            {beforeHistory}
            <StatisticsSurface style={{ paddingVertical: 12 }}>
              <T size={20} bold>
                {t('stats.recentHistory')}
              </T>
              {history.length ? (
                history
                  .slice()
                  .sort(newestFirst)
                  .slice(0, 3)
                  .map((row) => <View key={row.id}>{historyRow(row)}</View>)
              ) : (
                <T muted size={14} style={{ marginTop: 10 }}>
                  {t('stats.overviewEmpty')}
                </T>
              )}
              <Button
                title={t('stats.overviewTitle')}
                variant="quiet"
                icon="bar-chart-2"
                onPress={() => nav.navigate('Stats')}
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
              />
            </StatisticsSurface>
          </View>
        ) : (
          <>
            {!embedded && (
              <StatisticsSurface style={[styles.header, { borderBottomColor: p.line }]}>
                <ArabicWatermark label={sourceText('app.stats', 'ar')} large />
                <T size={home ? 28 : 34} bold>
                  {t(home ? 'stats.overviewTitle' : 'app.stats')}
                </T>
                {!home && <T muted>{format('stats.totalActions', overview.readActions)}</T>}
              </StatisticsSurface>
            )}
            {!home && !embedded && (
              <StatisticsSurface style={[s.row, { gap: 24, flexDirection: 'row' }]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <T size={38} bold>
                    {overview.streak.toLocaleString(locale)}
                  </T>
                  <T muted>{t('stats.streakTitle')}</T>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <T size={38} bold>
                    {overview.activeDays.toLocaleString(locale)}
                  </T>
                  <T muted>{t('agenda.stats.activeDays')}</T>
                </View>
              </StatisticsSurface>
            )}
            <StatisticsSurface>
              <Card style={{ gap: 24 }}>
                {overview.readActions ? (
                  <>
                    <View
                      style={[
                        s.row,
                        {
                          gap: 24,
                          alignItems: 'flex-start',
                          flexDirection: 'row',
                        },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 4 }}>
                        <T size={30} bold>
                          {overview.pages.toLocaleString(locale)}
                        </T>
                        <T muted>{t('stats.pagesRead')}</T>
                        <T muted size={12}>
                          {format('stats.ayahEquivalent', overview.ayahs.toLocaleString(locale))}
                        </T>
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <T size={30} bold>
                          {overview.points.toLocaleString(locale)}
                        </T>
                        <T muted>{t('app.points')}</T>
                        <T muted size={12}>
                          {t('stats.pointsExplain')}
                        </T>
                      </View>
                    </View>
                    <View
                      style={[
                        s.row,
                        {
                          gap: 24,
                          alignItems: 'flex-start',
                          flexDirection: 'row',
                        },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 4 }}>
                        <T bold size={24}>
                          {overview.surahReads.toLocaleString(locale)}
                        </T>
                        <T muted>{t('stats.surahsRead')}</T>
                        <T muted size={12}>
                          {format('common.countOfTotal', Math.min(114, overview.surahReads), 114)}
                        </T>
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <T bold size={24}>
                          {overview.rubDone.toLocaleString(locale)}
                        </T>
                        <T muted>{t('stats.rub')}</T>
                        <T muted size={12}>
                          {format('common.countOfTotal', overview.rubDone, 240)}
                        </T>
                      </View>
                    </View>
                    {(
                      [
                        { kind: 'juz', count: overview.juzDone, total: 30 },
                        { kind: 'hizb', count: overview.hizbDone, total: 60 },
                      ] as const
                    ).map((item) => (
                      <View key={item.kind} style={{ gap: 8 }}>
                        <View
                          style={[
                            s.row,
                            {
                              justifyContent: 'space-between',
                              flexDirection: 'row',
                            },
                          ]}
                        >
                          <T>{t(`app.${item.kind}`)}</T>
                          <T bold>{format('common.countOfTotal', item.count, item.total)}</T>
                        </View>
                        <ProgressBar
                          value={item.count / item.total}
                          label={t(`app.${item.kind}`)}
                        />
                      </View>
                    ))}
                    <T muted size={12}>
                      {format(
                        'stats.periodEquivalent',
                        overview.todayPages,
                        overview.weekPages,
                        overview.monthPages,
                      )}
                    </T>
                  </>
                ) : (
                  <Empty title="stats.noHistory" message="stats.overviewEmpty" />
                )}
              </Card>
            </StatisticsSurface>
            <StatisticsSurface style={{ gap: 12 }}>
              <T muted size={13}>
                {t('inline.StatsScreen.900af6875f')}
              </T>
              <Segments
                value={period}
                onChange={setPeriod}
                options={(['all', 'week', 'month'] as const).map((value) => ({
                  value,
                  label: t(periodLabels[value]),
                }))}
              />
            </StatisticsSurface>

            {(['type', 'hizb', 'surah'] as const).map((kind) => {
              const entries = buckets[kind];
              const total = entries.reduce((sum, bucket) => sum + bucket.rows.length, 0);
              return (
                <StatisticsSection
                  key={kind}
                  title={titles[kind]}
                  arabicLabel={sourceText(kind === 'type' ? 'app.stats' : `app.${kind}`, 'ar')}
                >
                  {total ? (
                    <>
                      <View
                        style={{
                          gap: 24,
                          flexDirection: wide ? 'row' : 'column',
                          alignItems: wide ? 'center' : 'stretch',
                        }}
                      >
                        <View
                          style={{
                            alignItems: 'center',
                            gap: 12,
                            ...(wide ? { flex: 1 } : {}),
                          }}
                        >
                          <ReadingDistributionRing
                            entries={entries}
                            colors={colors}
                            title={titles[kind]}
                            onSelect={(selected) => setDetail({ distribution: kind, selected })}
                          />

                          <T muted size={13}>
                            {t(periodLabels[period])}
                          </T>
                        </View>
                        <View style={{ flex: wide ? 1.3 : undefined }}>
                          {entries.map((bucket, index) => (
                            <Pressable
                              key={bucket.key}
                              accessibilityRole="button"
                              testID={`stats-${kind}-${bucket.key}`}
                              onPress={() =>
                                setDetail({
                                  distribution: kind,
                                  selected: bucket.key,
                                })
                              }
                              style={({ pressed }) => [
                                styles.legendRow,
                                {
                                  flexDirection: 'row',
                                  borderBottomColor: p.line,
                                  backgroundColor: pressed ? p.subtle : 'transparent',
                                },
                              ]}
                            >
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  backgroundColor: colors[index % colors.length],
                                }}
                              />
                              <T translate={false} size={14} style={{ flex: 1 }}>
                                {label(kind, bucket)}
                              </T>
                              <T
                                bold
                                size={14}
                                style={[
                                  styles.numeral,
                                  {
                                    minWidth: 42,
                                    textAlign: rtl ? 'left' : 'right',
                                  },
                                ]}
                              >
                                {bucket.rows.length.toLocaleString(locale)}×
                              </T>
                              <T
                                muted
                                size={13}
                                style={[
                                  styles.numeral,
                                  {
                                    minWidth: 58,
                                    textAlign: rtl ? 'left' : 'right',
                                  },
                                ]}
                              >
                                {((bucket.rows.length * 100) / total).toLocaleString(locale, {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })}
                                %
                              </T>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                      <Button
                        title="inline.StatsScreen.041b429dab"
                        variant="quiet"
                        onPress={() => setDetail({ distribution: kind, selected: null })}
                      />
                    </>
                  ) : (
                    <View style={{ alignItems: 'center', gap: 20 }}>
                      <ReadingDistributionRing
                        entries={entries}
                        colors={colors}
                        title={titles[kind]}
                        onSelect={(selected) => setDetail({ distribution: kind, selected })}
                      />
                      <Empty title="stats.noHistory" message="stats.overviewEmpty" />
                    </View>
                  )}
                  <T muted size={12}>
                    {t('inline.StatsScreen.e4eb090acd')}
                  </T>
                </StatisticsSection>
              );
            })}
            {!home && (
              <>
                {!embedded && (
                  <StatisticsSection
                    title={t('inline.StatsScreen.47a2e98e72')}
                    arabicLabel={sourceText('app.hifz', 'ar')}
                  >
                    <View style={{ alignItems: 'center', gap: 24 }}>
                      <ProgressRing
                        value={(mastery ?? 0) / 100}
                        label={t('inline.StatsScreen.47a2e98e72')}
                        primary={mastery === null ? '\u2014' : `${mastery.toLocaleString(locale)}%`}
                        size={188}
                      />
                      <T muted>
                        {format(
                          'hifz.assessed',
                          assessed.length.toLocaleString(locale),
                          (60).toLocaleString(locale),
                        )}
                      </T>
                    </View>
                    <T muted size={13}>
                      {t('inline.StatsScreen.0306a1b5dd')}
                    </T>
                  </StatisticsSection>
                )}
                {!embedded && (
                  <StatisticsSection title={t('stats.weeklyActivity')}>
                    {!activity.length ? (
                      <T muted>{t('stats.noWeeklyActivity')}</T>
                    ) : (
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          height: 176,
                          gap: 12,
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: p.line,
                          paddingBottom: 16,
                        }}
                      >
                        {activity.map(({ date: day, count }) => (
                          <View
                            key={day}
                            style={{
                              flex: 1,
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <T size={12} muted style={styles.numeral}>
                              {count.toLocaleString(locale)}
                            </T>
                            <View
                              style={{
                                width: '100%',
                                maxWidth: 32,
                                height: Math.max(5, (count / maximum) * 100),
                                backgroundColor: day === today ? p.primary : p.lime,
                                borderTopLeftRadius: 4,
                                borderTopRightRadius: 4,
                              }}
                            />
                            <T size={12} muted>
                              {new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
                                weekday: 'narrow',
                              })}
                            </T>
                          </View>
                        ))}
                      </View>
                    )}
                  </StatisticsSection>
                )}
                <StatisticsSection title={t('stats.recentHistory')} reveal={false}>
                  <StatisticsHistory history={state.history} renderRow={historyRow} />
                </StatisticsSection>
                <StatisticsSection title={t('agenda.stats.totalReadingTime')}>
                  <T size={30} bold style={styles.numeral}>
                    {format(
                      'audio.minutes',
                      Math.round(
                        state.focusSessions
                          .filter(
                            (session) =>
                              period === 'all' ||
                              statsPeriodHistory(
                                [
                                  {
                                    id: session.id,
                                    timestamp: session.finishedAt,
                                  } as ReadingEntry,
                                ],
                                period,
                              ).length > 0,
                          )
                          .reduce((sum, session) => sum + session.durationSeconds, 0) / 60,
                      ),
                    )}
                  </T>
                </StatisticsSection>
                {!embedded && (
                  <View
                    style={{
                      gap: 12,
                      paddingTop: 24,
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: p.line,
                    }}
                  >
                    <Button title="stats.clearData" variant="danger" onPress={clearReading} />
                    <T muted size={12}>
                      {t('stats.clearDescription')}
                    </T>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </View>
      <Modal
        visible={detail !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetail(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: '#00000066',
            direction: locale === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          <SafeAreaView
            edges={['bottom']}
            style={{
              height: '90%',
              maxWidth: 760,
              width: '100%',
              alignSelf: 'center',
              backgroundColor: p.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              gap: 12,
            }}
          >
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <T size={23} bold style={{ flex: 1 }}>
                {detail ? titles[detail.distribution] : ''}
              </T>
              <IconButton name="x" label="irab.close" onPress={() => setDetail(null)} />
            </View>
            <T muted size={13} testID="stats-detail-count">
              {t(periodLabels[period])} · {selectedRows.length.toLocaleString(locale)}{' '}
              {t(
                selectedRows.length === 1
                  ? 'inline.StatsReadingDetails.29c9c30e06'
                  : 'inline.StatsReadingDetails.18cd7d38f8',
              )}
            </T>
            <Segments
              value={detail?.selected ?? '__all'}
              onChange={(key) =>
                setDetail((current) =>
                  current ? { ...current, selected: key === '__all' ? null : key } : null,
                )
              }
              options={[
                {
                  value: '__all',
                  label: t('inline.StatsReadingDetails.a52ace420f'),
                },
                ...selectedEntries.map((bucket) => ({
                  value: bucket.key,
                  label: `${label(detail?.distribution ?? 'type', bucket)} (${bucket.rows.length})`,
                })),
              ]}
            />
            <T muted size={12}>
              {t('inline.StatsReadingDetails.9a7cb53af2')}
            </T>
            <FlatList
              testID="stats-detail-list"
              data={selectedRows}
              keyExtractor={(row) => row.id}
              renderItem={({ item }) => historyRow(item)}
              ListEmptyComponent={<T muted>{t('inline.StatsReadingDetails.4348568a7e')}</T>}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: { gap: 32 },
  header: {
    overflow: 'hidden',
    minHeight: 120,
    paddingVertical: 24,
    gap: 8,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  section: { gap: 24 },
  sectionHeading: {
    minHeight: 80,
    paddingVertical: 16,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  legendRow: {
    minHeight: 56,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  numeral: { fontVariant: ['tabular-nums'] },
});
