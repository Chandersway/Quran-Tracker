import React, { useState } from 'react';
import { View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { Group } from '../../../services/backend/types';
import type { GroupNotice } from '../../../services/groups/groupTypes';
import { useI18n } from '../../../i18n';
import { Button, Card, Field, T } from '../../../shared/components';
import { permitted, ResourceState, useGroupResource } from './groupUi';

export function GroupNoticesPanel({
  backend,
  group,
  openPost,
}: {
  backend: Backend;
  group: Group;
  openPost: (postId: string) => void;
}) {
  const { t, locale } = useI18n();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const resource = useGroupResource(
    () => backend.groups.listNotices(group.code),
    [backend, group.code],
    [] as GroupNotice[],
  );
  return (
    <View style={{ gap: 14 }}>
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      {resource.value.some((notice) => !notice.read_at) ? (
        <Button
          title={t('ui.groups.markAllRead')}
          variant="secondary"
          disabled={resource.busy}
          onPress={() => void resource.run(() => backend.groups.markNoticeRead(group.code))}
        />
      ) : null}
      {resource.value.map((notice) => (
        <Card key={notice.id} style={{ gap: 10, opacity: notice.read_at ? 0.7 : 1 }}>
          <T translate={false} bold>
            {notice.title}
          </T>
          <T translate={false}>{notice.body}</T>
          <T size={12} muted>
            {new Date(notice.created_at).toLocaleString(locale)}{' '}
            {notice.read_at ? '' : `· ${t('ui.groups.unread')}`}
          </T>
          {notice.entity_type === 'post' && notice.entity_id ? (
            <Button
              title={t('common.open')}
              variant="quiet"
              onPress={() => {
                void backend.groups
                  .markNoticeRead(group.code, notice.id)
                  .then(() => openPost(notice.entity_id!))
                  .catch(() => resource.setError(t('groups.error.network')));
              }}
            />
          ) : null}
          {!notice.read_at ? (
            <Button
              title={t('ui.groups.markRead')}
              variant="quiet"
              disabled={resource.busy}
              onPress={() =>
                void resource.run(() => backend.groups.markNoticeRead(group.code, notice.id))
              }
            />
          ) : null}
        </Card>
      ))}
      {resource.value.length >= 30 ? (
        <Button
          title={t('groups.feed.readMore')}
          variant="quiet"
          disabled={resource.busy}
          onPress={() =>
            void resource.run(
              async () => {
                const last = resource.value.at(-1)!;
                const next = await backend.groups.listNotices(group.code, {
                  createdAt: last.created_at,
                  id: last.id,
                });
                resource.setValue((rows) => [
                  ...rows,
                  ...next.filter((row) => !rows.some((old) => old.id === row.id)),
                ]);
              },
              'groups.error.network',
              false,
            )
          }
        />
      ) : null}
      {permitted(group, 'notification.send') ? (
        <Card style={{ gap: 10 }}>
          <T bold>{t('notifications.announcement')}</T>
          <Field
            label={t('groups.events.titleLabel')}
            value={title}
            onChangeText={setTitle}
            maxLength={160}
          />
          <Field
            label={t('app.groupForm.description')}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={1000}
          />
          <Button
            title={t('ui.groups.sendAnnouncement')}
            disabled={resource.busy || !title.trim()}
            onPress={() =>
              void resource.run(async () => {
                await backend.groups.sendNotice(group.code, title, body);
                setTitle('');
                setBody('');
              })
            }
          />
        </Card>
      ) : null}
    </View>
  );
}
