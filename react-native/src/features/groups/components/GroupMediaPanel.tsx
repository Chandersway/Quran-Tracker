import { GroupImage } from './GroupImage';
import React, { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Backend } from '../../../services/backend/backend';
import type { Group } from '../../../services/backend/types';
import type { GroupMedia, GroupUpload } from '../../../services/groups/groupTypes';
import { useI18n } from '../../../i18n';
import { Button, Card, Empty, Field, Segments, Sheet, T } from '../../../shared/components';
import {
  chooseGroupImage,
  ConfirmAction,
  permitted,
  ResourceState,
  useGroupResource,
} from './groupUi';

export function GroupMediaPanel({ backend, group }: { backend: Backend; group: Group }) {
  const { t, locale } = useI18n();
  const resource = useGroupResource(
    () => backend.groups.listMedia(group.code),
    [backend, group.code],
    [] as GroupMedia[],
  );
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [upload, setUpload] = useState<GroupUpload | null>(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<GroupMedia | null>(null);
  async function pick() {
    try {
      const selected = await chooseGroupImage();
      if (selected) {
        setCaption('');
        setUpload(selected);
      }
    } catch {
      resource.setError(t('groups.media.readError'));
    }
  }
  async function share(media: GroupMedia) {
    if (Platform.OS === 'web') return Linking.openURL(media.signedUrl);
    const path = new File(
      Paths.cache,
      `group-${media.id}.${media.file_name.split('.').at(-1) || 'jpg'}`,
    );
    const downloaded = await File.downloadFileAsync(media.signedUrl, path, { idempotent: true });
    await Sharing.shareAsync(downloaded.uri, {
      mimeType: media.mime_type,
      dialogTitle: t('groups.media.share'),
    });
  }
  return (
    <View style={{ gap: 14 }}>
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      <Segments
        value={filter}
        options={[
          { value: 'all', label: t('groups.media.all') },
          { value: 'mine', label: t('groups.media.mine') },
        ]}
        onChange={(next) => {
          setFilter(next);
          if (next === 'mine')
            void backend.auth.getSession().then((session) => setUserId(session?.user.id ?? null));
        }}
      />
      {permitted(group, 'media.upload') ? (
        <Button
          title={t('groups.media.upload')}
          icon="image"
          disabled={resource.busy}
          onPress={() => void pick()}
        />
      ) : null}
      {resource.value
        .filter((item) => filter === 'all' || item.created_by === userId)
        .map((media) => (
          <Card key={media.id} style={{ gap: 10 }}>
            <GroupImage
              source={{ uri: media.signedUrl }}
              style={{ width: '100%', aspectRatio: 1.5, borderRadius: 12 }}
              resizeMode="cover"
              accessibilityLabel={media.caption || media.file_name}
            />
            <T translate={false} bold>
              {media.caption || media.file_name}
            </T>
            <T muted size={12}>
              {media.display_name} · {new Date(media.created_at).toLocaleDateString(locale)}
            </T>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title={t('common.open')} variant="quiet" onPress={() => setPreview(media)} />
              <Button
                title={t('groups.media.share')}
                variant="quiet"
                onPress={() => void resource.run(() => share(media))}
              />
            </View>
            {media.can_delete ? (
              <ConfirmAction
                title={t('groups.media.deleteAction')}
                body={t('groups.media.deleteTitle')}
                disabled={resource.busy}
                action={() =>
                  void resource.run(
                    () => backend.groups.deleteMedia(group.code, media.id),
                    'groups.media.deleteError',
                  )
                }
              />
            ) : null}
          </Card>
        ))}
      {!resource.busy && !resource.error && resource.value.length === 0 ? (
        <Empty
          icon="image"
          title={t('groups.detail.media.emptyTitle')}
          message={t('groups.detail.media.emptyBody')}
        />
      ) : null}
      <Sheet
        visible={upload !== null}
        title={t('groups.media.uploadTitle')}
        onClose={() => {
          if (!resource.busy) setUpload(null);
        }}
      >
        <Field
          label={t('groups.media.caption')}
          value={caption}
          onChangeText={setCaption}
          maxLength={1000}
          multiline
        />
        <ResourceState {...resource} />
        <Button
          title={t('groups.media.confirmUpload')}
          loading={resource.busy}
          disabled={resource.busy}
          onPress={() =>
            void resource.run(async () => {
              if (upload) {
                await backend.groups.uploadMedia(group.code, { ...upload, caption });
                setUpload(null);
              }
            }, 'groups.media.uploadError')
          }
        />
      </Sheet>
      <Sheet
        visible={preview !== null}
        translateTitle={false}
        title={preview?.file_name ?? t('groups.media.title')}
        onClose={() => setPreview(null)}
      >
        {preview ? (
          <GroupImage
            source={{ uri: preview.signedUrl }}
            style={{ width: '100%', height: 420 }}
            resizeMode="contain"
            accessibilityLabel={preview.caption || preview.file_name}
          />
        ) : null}
      </Sheet>
    </View>
  );
}
