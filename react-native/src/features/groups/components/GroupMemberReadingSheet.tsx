import React from 'react';
import { View } from 'react-native';
import { useI18n } from '../../../i18n';
import type { GroupLeaderboardRow } from '../../../services/groups/groupTypes';
import { groupReadingBounds, groupReadingPointLabel } from '../../../services/groups/groupReading';
import { Sheet, T } from '../../../shared/components';
import { groupProgressText, groupReadingLabel } from '../groupProgressCopy';
import { GroupReadingTotals } from './GroupProgressSummary';

export function GroupMemberReadingSheet({
  member,
  onClose,
}: {
  member: GroupLeaderboardRow | null;
  onClose: () => void;
}) {
  const { t, format, locale } = useI18n();
  return (
    <Sheet
      visible={member !== null}
      translateTitle={false}
      title={member?.displayName || t('groups.reading.title')}
      onClose={onClose}
    >
      <T muted style={{ marginBottom: 16 }}>
        {t('groups.reading.scope')}
      </T>
      {member ? (
        <View style={{ gap: 16, marginBottom: 24 }}>
          <T translate={false} bold>
            {member.totalPoints.toLocaleString(locale)} {t('app.points')}
          </T>
          <T translate={false}>
            {groupProgressText('streakDays', locale)}: {member.streak.toLocaleString(locale)}
            {' · '}
            {groupProgressText(member.activeToday ? 'readToday' : 'noReadingToday', locale)}
          </T>
          <GroupReadingTotals entries={member.entries} />
          <T muted size={13}>
            {groupProgressText('utcDays', locale)}
          </T>
        </View>
      ) : null}
      {member?.entries.map((entry, index) => {
        const bounds = groupReadingBounds(entry);
        return (
          <View key={`${entry.occurred_on}:${index}`} style={{ marginBottom: 16, gap: 5 }}>
            <T bold translate={false}>
              {Number.isFinite(Date.parse(entry.occurred_on))
                ? new Date(`${entry.occurred_on}T12:00:00`).toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : t('groups.reading.unknownDate')}
            </T>
            <T translate={false}>{groupReadingLabel(entry, locale, t, format)}</T>
            {bounds ? (
              <T translate={false} muted size={13}>
                {format(
                  'groups.reading.ayahRange',
                  groupReadingPointLabel(bounds.start, locale),
                  groupReadingPointLabel(bounds.end, locale),
                )}
              </T>
            ) : null}
          </View>
        );
      })}
      {member && !member.entries.length ? <T muted>{t('groups.reading.empty')}</T> : null}
    </Sheet>
  );
}
