import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ReadingEntry } from '../../../state/models';
import { statsHistoryGroups, type StatsHistoryGroupMode } from '../../../domain/statistics';
import { sourceText, useI18n } from '../../../i18n';
import { Empty, Icon, Segments, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { ArabicWatermark } from './ArabicWatermark';
import { StatisticsSurface } from './StatisticsSurface';

export function StatisticsHistory({
  history,
  renderRow,
}: {
  history: readonly ReadingEntry[];
  renderRow: (row: ReadingEntry) => React.ReactNode;
}) {
  const { t, locale, format } = useI18n();
  const p = usePalette();
  const [mode, setMode] = useState<StatsHistoryGroupMode>('day');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const groups = useMemo(
    () => statsHistoryGroups(history, mode, locale, t('app.week')),
    [history, mode, locale],
  );
  return (
    <View style={{ gap: 24 }}>
      <StatisticsSurface style={{ gap: 24 }}>
        <View style={styles.heading}>
          <ArabicWatermark label={sourceText('stats.readingHistory', 'ar')} />
          <T bold size={20}>
            {t('stats.readingHistory')}
          </T>
        </View>
        <Segments
          value={mode}
          onChange={setMode}
          options={(['day', 'week', 'month'] as const).map((value) => ({
            value,
            label: t(value === 'day' ? 'stats.groupByDay' : `app.${value}`),
          }))}
        />
      </StatisticsSurface>
      {!groups.length && <Empty title="stats.noHistory" message="stats.overviewEmpty" />}
      <View>
        {groups.map((group, index) => {
          const open = expanded[group.key] ?? index === 0;
          return (
            <StatisticsSurface
              key={group.key}
              style={{
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: p.line,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                testID={`stats-history-${group.key}`}
                onPress={() => setExpanded((current) => ({ ...current, [group.key]: !open }))}
                style={({ pressed }) => [
                  styles.groupHeading,
                  {
                    flexDirection: 'row',
                    backgroundColor: pressed ? p.subtle : 'transparent',
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <T bold>{group.title}</T>
                  <T muted size={12}>
                    {format('stats.actionsCount', group.items.length)}
                  </T>
                </View>
                <View style={[styles.disclosure, { borderColor: p.line }]}>
                  <Icon name={open ? 'minus' : 'plus'} size={18} color={p.primary} />
                </View>
              </Pressable>
              {open && (
                <View style={{ paddingBottom: 24 }}>
                  {group.items.map((item, itemIndex) =>
                    item.kind === 'entry' ? (
                      <View key={item.row.id}>{renderRow(item.row)}</View>
                    ) : (
                      <View
                        key={`hizb-${item.hizbNumber}-${itemIndex}`}
                        style={{
                          paddingVertical: 16,
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: p.line,
                          gap: 8,
                        }}
                      >
                        <T bold>
                          {item.rubNumbers.length === 4
                            ? format('common.hizbNumber', item.hizbNumber)
                            : format('stats.hizbRubRead', item.hizbNumber, item.rubNumbers.length)}
                        </T>
                        <T muted size={13}>
                          {item.rubNumbers.length === 4
                            ? t('stats.wholeHizb')
                            : item.rubNumbers
                                .map(
                                  (number) =>
                                    `${t('stats.rub')} ${['1/4', '2/4', '3/4', '4/4'][number - 1]}`,
                                )
                                .join(', ')}
                        </T>
                        {(item.rubNumbers.length === 4 ? [null] : item.rubNumbers).map(
                          (quarter) => (
                            <View key={quarter ?? 'whole'}>
                              {renderRow({
                                ...item.rows[0]!,
                                amount: 1,
                                contentType: 'hizb',
                                type: 'hizb',
                                surahName: `Hizb ${item.hizbNumber}${quarter === null ? '' : ` (${['1/4', '1/2', '3/4', '1'][quarter - 1]})`}`,
                              })}
                            </View>
                          ),
                        )}
                        {!!item.extraInfo && (
                          <T arabic size={16}>
                            {item.extraInfo}
                          </T>
                        )}
                      </View>
                    ),
                  )}
                </View>
              )}
            </StatisticsSurface>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    minHeight: 72,
    paddingVertical: 16,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  groupHeading: {
    minHeight: 80,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 16,
  },
  disclosure: {
    width: 36,
    height: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
