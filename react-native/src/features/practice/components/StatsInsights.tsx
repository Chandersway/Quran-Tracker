import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  dailyGoalSuccess,
  hizbCoverage,
  khatmaForecast,
  readingBars,
  readingHeatmap,
  type ReadingBarPeriod,
} from '../../../domain/statisticsInsights';
import { useI18n } from '../../../i18n';
import { ProgressBar, Segments, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import type { GoalDay, Progress, ReadingEntry } from '../../../state/models';
import { StatisticsSurface } from './StatisticsSurface';

export function InsightCard({
  title,
  hint,
  children,
}: React.PropsWithChildren<{ title: string; hint?: string }>) {
  const p = usePalette();
  return (
    <StatisticsSurface
      ornament="lattice"
      style={[styles.card, { borderColor: p.line, backgroundColor: p.surface }]}
    >
      <T bold size={20}>
        {title}
      </T>
      {children}
      {hint ? (
        <T muted size={12}>
          {hint}
        </T>
      ) : null}
    </StatisticsSurface>
  );
}

export function KpiTile({ value, label }: { value: string; label: string }) {
  const p = usePalette();
  return (
    <View style={[styles.kpi, { backgroundColor: p.surface, borderColor: p.line }]}>
      <T size={30} bold style={styles.numeral}>
        {value}
      </T>
      <T muted size={13}>
        {label}
      </T>
    </View>
  );
}

export function ReadingHeatmap({ history }: { history: readonly ReadingEntry[] }) {
  const p = usePalette();
  const { t, locale } = useI18n();
  const columns = useMemo(() => readingHeatmap(history), [history]);
  const shades = [p.subtle, p.lime, '#B9A774', p.blue, p.primary];
  const cell = 14;
  return (
    <InsightCard title={t('ui.stats.heatmapTitle')} hint={t('ui.stats.heatmapHint')}>
      <View
        accessibilityRole="image"
        accessibilityLabel={t('ui.stats.heatmapTitle')}
        style={{ flexDirection: 'row', gap: 3, alignSelf: 'center' }}
      >
        {columns.map((column) => (
          <View key={column[0]!.date} style={{ gap: 3 }}>
            {column.map((day) => (
              <View
                key={day.date}
                accessibilityLabel={`${new Date(`${day.date}T12:00:00`).toLocaleDateString(locale)}: ${day.pages}`}
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: 3,
                  backgroundColor: day.future ? 'transparent' : shades[day.level],
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' }}>
        <T muted size={11}>
          {t('ui.stats.less')}
        </T>
        {shades.map((color) => (
          <View
            key={color}
            style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }}
          />
        ))}
        <T muted size={11}>
          {t('ui.stats.more')}
        </T>
      </View>
    </InsightCard>
  );
}

export function ReadingBars({ history }: { history: readonly ReadingEntry[] }) {
  const p = usePalette();
  const { t, locale } = useI18n();
  const [period, setPeriod] = useState<ReadingBarPeriod>('day');
  const bars = useMemo(() => readingBars(history, period), [history, period]);
  const maximum = Math.max(1, ...bars.map((bar) => bar.pages));
  const label = (start: string) => {
    const date = new Date(`${start}T12:00:00`);
    // Arabic narrow month names collide (يناير/يونيو/يوليو all start with ي): use the month number.
    return period === 'month'
      ? date.toLocaleDateString(locale, { month: locale === 'ar' ? 'numeric' : 'narrow' })
      : period === 'week'
        ? date.toLocaleDateString(locale, { day: 'numeric', month: 'numeric' })
        : locale === 'ar'
          ? date.toLocaleDateString(locale, { day: 'numeric' })
          : date.toLocaleDateString(locale, { weekday: 'narrow' });
  };
  return (
    <InsightCard
      title={t('stats.pagesRead')}
      hint={
        period === 'week'
          ? t('ui.stats.barsWeekHint')
          : period === 'month'
            ? t('ui.stats.barsMonthHint')
            : undefined
      }
    >
      <Segments
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'day', label: t('ui.stats.barsDay') },
          { value: 'week', label: t('ui.stats.barsWeek') },
          { value: 'month', label: t('ui.stats.barsMonth') },
        ]}
      />
      {bars.some((bar) => bar.pages > 0) ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            height: 150,
            gap: 4,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: p.line,
            paddingBottom: 6,
          }}
        >
          {bars.map((bar) => (
            <View key={bar.key} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              {bar.pages > 0 ? (
                <T size={10} muted style={styles.numeral}>
                  {bar.pages.toLocaleString(locale)}
                </T>
              ) : null}
              <View
                style={{
                  width: '100%',
                  maxWidth: 22,
                  height: Math.max(3, (bar.pages / maximum) * 100),
                  backgroundColor: bar.current ? p.primary : bar.pages ? p.lime : p.subtle,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }}
              />
              <T size={10} muted>
                {label(bar.start)}
              </T>
            </View>
          ))}
        </View>
      ) : (
        <T muted>{t('ui.stats.barsEmpty')}</T>
      )}
    </InsightCard>
  );
}

export function DailyGoalCard({
  goalDays,
  history,
}: {
  goalDays: readonly GoalDay[];
  history: readonly ReadingEntry[];
}) {
  const { t, format, locale } = useI18n();
  const result = useMemo(() => dailyGoalSuccess(goalDays, history), [goalDays, history]);
  return (
    <InsightCard title={t('ui.stats.goalTitle')}>
      {result.total ? (
        <>
          <T size={34} bold style={styles.numeral}>
            {Math.round(result.fraction * 100).toLocaleString(locale)}%
          </T>
          <ProgressBar value={result.fraction} label={t('ui.stats.goalTitle')} />
          <T muted>
            {format(
              'ui.stats.goalRate',
              result.met.toLocaleString(locale),
              result.total.toLocaleString(locale),
            )}
          </T>
        </>
      ) : (
        <T muted>{t('ui.stats.goalEmpty')}</T>
      )}
    </InsightCard>
  );
}

export function KhatmaCard({
  history,
  progress,
}: {
  history: readonly ReadingEntry[];
  progress: Readonly<Record<string, Progress>>;
}) {
  const { t, format, locale } = useI18n();
  const forecast = useMemo(() => khatmaForecast(history, progress), [history, progress]);
  return (
    <InsightCard title={t('ui.stats.khatmaTitle')} hint={t('ui.stats.khatmaHint')}>
      {forecast.kind === 'forecast' ? (
        <>
          <T size={30} bold>
            {format('ui.stats.khatmaDays', forecast.days.toLocaleString(locale))}
          </T>
          <T muted>
            {format(
              'ui.stats.khatmaForecast',
              forecast.pagesPerDay.toLocaleString(locale, { maximumFractionDigits: 1 }),
              forecast.remainingPages.toLocaleString(locale),
              new Date(`${forecast.date}T12:00:00`).toLocaleDateString(locale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
            )}
          </T>
        </>
      ) : (
        <T muted>{t(forecast.kind === 'done' ? 'ui.stats.khatmaDone' : 'ui.stats.khatmaNone')}</T>
      )}
    </InsightCard>
  );
}

/** Sixty Hizb tiles; `mode` picks read quarters or memorisation. */
export function HizbGrid({
  progress,
  mode,
}: {
  progress: Readonly<Record<string, Progress>>;
  mode: 'read' | 'memorized';
}) {
  const p = usePalette();
  const { t, format, locale } = useI18n();
  const rows = useMemo(() => hizbCoverage(progress), [progress]);
  const count =
    mode === 'read'
      ? rows.reduce((sum, row) => sum + row.rubsRead, 0)
      : rows.filter((row) => row.memorized).length;
  const total = mode === 'read' ? 240 : 60;
  const quarterShades = [p.subtle, p.lime, '#B9A774', p.blue, p.primary];
  return (
    <InsightCard
      title={t(mode === 'read' ? 'ui.stats.coverageTitle' : 'ui.stats.memorizedTitle')}
      hint={t(mode === 'read' ? 'ui.stats.coverageHint' : 'ui.stats.memorizedHint')}
    >
      <T muted>
        {format('common.countOfTotal', count.toLocaleString(locale), total.toLocaleString(locale))}{' '}
        {t(mode === 'read' ? 'stats.rub' : 'app.hizb')}
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {rows.map((row) => {
          const filled = mode === 'read' ? row.rubsRead : row.memorized ? 4 : 0;
          const background = mode === 'read' ? quarterShades[filled]! : filled ? p.clay : p.subtle;
          return (
            <View
              key={row.hizb}
              accessibilityLabel={format('common.hizbNumber', row.hizb)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: background,
              }}
            >
              <T size={11} bold color={filled >= 3 ? p.onPrimary : p.muted}>
                {row.hizb.toLocaleString(locale)}
              </T>
            </View>
          );
        })}
      </View>
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 18,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  kpi: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  numeral: { fontVariant: ['tabular-nums'] },
});
