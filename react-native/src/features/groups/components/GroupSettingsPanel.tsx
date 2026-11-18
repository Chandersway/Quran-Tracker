import React, { useState } from 'react';
import { View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { Group, GroupMemberPermissions } from '../../../services/backend/types';
import { useI18n } from '../../../i18n';
import { Button, Card, T } from '../../../shared/components';
import { GroupFormFields, validGroupDraft, type GroupDraft } from './GroupFormFields';
import { ConfirmAction, permitted, ResourceState, useGroupResource } from './groupUi';

export function GroupSettingsPanel({
  backend,
  group,
  onSaved,
  onDeleted,
}: {
  backend: Backend;
  group: Group;
  onSaved: () => Promise<void>;
  onDeleted: () => void;
}) {
  const { t, format } = useI18n();
  const [draft, setDraft] = useState<GroupDraft>({
    name: group.name,
    description: group.description,
    goalType: group.goal_type,
    progressUnit: group.progress_unit,
    goalPeriod: group.goal_period,
    goalTarget: String(group.goal_target ?? 1),
    privacy: group.privacy,
    memberPermissions: {
      canPostMessages: false,
      canShareProgress: false,
      canComment: false,
      canInviteMembers: false,
    },
  });
  const resource = useGroupResource(
    async () => {
      const permissions = await backend.groups.getMemberPermissions(group.code);
      setDraft((current) => ({ ...current, memberPermissions: permissions }));
      return permissions;
    },
    [backend, group.code],
    null as GroupMemberPermissions | null,
  );
  return (
    <View style={{ gap: 14 }}>
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      {permitted(group, 'group.update') && resource.value ? (
        <Card style={{ gap: 14 }}>
          <GroupFormFields draft={draft} onChange={setDraft} />
          <Button
            title={t('app.groupForm.saveButton')}
            loading={resource.busy}
            disabled={resource.busy || !validGroupDraft(draft)}
            onPress={() =>
              void resource.run(async () => {
                await backend.groups.update(group.code, {
                  ...draft,
                  goalTarget: draft.goalPeriod === 'none' ? null : Number(draft.goalTarget),
                });
                await onSaved();
              }, 'app.groupForm.saveError')
            }
          />
        </Card>
      ) : null}
      {group.viewer_role === 'owner' ? (
        <Card style={{ gap: 12 }}>
          <T size={20} bold>
            {t('groups.delete.dangerTitle')}
          </T>
          <T muted>{t('groups.delete.dangerBody')}</T>
          <ConfirmAction
            title={t('groups.delete.action')}
            body={format('groups.delete.confirmBody', group.name)}
            disabled={resource.busy}
            action={() =>
              void resource.run(
                async () => {
                  await backend.groups.deleteGroup(group.code);
                  onDeleted();
                },
                'groups.delete.error',
                false,
              )
            }
          />
        </Card>
      ) : null}
    </View>
  );
}
