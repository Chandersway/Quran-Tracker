import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppNavigation } from '../../../app/navigation/types';
import { progressForGoal } from '../../../domain/goals';
import { localDate } from '../../../domain/localDate';
import { readingUnitLabelKey } from '../../../domain/readingUnit';
import { useI18n } from '../../../i18n';
import { IconButton, T } from '../../../shared/components';
import { ProgressRing } from '../../../shared/components/ProgressRing';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';
import { StatisticsSurface } from '../../practice/components/StatisticsSurface';

export function TodayReadingCard() {
  const { state } = useAppStore();
  const { t, locale } = useI18n();
  const p = usePalette();
  const nav = useAppNavigation();
  const today = localDate();
  const day = state.goalDays.find((item) => item.goalId === 1 && item.date === today) ?? {
    goalId: 1,
    date: today,
    unit: state.goal.unit,
    target: state.goal.target,
    extra: 0,
    resolution: '',
  };
  const progress = progressForGoal(day, state.history);
  const fraction = progress.target > 0 ? Math.min(1, progress.done / progress.target) : 0;
  return (
    <StatisticsSurface
      ornament="zellij"
      style={{ backgroundColor: p.surface, borderRadius: 20, padding: 16, overflow: 'hidden' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <ProgressRing
          size={76}
          value={fraction}
          label={t('app.dailyGoal')}
          primary={progress.done.toLocaleString(locale, { maximumFractionDigits: 1 })}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('app.readingGoal')}
          onPress={() => nav.navigate('Goals')}
          style={{ flex: 1, minHeight: 48, gap: 2 }}
        >
          <T bold size={19}>
            {t('app.today')}
          </T>
          <T
            muted
            size={13}
          >{`${progress.done.toLocaleString(locale, { maximumFractionDigits: 1 })} / ${progress.target.toLocaleString(locale)} ${t(readingUnitLabelKey(day.unit))}`}</T>
          {fraction >= 1 && (
            <T size={12} color={p.primary}>
              {t('app.dailyGoalReached')}
            </T>
          )}
          <T size={12} color={p.clay}>
            {t('app.readingGoal')} ›
          </T>
        </Pressable>
        <IconButton
          name="plus"
          label={t('app.quickCheckIn')}
          selected
          onPress={() => nav.navigate('Goals', { quickCheckIn: true })}
        />
      </View>
    </StatisticsSurface>
  );
}
