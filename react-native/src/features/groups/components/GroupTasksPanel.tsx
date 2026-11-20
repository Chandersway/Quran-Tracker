import React, { useState } from 'react';
import { View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { Group, GroupTask } from '../../../services/backend/types';
import { useI18n } from '../../../i18n';
import {
  Button,
  Card,
  Empty,
  Field,
  ProgressBar,
  Segments,
  Sheet,
  T,
} from '../../../shared/components';
import { ConfirmAction, permitted, ResourceState, useGroupResource } from './groupUi';

export function GroupTasksPanel({ backend, group }: { backend: Backend; group: Group }) {
  const { t, format, locale } = useI18n();
  const resource = useGroupResource(
    () => backend.groups.listTasks(group.code),
    [backend, group.code],
    [] as GroupTask[],
  );
  const [filter, setFilter] = useState<'active' | 'history'>('active');
  const [create, setCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('reading');
  const [unit, setUnit] = useState('page');
  const [target, setTarget] = useState('20');
  const [days, setDays] = useState('7');
  const [points, setPoints] = useState('0');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [managed, setManaged] = useState<GroupTask | null>(null);
  const rows = resource.value.filter((task) =>
    filter === 'active' ? task.status === 'active' : task.status !== 'active',
  );
  async function makeTask() {
    const amount = Number(target);
    const reward = Number(points);
    if (
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > 10000 ||
      !Number.isInteger(reward) ||
      reward < 0 ||
      reward > 1000
    )
      throw new Error('Invalid task target or points');
    await backend.groups.createTask(group.code, {
      title,
      description,
      taskType: type,
      targetValue: amount,
      targetUnit: unit,
      durationDays: days === 'none' ? null : Number(days),
      pointsReward: reward,
    });
    setCreate(false);
    setTitle('');
    setDescription('');
  }
  return (
    <View style={{ gap: 14 }}>
      <Segments
        value={filter}
        options={[
          {
            value: 'active',
            label: format(
              'groups.tasks.filter.active',
              resource.value.filter((task) => task.status === 'active').length,
            ),
          },
          {
            value: 'history',
            label: format(
              'groups.tasks.filter.history',
              resource.value.filter((task) => task.status !== 'active').length,
            ),
          },
        ]}
        onChange={setFilter}
      />
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      {permitted(group, 'task.create') ? (
        <Button
          title={t('groups.tasks.create')}
          icon="plus"
          disabled={resource.busy}
          onPress={() => setCreate(true)}
        />
      ) : null}
      {rows.map((task) => (
        <Card key={task.id} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <T translate={false} size={20} bold style={{ flex: 1 }}>
              {task.title}
            </T>
            {task.canManage ? (
              <Button
                title={t('groups.tasks.manage')}
                variant="quiet"
                disabled={resource.busy}
                onPress={() => setManaged(task)}
              />
            ) : null}
          </View>
          <T translate={false}>{task.description}</T>
          <T muted>
            {task.dueAt
              ? format('groups.tasks.due', new Date(task.dueAt).toLocaleDateString(locale))
              : t('groups.tasks.noDeadline')}
          </T>
          <ProgressBar
            value={task.targetValue > 0 ? task.myProgress / task.targetValue : 0}
            label={format(
              'groups.tasks.progressValue',
              task.myProgress,
              task.targetValue,
              t(`app.groupUnitOption.${task.targetUnit}`),
            )}
          />
          <T>
            {format(
              'groups.tasks.progressValue',
              task.myProgress,
              task.targetValue,
              t(`app.groupUnitOption.${task.targetUnit}`),
            )}
          </T>
          <T muted size={13}>
            {format('groups.tasks.participants', task.participantCount, task.completedCount)} ·{' '}
            {format('groups.tasks.pointsReward', task.pointsReward)}
          </T>
          {task.status === 'active' ? (
            <>
              <Field
                label={t('groups.tasks.progressLabel')}
                value={drafts[task.id] ?? String(task.myProgress)}
                onChangeText={(value) => setDrafts((current) => ({ ...current, [task.id]: value }))}
                keyboardType="number-pad"
              />
              <Button
                title={t('groups.tasks.progressSave')}
                loading={resource.busy}
                disabled={resource.busy}
                onPress={() =>
                  void resource.run(async () => {
                    const value = Number(drafts[task.id] ?? task.myProgress);
                    if (!Number.isInteger(value) || value < 0 || value > task.targetValue)
                      throw new Error('Invalid progress');
                    await backend.groups.setTaskProgress(group.code, task.id, value);
                    setDrafts((current) => ({ ...current, [task.id]: String(value) }));
                  }, 'groups.tasks.progressSaveError')
                }
              />
              {!task.myCompleted ? (
                <Button
                  title={t('groups.tasks.completeNow')}
                  variant="secondary"
                  disabled={resource.busy}
                  onPress={() =>
                    void resource.run(
                      () => backend.groups.setTaskProgress(group.code, task.id, task.targetValue),
                      'groups.tasks.progressSaveError',
                    )
                  }
                />
              ) : (
                <T bold>{t('groups.tasks.completed')}</T>
              )}
            </>
          ) : (
            <T muted>{t(`groups.tasks.status.${task.status}`)}</T>
          )}
        </Card>
      ))}
      {!resource.busy && !resource.error && !rows.length ? (
        <Empty
          icon="target"
          title={t(
            filter === 'active'
              ? 'groups.tasks.activeEmptyTitle'
              : 'groups.tasks.historyEmptyTitle',
          )}
          message={t(
            filter === 'active' ? 'groups.tasks.activeEmptyBody' : 'groups.tasks.historyEmptyBody',
          )}
        />
      ) : null}
      <Sheet
        visible={create}
        title={t('groups.tasks.createTitle')}
        onClose={() => {
          if (!resource.busy) setCreate(false);
        }}
      >
        <Field
          label={t('groups.tasks.titleLabel')}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />
        <Field
          label={t('groups.tasks.descriptionLabel')}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={3000}
        />
        <T bold>{t('groups.tasks.typeLabel')}</T>
        <Segments
          value={type}
          options={['challenge', 'reading', 'memorization', 'custom'].map((value) => ({
            value,
            label: t(`groups.tasks.type.${value}`),
          }))}
          onChange={setType}
        />
        <Field
          label={t('groups.tasks.targetLabel')}
          value={target}
          onChangeText={setTarget}
          keyboardType="number-pad"
          maxLength={5}
        />
        <T bold>{t('groups.tasks.unitLabel')}</T>
        <Segments
          value={unit}
          options={['ayah', 'page', 'hizb', 'juz', 'surah', 'lesson', 'custom'].map((value) => ({
            value,
            label: t(`app.groupUnitOption.${value}`),
          }))}
          onChange={setUnit}
        />
        <T bold>{t('groups.tasks.durationLabel')}</T>
        <Segments
          value={days}
          options={['none', '7', '14', '30'].map((value) => ({
            value,
            label: t(`groups.tasks.duration.${value}`),
          }))}
          onChange={setDays}
        />
        <Field
          label={t('groups.tasks.pointsLabel')}
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
          maxLength={4}
        />
        <T muted size={13}>
          {t('groups.tasks.pointsHint')}
        </T>
        <ResourceState {...resource} />
        <Button
          title={t('groups.tasks.createConfirm')}
          loading={resource.busy}
          disabled={resource.busy || title.trim().length < 3}
          onPress={() => void resource.run(makeTask, 'groups.tasks.createError')}
        />
      </Sheet>
      <Sheet
        visible={managed !== null}
        title={t('groups.tasks.manage')}
        onClose={() => {
          if (!resource.busy) setManaged(null);
        }}
      >
        <ResourceState {...resource} />
        {managed ? (
          <View style={{ gap: 14 }}>
            {(['active', 'completed', 'cancelled', 'deleted'] as const)
              .filter((status) => status !== managed.status)
              .map((status) => (
                <ConfirmAction
                  key={status}
                  title={t(`groups.tasks.status.${status}.title`)}
                  body={format(`groups.tasks.status.${status}.body`, managed.title)}
                  disabled={resource.busy}
                  action={() =>
                    void resource.run(async () => {
                      await backend.groups.setTaskStatus(group.code, managed.id, status);
                      setManaged(null);
                    }, 'groups.tasks.statusError')
                  }
                />
              ))}
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}
