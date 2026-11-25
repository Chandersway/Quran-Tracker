import { GroupImage } from './GroupImage';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { Group } from '../../../services/backend/types';
import { useI18n } from '../../../i18n';
import { Button, Card, Field, T } from '../../../shared/components';
import { chooseGroupImage, permitted, ResourceState, useGroupResource } from './groupUi';

export function GroupProfilePanel({ backend, group }: { backend: Backend; group: Group }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const resource = useGroupResource(
    async () => {
      const [profile, logo] = await Promise.all([
        backend.groups.getMyProfile(group.code),
        backend.groups.getLogo(group.code),
      ]);
      setName(profile.custom_display_name || profile.display_name);
      return { profile, logo };
    },
    [backend, group.code],
    null as {
      profile: Awaited<ReturnType<Backend['groups']['getMyProfile']>>;
      logo: string | null;
    } | null,
  );
  return (
    <View style={{ gap: 14 }}>
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      {resource.value ? (
        <Card style={{ gap: 12 }}>
          <T size={20} bold>
            {t('groups.profile.title')}
          </T>
          <T muted>{t('groups.profile.dialogBody')}</T>
          {resource.value.profile.avatar_url ? (
            <GroupImage
              source={{ uri: resource.value.profile.avatar_url }}
              style={{ width: 88, height: 88, borderRadius: 44 }}
              accessibilityLabel={resource.value.profile.display_name}
            />
          ) : null}
          <Field
            label={t('groups.profile.nameLabel')}
            value={name}
            onChangeText={setName}
            maxLength={40}
          />
          <Button
            title={t('groups.profile.save')}
            disabled={resource.busy || name.trim().length < 2}
            onPress={() =>
              void resource.run(
                () =>
                  backend.groups.updateMyProfile(
                    group.code,
                    name,
                    resource.value?.profile.custom_avatar_url ?? null,
                  ),
                'groups.profile.saveError',
              )
            }
          />
          <Button
            title={t('groups.profile.choosePhoto')}
            variant="secondary"
            disabled={resource.busy}
            onPress={() =>
              void resource.run(async () => {
                const image = await chooseGroupImage(true);
                if (!image) return;
                const url = await backend.groups.uploadProfileAvatar(group.code, image);
                await backend.groups.updateMyProfile(group.code, name, url);
              }, 'groups.profile.saveError')
            }
          />
          <Button
            title={t('groups.profile.useAppProfile')}
            variant="quiet"
            disabled={resource.busy}
            onPress={() =>
              void resource.run(
                () => backend.groups.updateMyProfile(group.code, null, null),
                'groups.profile.saveError',
              )
            }
          />
        </Card>
      ) : null}
      {permitted(group, 'group.update') ? (
        <Card style={{ gap: 12 }}>
          <T size={20} bold>
            {t('groups.logo.title')}
          </T>
          {resource.value?.logo ? (
            <GroupImage
              source={{ uri: resource.value.logo }}
              style={{ width: 100, height: 100, borderRadius: 16 }}
              accessibilityLabel={group.name}
            />
          ) : null}
          <T muted>{t('groups.logo.hint')}</T>
          <Button
            title={t('groups.logo.choose')}
            disabled={resource.busy}
            onPress={() =>
              void resource.run(async () => {
                const image = await chooseGroupImage(true);
                if (image) await backend.groups.setLogo(group.code, image);
              }, 'groups.logo.saveError')
            }
          />
          <Button
            title={t('groups.logo.remove')}
            variant="quiet"
            disabled={resource.busy}
            onPress={() =>
              void resource.run(
                () => backend.groups.setLogo(group.code, null),
                'groups.logo.saveError',
              )
            }
          />
        </Card>
      ) : null}
    </View>
  );
}
