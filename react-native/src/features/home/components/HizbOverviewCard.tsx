import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import {
  countHizbReadings,
  hizbDateRange,
  type HizbDateRange,
  type HizbPeriod,
} from '../../../domain/hizbAnalytics';
import { useAppStore } from '../../../state/store';
import { localDate } from '../../../domain/localDate';

import { useI18n } from '../../../i18n';
import { Button, Card, Notice, Segments, Sheet, T, s } from '../../../shared/components';
import { Calendar } from '../../../shared/components/Calendar';
import { usePalette } from '../../../shared/theme';

/** Home chart from HizbOverviewCard.kt and ReadingHistoryDao.hizbCounts. */
export function HizbOverviewCard() {
  const { state, ownerId } = useAppStore();
  const { t, locale } = useI18n();
  const p = usePalette();
  const owner = ownerId === null ? null : ownerId || 'guest';
  const [today, setToday] = useState(localDate());
  const [period, setPeriod] = useState<HizbPeriod>('Week');
  const [customRange, setCustomRange] = useState<HizbDateRange>(() => hizbDateRange('Week', today));
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState(customRange);
  const [choosing, setChoosing] = useState<'from' | 'through' | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setToday(localDate()), 60000);
    return () => clearInterval(interval);
  }, []);
  const range = period === 'Custom' ? customRange : hizbDateRange(period, today);
  const counts = countHizbReadings(state.history, range, owner ?? '');
  const maximum = Math.max(...counts.map((row) => row.count));
  const top = Math.ceil(Math.max(1, maximum) / 4) * 4;
  const height = expanded ? 280 : 150;
  const date = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString(locale, { dateStyle: 'medium' });
  const rangeText = `${date(range.from)} – ${date(range.through)}`;
  const valid = draft.from <= draft.through && draft.through <= today;
  return (
    <Card ornament="zellij" style={{ marginTop: 24, gap: 12 }}>
      <T size={21} bold>
        {t('hizbOverview.title')}
      </T>
      <Segments
        value={period}
        onChange={(value) => {
          setSelected(null);
          if (value === 'Custom') {
            setDraft(range);
            setCustom(true);
          } else setPeriod(value);
        }}
        options={(['Week', 'Month', 'Year', 'Custom'] as const).map((value) => ({
          value,
          label: t(`hizbOverview.${value}`),
        }))}
      />
      <T translate={false} size={12} muted>
        {rangeText}
      </T>
      {owner === null ? (
        <ActivityIndicator color={p.primary} />
      ) : maximum === 0 ? (
        <T muted>{t('hizbOverview.empty')}</T>
      ) : (
        <>
          <View style={{ flexDirection: 'row', direction: 'ltr', gap: 8 }}>
            <View style={{ width: 28, height, justifyContent: 'space-between' }}>
              {[4, 3, 2, 1, 0].map((step) => (
                <T translate={false} key={step} muted size={10}>
                  {((top * step) / 4).toLocaleString(locale)}
                </T>
              ))}
            </View>
            <ScrollView
              horizontal
              testID="hizb_chart"
              style={{ flex: 1, minWidth: 0, height: height + 28 }}
              contentContainerStyle={{ flexDirection: 'row', direction: 'ltr' }}
              showsHorizontalScrollIndicator
            >
              {counts.map((row) => (
                <Pressable
                  key={row.hizbNumber}
                  testID={`hizb_bar_${row.hizbNumber}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('hizbOverview.hizb')} ${row.hizbNumber.toLocaleString(locale)}, ${row.count.toLocaleString(locale)} ${t('hizbOverview.count')}`}
                  accessibilityState={{ selected: selected === row.hizbNumber }}
                  onPress={() => setSelected(row.hizbNumber)}
                  style={{ width: 48, alignItems: 'center' }}
                >
                  <View style={{ height, justifyContent: 'flex-end', width: 24 }}>
                    <View
                      style={{
                        height: Math.max(1, (height * row.count) / top),
                        backgroundColor: selected === row.hizbNumber ? p.blue : p.primary,
                        borderTopLeftRadius: 3,
                        borderTopRightRadius: 3,
                      }}
                    />
                  </View>
                  <T translate={false} size={12} style={{ paddingTop: 6 }}>
                    {row.hizbNumber.toLocaleString(locale)}
                  </T>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          {selected !== null && (
            <T translate={false} size={13}>
              {t('hizbOverview.hizb')} {selected.toLocaleString(locale)} ·{' '}
              {counts[selected - 1]!.count.toLocaleString(locale)} {t('hizbOverview.count')}
              {'\n'}
              {rangeText}
            </T>
          )}
          <T muted size={12}>
            {t('hizbOverview.hint')}
          </T>
          <Button
            title={t(expanded ? 'hizbOverview.collapse' : 'hizbOverview.expand')}
            variant="quiet"
            onPress={() => setExpanded((value) => !value)}
          />
        </>
      )}
      <Sheet
        visible={custom}
        title="hizbOverview.Custom"
        onClose={() => {
          setCustom(false);
          setChoosing(null);
        }}
      >
        {choosing ? (
          <>
            <Button
              title={t(`hizbOverview.${choosing}`)}
              variant="quiet"
              onPress={() => setChoosing(null)}
            />
            <Calendar
              value={draft[choosing]}
              onChange={(value) => {
                if (value <= today) {
                  setDraft((previous) => ({ ...previous, [choosing]: value }));
                  setChoosing(null);
                }
              }}
            />
          </>
        ) : (
          <>
            <View style={[s.row, { flexWrap: 'wrap' }]}>
              <Button
                title={`${t('hizbOverview.from')}: ${date(draft.from)}`}
                variant="secondary"
                onPress={() => setChoosing('from')}
              />
              <Button
                title={`${t('hizbOverview.through')}: ${date(draft.through)}`}
                variant="secondary"
                onPress={() => setChoosing('through')}
              />
            </View>
            {!valid && <Notice error message={t('hizbOverview.invalid')} />}
            <Button
              title="hizbOverview.done"
              disabled={!valid}
              onPress={() => {
                setCustomRange(draft);
                setPeriod('Custom');
                setSelected(null);
                setCustom(false);
              }}
              style={{ marginTop: 20 }}
            />
          </>
        )}
      </Sheet>
    </Card>
  );
}
