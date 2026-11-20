import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { Group } from '../../../services/backend/types';
import type { GroupLeaderboardRow } from '../../../services/groups/groupTypes';
import { groupReadingTotals } from '../../../services/groups/groupMetrics';
import { canShareGroupProgress, groupProgressInput } from '../../../services/groups/groupProgress';
import { useI18n } from '../../../i18n';
import { Button, Card, Empty, Field, Notice, Row, Segments, T } from '../../../shared/components';
import { permitted, ResourceState, useGroupResource } from './groupUi';
import { groupProgressText, groupReadingLabel } from '../groupProgressCopy';
import { GroupProgressSummary } from './GroupProgressSummary';
import { GroupMemberReadingSheet } from './GroupMemberReadingSheet';

export function GroupProgressPanel({ backend, group }: { backend: Backend; group: Group }) {
  const { t, format, locale } = useI18n();
  const resource = useGroupResource(
    () => backend.groups.listLeaderboard(group.code),
    [backend, group.code],
    [] as GroupLeaderboardRow[],
  );
  const [period, setPeriod] = useState<'total' | 'week' | 'month'>('total');
  const [member, setMember] = useState<GroupLeaderboardRow | null>(null);
  const [unit, setUnit] = useState('page');
  const [amount, setAmount] = useState('1');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState('');
  const saving = useRef(false);
  const canShare = canShareGroupProgress(group);
  const points = (row: GroupLeaderboardRow) =>
    period === 'week' ? row.weeklyPoints : period === 'month' ? row.monthlyPoints : row.totalPoints;
  const sorted = [...resource.value].sort((left, right) => points(right) - points(left));
  let input: ReturnType<typeof groupProgressInput> | null = null;
  try {
    input = groupProgressInput(unit, amount, reference);
  } catch {
    /* Keep incomplete form editable. */
  }
  const shareMessage =
    message.trim() ||
    (input
      ? format(
          'app.groupReadProgressMessage',
          groupReadingLabel({ ...input, user_id: '', occurred_on: '' }, locale, t, format),
        )
      : '');
  async function save(share: boolean) {
    if (saving.current || resource.busy) return;
    saving.current = true;
    setSaved('');
    try {
      await resource.run(async () => {
        if (!permitted(group, 'progress.create') || (share && !canShare))
          throw new Error('GROUP_PROGRESS_FORBIDDEN');
        const value = groupProgressInput(unit, amount, reference);
        await backend.groups.recordProgress(
          group.code,
          value.unit,
          value.amount,
          value.source,
          share,
          share ? shareMessage : undefined,
        );
        setMessage('');
        setSaved(
          share
            ? format('app.groupProgressShared', group.name)
            : groupProgressText('saved', locale),
        );
      }, 'app.groupProgressShareFailed');
    } finally {
      saving.current = false;
    }
  }
  return (
    <View style={{ gap: 14 }}>
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      <GroupProgressSummary group={group} rows={resource.value} />
      <Segments
        value={period}
        options={[
          { value: 'total', label: t('app.groupProgress.total') },
          { value: 'week', label: t('app.groupProgress.week') },
          { value: 'month', label: t('app.groupProgress.month') },
        ]}
        onChange={setPeriod}
      />
      {sorted.map((row, index) => {
        const totals = groupReadingTotals(row.entries);
        return (
          <Row
            key={row.userId}
            title={`${(index + 1).toLocaleString(locale)}. ${row.displayName}`}
            translateTitle={false}
            translateSubtitle={false}
            subtitle={`${row.pages.toLocaleString(locale)} ${t('app.groupUnitOption.pages')} · ${totals.juz.toLocaleString(locale)} ${t('app.groupUnitOption.juzs')} · ${totals.hizb.toLocaleString(locale)} ${t('app.groupUnitOption.hizbs')} · ${totals.surah.toLocaleString(locale)} ${t('app.groupUnitOption.surahs')}\n${groupProgressText('streakDays', locale)}: ${row.streak.toLocaleString(locale)} · ${groupProgressText(row.activeToday ? 'readToday' : 'noReadingToday', locale)}`}
            trailing={
              <T bold>
                {points(row).toLocaleString(locale)} {t('app.points')}
              </T>
            }
            onPress={() => setMember(row)}
          />
        );
      })}
      {!resource.busy && !resource.error && !sorted.length ? (
        <Empty
          icon="activity"
          title={t('groups.reading.empty')}
          message={t('groups.reading.scope')}
        />
      ) : null}
      {permitted(group, 'progress.create') ? (
        <Card style={{ gap: 12 }}>
          <T size={20} bold>
            {t('app.groupProgress.addProgress')}
          </T>
          <Segments
            value={unit}
            options={['page', 'ayah', 'hizb', 'juz', 'surah', 'lesson', 'custom'].map((value) => ({
              value,
              label: t(`app.groupUnitOption.${value}`),
            }))}
            onChange={(value) => {
              setUnit(value);
              setReference('');
            }}
          />
          <Field
            label={t('app.groupAmount')}
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            maxLength={5}
          />
          {['hizb', 'juz', 'surah'].includes(unit) && Number(amount) === 1 ? (
            <Field
              label={t(
                unit === 'hizb'
                  ? 'app.groupHizbNumber'
                  : unit === 'juz'
                    ? 'app.groupJuzNumber'
                    : 'app.groupSurahNumber',
              )}
              value={reference}
              onChangeText={setReference}
              keyboardType="number-pad"
              maxLength={3}
            />
          ) : null}
          <Button
            title={groupProgressText('privateSave', locale)}
            loading={resource.busy}
            disabled={resource.busy || !input}
            onPress={() => void save(false)}
          />
          {canShare ? (
            <>
              <Field
                label={groupProgressText('shareOptional', locale)}
                value={message}
                onChangeText={setMessage}
                maxLength={500}
                multiline
              />
              <T muted size={13}>
                {groupProgressText('sharePreview', locale)}
              </T>
              <T translate={false}>{shareMessage}</T>
              <Button
                title={t('app.groupManagement.saveAndShare')}
                variant="secondary"
                disabled={resource.busy || !input}
                onPress={() => void save(true)}
              />
            </>
          ) : null}
          {saved ? <Notice message={saved} /> : null}
        </Card>
      ) : null}
      <GroupMemberReadingSheet member={member} onClose={() => setMember(null)} />
    </View>
  );
}
