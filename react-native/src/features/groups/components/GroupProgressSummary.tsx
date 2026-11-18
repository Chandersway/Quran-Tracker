import React from 'react';
import { View } from 'react-native';
import { useI18n } from '../../../i18n';
import type { Group } from '../../../services/backend/types';
import type { GroupLeaderboardRow, GroupProgressEntry } from '../../../services/groups/groupTypes';
import {
  groupDashboard,
  groupGoalProgress,
  groupReadingTotals,
} from '../../../services/groups/groupMetrics';
import { Card, ProgressBar, T } from '../../../shared/components';
import { groupProgressText } from '../groupProgressCopy';

function Metrics({ values }: { values: { label: string; value: number }[] }) {
  const { locale } = useI18n();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 16,
      }}
    >
      {values.map(({ label, value }) => (
        <View key={label} style={{ width: '50%', paddingEnd: 12, gap: 3 }}>
          <T translate={false} bold size={22}>
            {value.toLocaleString(locale)}
          </T>
          <T translate={false} muted size={13}>
            {label}
          </T>
        </View>
      ))}
    </View>
  );
}

export function GroupReadingTotals({ entries }: { entries: readonly GroupProgressEntry[] }) {
  const { t, locale } = useI18n();
  const totals = groupReadingTotals(entries);
  return (
    <Metrics
      values={[
        { label: groupProgressText('readings', locale), value: totals.readings },
        { label: groupProgressText('pageEquivalent', locale), value: totals.pages },
        { label: t('app.groupUnitOption.ayahs'), value: totals.ayahs },
        { label: t('group.manualPageProgress'), value: totals.manualPages },
        { label: t('app.groupUnitOption.juzs'), value: totals.juz },
        { label: t('app.groupUnitOption.hizbs'), value: totals.hizb },
        { label: t('app.groupUnitOption.surahs'), value: totals.surah },
      ]}
    />
  );
}

export function GroupProgressSummary({
  group,
  rows,
}: {
  group: Group;
  rows: readonly GroupLeaderboardRow[];
}) {
  const { t, locale } = useI18n();
  const totals = groupDashboard(rows);
  const goal = groupGoalProgress(rows, group);
  return (
    <>
      <Card style={{ gap: 14 }}>
        <T bold size={20}>
          {t('groups.detail.groupGoal')}
        </T>
        {goal.target ? (
          <>
            <T translate={false} bold size={24}>
              {goal.achieved.toLocaleString(locale)} / {goal.target.toLocaleString(locale)}{' '}
              {t(`app.groupUnitOption.${group.progress_unit}`)}
            </T>
            <ProgressBar value={goal.fraction} label={t('app.groupProgress.groupProgress')} />
            <T muted>{t(`app.groupGoalText.${group.goal_period}`)}</T>
          </>
        ) : (
          <T muted>{t('app.groupGoalText.noFixedGoal')}</T>
        )}
      </Card>
      <Card style={{ gap: 16 }}>
        <T bold size={20}>
          {t('groups.detail.communityProgress')}
        </T>
        <Metrics
          values={[
            { label: t('group.totalPoints'), value: totals.points },
            { label: t('group.activeToday'), value: totals.activeToday },
            { label: groupProgressText('readings', locale), value: totals.readings },
            { label: groupProgressText('pageEquivalent', locale), value: totals.pages },
            { label: t('app.groupUnitOption.juzs'), value: totals.juz },
            { label: t('app.groupUnitOption.hizbs'), value: totals.hizb },
            { label: t('app.groupUnitOption.surahs'), value: totals.surah },
          ]}
        />
        <T muted size={13}>
          {groupProgressText('utcDays', locale)}
        </T>
      </Card>
    </>
  );
}
