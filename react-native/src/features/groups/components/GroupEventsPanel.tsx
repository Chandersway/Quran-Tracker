import React, { useState } from 'react';
import { View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { Group } from '../../../services/backend/types';
import type { GroupEvent } from '../../../services/groups/groupTypes';
import { useI18n } from '../../../i18n';
import { groupStatusLabel } from '../communityCopy';
import { Button, Card, Empty, Field, Segments, Sheet, T } from '../../../shared/components';
import { ConfirmAction, permitted, ResourceState, useGroupResource } from './groupUi';
import { planningReminderDueAt } from '../../../services/notifications/planningReminders';

export function GroupEventsPanel({ backend, group }: { backend: Backend; group: Group }) {
  const { t, locale } = useI18n();
  const resource = useGroupResource(
    () => backend.groups.listEvents(group.code),
    [backend, group.code],
    [] as GroupEvent[],
  );
  const [history, setHistory] = useState<'upcoming' | 'history'>('upcoming');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const rows = resource.value.filter((event) =>
    history === 'history'
      ? event.status !== 'scheduled' || Date.parse(event.ends_at || event.starts_at) < Date.now()
      : event.status === 'scheduled' && Date.parse(event.ends_at || event.starts_at) >= Date.now(),
  );
  async function create() {
    const [hour, minute] = time.split(':').map(Number);
    const start = planningReminderDueAt(date, hour ?? -1, minute ?? -1);
    const minutes = Number(duration);
    if (
      !Number.isFinite(start.getTime()) ||
      start.getTime() <= Date.now() ||
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      minutes > 1440
    )
      throw new Error('Invalid date');
    await backend.groups.createEvent(group.code, {
      title,
      description,
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + minutes * 60000).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      location,
    });
    setOpen(false);
    setTitle('');
    setDescription('');
  }
  return (
    <View style={{ gap: 14 }}>
      <Segments
        value={history}
        options={[
          { value: 'upcoming', label: t('groups.events.title') },
          { value: 'history', label: t('groups.tasks.status.completed') },
        ]}
        onChange={setHistory}
      />
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      {permitted(group, 'event.create') ? (
        <Button
          title={t('groups.events.create')}
          icon="plus"
          disabled={resource.busy}
          onPress={() => setOpen(true)}
        />
      ) : null}
      {rows.map((event) => (
        <Card key={event.id} style={{ gap: 10 }}>
          <T translate={false} size={20} bold>
            {event.title}
          </T>
          <T translate={false}>{event.description}</T>
          <T muted>
            {new Date(event.starts_at).toLocaleString(locale)} · {event.timezone}
          </T>
          {event.location ? <T translate={false}>{event.location}</T> : null}
          <T muted size={13}>
            {event.going_count} · {t('groups.events.going')} / {event.maybe_count} ·{' '}
            {t('groups.events.maybe')}
          </T>
          {event.status === 'scheduled' ? (
            <>
              <T bold>{t('groups.events.rsvp')}</T>
              <Segments
                value={(event.my_response ?? '') as string}
                options={(['going', 'maybe', 'declined'] as const).map((value) => ({
                  value,
                  label: t(`groups.events.${value}`),
                }))}
                onChange={(response) => {
                  if (['going', 'maybe', 'declined'].includes(response))
                    void resource.run(
                      () =>
                        backend.groups.respondToEvent(
                          group.code,
                          event.id,
                          response as 'going' | 'maybe' | 'declined',
                        ),
                      'groups.events.responseError',
                    );
                }}
              />
            </>
          ) : (
            <T muted>{groupStatusLabel(event.status, locale)}</T>
          )}
          {event.can_manage ? (
            <View style={{ gap: 8 }}>
              {event.status === 'scheduled' ? (
                <>
                  <Button
                    title={t('groups.events.complete')}
                    variant="secondary"
                    disabled={resource.busy}
                    onPress={() =>
                      void resource.run(() =>
                        backend.groups.setEventStatus(group.code, event.id, 'completed'),
                      )
                    }
                  />
                  <ConfirmAction
                    title={t('groups.events.cancel')}
                    body={t('groups.events.statusTitle')}
                    disabled={resource.busy}
                    action={() =>
                      void resource.run(() =>
                        backend.groups.setEventStatus(group.code, event.id, 'cancelled'),
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <Button
                    title={t('groups.events.reactivate')}
                    variant="secondary"
                    disabled={resource.busy}
                    onPress={() =>
                      void resource.run(() =>
                        backend.groups.setEventStatus(group.code, event.id, 'scheduled'),
                      )
                    }
                  />
                  <ConfirmAction
                    title={t('groups.events.delete')}
                    body={t('groups.events.statusTitle')}
                    disabled={resource.busy}
                    action={() =>
                      void resource.run(() =>
                        backend.groups.setEventStatus(group.code, event.id, 'deleted'),
                      )
                    }
                  />
                </>
              )}
            </View>
          ) : null}
        </Card>
      ))}
      {!resource.busy && !resource.error && !rows.length ? (
        <Empty
          icon="calendar"
          title={t('groups.detail.events.emptyTitle')}
          message={t('groups.detail.events.emptyBody')}
        />
      ) : null}
      <Sheet
        visible={open}
        title={t('groups.events.createTitle')}
        onClose={() => {
          if (!resource.busy) setOpen(false);
        }}
      >
        <Field
          label={t('groups.events.titleLabel')}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />
        <Field
          label={t('groups.events.descriptionLabel')}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field
          label={`${t('groups.events.dateLabel')} · YYYY-MM-DD`}
          value={date}
          onChangeText={setDate}
          placeholder="2026-12-01"
          autoCapitalize="none"
        />
        <Field
          label={`${t('groups.events.timeLabel')} · HH:MM`}
          value={time}
          onChangeText={setTime}
          placeholder="19:00"
        />
        <Field
          label={t('groups.events.durationLabel')}
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
        />
        <Field
          label={t('groups.events.locationLabel')}
          value={location}
          onChangeText={setLocation}
        />
        <ResourceState {...resource} />
        <Button
          title={t('groups.events.createConfirm')}
          loading={resource.busy}
          disabled={resource.busy || title.trim().length < 3}
          onPress={() => void resource.run(create, 'groups.events.dateError')}
        />
      </Sheet>
    </View>
  );
}
