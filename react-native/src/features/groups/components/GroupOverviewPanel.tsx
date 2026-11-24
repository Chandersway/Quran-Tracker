import React, { useState } from 'react';
import { View } from 'react-native';
import { useI18n } from '../../../i18n';
import type { Backend } from '../../../services/backend/backend';
import type { Group } from '../../../services/backend/types';
import type { GroupLeaderboardRow } from '../../../services/groups/groupTypes';
import { groupDashboard } from '../../../services/groups/groupMetrics';
import { Card, Row, T } from '../../../shared/components';
import { groupProgressText, groupReadingLabel } from '../groupProgressCopy';
import { ResourceState, useGroupResource } from './groupUi';
import { GroupProgressSummary } from './GroupProgressSummary';
import { GroupMemberReadingSheet } from './GroupMemberReadingSheet';

export function GroupOverviewPanel({ backend, group }: { backend: Backend; group: Group }) {
  const { t, format, locale } = useI18n();
  const resource = useGroupResource(
    () => backend.groups.listLeaderboard(group.code),
    [backend, group.code],
    [] as GroupLeaderboardRow[],
  );
  const [member, setMember] = useState<GroupLeaderboardRow | null>(null);
  const summary = groupDashboard(resource.value);
  return (
    <View style={{ gap: 14 }}>
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      <GroupProgressSummary group={group} rows={resource.value} />
      <Card style={{ gap: 10 }}>
        <T bold size={20}>
          {t('group.bestReader')}
        </T>
        {(['bestWeek', 'bestMonth'] as const).map((period) => {
          const row = summary[period];
          return row ? (
            <View key={period}>
              <T muted>
                {groupProgressText(period === 'bestWeek' ? 'bestLast7' : 'bestLast30', locale)}
              </T>
              <Row
                title={row.displayName}
                translateTitle={false}
                subtitle={`${(period === 'bestWeek' ? row.weeklyPoints : row.monthlyPoints).toLocaleString(locale)} ${t('app.points')}`}
                translateSubtitle={false}
                onPress={() => setMember(row)}
              />
            </View>
          ) : null;
        })}
        {!summary.bestWeek && !summary.bestMonth ? (
          summary.bestTotal ? (
            <Row
              title={summary.bestTotal.displayName}
              translateTitle={false}
              subtitle={`${summary.bestTotal.totalPoints.toLocaleString(locale)} ${t('app.points')}`}
              translateSubtitle={false}
              onPress={() => setMember(summary.bestTotal)}
            />
          ) : (
            <T muted>{t('groups.reading.empty')}</T>
          )
        ) : null}
      </Card>
      <Card style={{ gap: 10 }}>
        <T bold size={20}>
          {t('group.recentActivity')}
        </T>
        {summary.recent.map(({ member: reader, entry }, index) => (
          <Row
            key={`${reader.userId}:${index}`}
            title={reader.displayName}
            translateTitle={false}
            subtitle={`${groupReadingLabel(entry, locale, t, format)} · ${new Date(`${entry.occurred_on}T12:00:00`).toLocaleDateString(locale)}`}
            translateSubtitle={false}
            onPress={() => setMember(reader)}
          />
        ))}
        {!summary.recent.length ? <T muted>{t('groups.reading.empty')}</T> : null}
      </Card>
      <GroupMemberReadingSheet member={member} onClose={() => setMember(null)} />
    </View>
  );
}
