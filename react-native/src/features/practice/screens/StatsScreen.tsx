import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useAppNavigation } from '../../../app/navigation/types';
import { explicitAssessments, reviewDue } from '../../../domain/hifz';
import { statsOverview } from '../../../domain/statistics';
import { longestStreak } from '../../../domain/statisticsInsights';
import { sourceText, useI18n } from '../../../i18n';
import { Button, Card, Empty, ProgressBar, Screen, Segments, T } from '../../../shared/components';
import { ProgressRing } from '../../../shared/components/ProgressRing';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';
import { ArabicWatermark } from '../components/ArabicWatermark';
import { ReadingStatisticsOverview } from '../components/ReadingStatisticsOverview';
import { StatisticsSurface } from '../components/StatisticsSurface';
import {
  DailyGoalCard,
  HizbGrid,
  InsightCard,
  KhatmaCard,
  KpiTile,
  ReadingBars,
  ReadingHeatmap,
} from '../components/StatsInsights';
import { useGroupContributions } from '../hooks/useGroupContributions';

type StatsTab = 'reading' | 'hifz' | 'groups';

export function StatsScreen() {
  const p = usePalette();
  const { state, dispatch } = useAppStore();
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<StatsTab>('reading');
  const overview = useMemo(
    () => statsOverview(state.history, state.progress),
    [state.history, state.progress],
  );
  const best = useMemo(() => longestStreak(state.history), [state.history]);
  const number = (value: number) => value.toLocaleString(locale);

  function confirmClear() {
    Alert.alert(t('ui.stats.clearTitle'), t('ui.stats.clearMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('ui.stats.clearConfirm'),
        style: 'destructive',
        onPress: () => dispatch({ type: 'stats/clear' }),
      },
    ]);
  }

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <StatisticsSurface style={[styles.header, { borderBottomColor: p.line }]}>
          <ArabicWatermark label={sourceText('app.stats', 'ar')} large />
          <T size={34} bold>
            {t('ui.stats.title')}
          </T>
          <T muted>{t('ui.stats.subtitle')}</T>
        </StatisticsSurface>
        <View style={styles.kpis}>
          <KpiTile value={number(overview.streak)} label={t('agenda.stats.currentStreak')} />
          <KpiTile
            value={number(Math.max(best, overview.streak))}
            label={t('ui.stats.longestStreak')}
          />
          <KpiTile value={number(overview.activeDays)} label={t('agenda.stats.activeDays')} />
          <KpiTile value={number(overview.pages)} label={t('stats.pagesRead')} />
        </View>
        <Segments
          value={tab}
          onChange={setTab}
          options={[
            { value: 'reading', label: t('ui.stats.tabReading') },
            { value: 'hifz', label: t('ui.stats.tabHifz') },
            { value: 'groups', label: t('ui.stats.tabGroups') },
          ]}
        />
        {tab === 'reading' ? <ReadingTab /> : tab === 'hifz' ? <HifzTab /> : <GroupsTab />}
        <View style={[styles.clear, { borderTopColor: p.line }]}>
          <Button
            title={t('ui.stats.clearAction')}
            icon="trash-2"
            variant="danger"
            onPress={confirmClear}
            testID="stats-clear"
          />
          <T muted size={12}>
            {t('ui.stats.clearMessage')}
          </T>
        </View>
      </View>
    </Screen>
  );
}

function ReadingTab() {
  const { state } = useAppStore();
  return (
    <View style={{ gap: 16 }}>
      <ReadingHeatmap history={state.history} />
      <ReadingBars history={state.history} />
      <DailyGoalCard goalDays={state.goalDays} history={state.history} />
      <KhatmaCard history={state.history} progress={state.progress} />
      <HizbGrid progress={state.progress} mode="read" />
      <ReadingStatisticsOverview embedded />
    </View>
  );
}

function HifzTab() {
  const { state } = useAppStore();
  const { t, format, locale } = useI18n();
  const assessments = useMemo(
    () => explicitAssessments(state.progress).filter((item) => item.kind === 'hizb'),
    [state.progress],
  );
  const mastery = assessments.length
    ? Math.floor(assessments.reduce((sum, item) => sum + item.score, 0) / assessments.length)
    : null;
  const now = Date.now();
  const due = assessments
    .filter((item) => reviewDue(item, now) <= 0)
    .sort((a, b) => a.score - b.score);
  return (
    <View style={{ gap: 16 }}>
      <InsightCard
        title={t('inline.StatsScreen.47a2e98e72')}
        hint={t('inline.StatsScreen.0306a1b5dd')}
      >
        <View style={{ alignItems: 'center', gap: 16 }}>
          <ProgressRing
            value={(mastery ?? 0) / 100}
            label={t('inline.StatsScreen.47a2e98e72')}
            primary={mastery === null ? '—' : `${mastery.toLocaleString(locale)}%`}
            size={168}
          />
          <T muted>
            {format(
              'hifz.assessed',
              assessments.length.toLocaleString(locale),
              (60).toLocaleString(locale),
            )}
          </T>
        </View>
      </InsightCard>
      <HizbGrid progress={state.progress} mode="memorized" />
      <InsightCard title={t('ui.stats.reviewsDue')}>
        {due.length ? (
          due.map((item) => (
            <View key={item.number} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T>{format('common.hizbNumber', item.number)}</T>
                <T bold>{item.score.toLocaleString(locale)}%</T>
              </View>
              <ProgressBar
                value={item.score / 100}
                label={format('common.hizbNumber', item.number)}
              />
            </View>
          ))
        ) : (
          <T muted>{t('ui.stats.reviewsNone')}</T>
        )}
      </InsightCard>
    </View>
  );
}

function GroupsTab() {
  const nav = useAppNavigation();
  const { t, format, locale } = useI18n();
  const { state, reload } = useGroupContributions(true);
  if (state.status === 'unavailable')
    return <Empty icon="users" title="app.groups" message="account.supabaseMissing" />;
  if (state.status === 'loading') return <T muted>{t('common.loading')}</T>;
  if (state.status === 'signedOut')
    return (
      <Empty
        icon="users"
        title="app.groups"
        message="ui.stats.groupsSignedOut"
        action="groups.accountRequired.action"
        onAction={() => nav.navigate('Account')}
      />
    );
  if (state.status === 'error')
    return (
      <Empty
        icon="alert-circle"
        title="app.groups"
        message="ui.stats.groupsError"
        action="ui.stats.retry"
        onAction={reload}
      />
    );
  if (!state.groups.length)
    return <Empty icon="users" title="app.groups" message="ui.stats.groupsEmpty" />;
  return (
    <View style={{ gap: 16 }}>
      {state.groups.map((group) => (
        <Card key={group.code} style={{ gap: 10 }}>
          <T translate={false} bold size={19}>
            {group.name}
          </T>
          <T>
            {format(
              'ui.stats.groupShare',
              group.myPages.toLocaleString(locale),
              Math.round(group.share * 100).toLocaleString(locale),
            )}
          </T>
          <ProgressBar value={group.share} label={group.name} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 }}>
            <T muted size={13}>
              {t('agenda.stats.currentStreak')}: {group.myStreak.toLocaleString(locale)}
            </T>
            {group.rank !== null ? (
              <T muted size={13}>
                {format(
                  'ui.stats.groupRank',
                  group.rank.toLocaleString(locale),
                  group.members.toLocaleString(locale),
                )}
              </T>
            ) : null}
          </View>
          {group.goal.target !== null ? (
            <View style={{ gap: 6 }}>
              <T muted size={13}>
                {format(
                  'ui.stats.groupGoal',
                  group.goal.achieved.toLocaleString(locale),
                  group.goal.target.toLocaleString(locale),
                )}
              </T>
              <ProgressBar value={group.goal.fraction} label={group.name} />
            </View>
          ) : null}
          <Button
            title={t('groups.open')}
            variant="quiet"
            icon="chevron-right"
            mirrorInRtl
            onPress={() => nav.navigate('Group', { code: group.code })}
            style={{ alignSelf: 'flex-start' }}
          />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  clear: { gap: 12, paddingTop: 24, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
});
