import { GroupImage } from './GroupImage';
import React, { useState } from 'react';
import { Share, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { Backend } from '../../../services/backend/backend';
import type { Group, GroupMember } from '../../../services/backend/types';
import type {
  GroupInvitation,
  GroupJoinRequest,
  GroupRole,
} from '../../../services/groups/groupTypes';
import { useI18n } from '../../../i18n';
import { groupRoleLabel, groupStatusLabel } from '../communityCopy';
import { Button, Card, Empty, Field, Row, Segments, Sheet, T } from '../../../shared/components';
import { ConfirmAction, permitted, ResourceState, useGroupResource } from './groupUi';
import { groupShareUrl } from '../../../services/groups/groupJoin';

type MembersData = {
  members: GroupMember[];
  roles: GroupRole[];
  invitations: GroupInvitation[];
  requests: GroupJoinRequest[];
};
export function GroupMembersPanel({ backend, group }: { backend: Backend; group: Group }) {
  const { t, format, locale } = useI18n();
  const canInvite = permitted(group, 'invitation.create');
  const canReview = permitted(group, 'join_request.manage');
  const resource = useGroupResource(
    async (): Promise<MembersData> => {
      const [members, roles, invitations, requests] = await Promise.all([
        backend.groups.listMembers(group.code),
        backend.groups.listRoles(group.code),
        canInvite ? backend.groups.listInvitations(group.code) : [],
        canReview ? backend.groups.listJoinRequests(group.code) : [],
      ]);
      return { members, roles, invitations, requests };
    },
    [backend, group.code],
    { members: [], roles: [], invitations: [], requests: [] } as MembersData,
  );
  const [tab, setTab] = useState<'members' | 'invitations' | 'requests'>('members');
  const [query, setQuery] = useState('');
  const [member, setMember] = useState<GroupMember | null>(null);
  const [role, setRole] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [days, setDays] = useState('7');
  const [uses, setUses] = useState('10');
  const [newInvitation, setNewInvitation] = useState<GroupInvitation | null>(null);
  const actor = resource.value.members.find((value) => value.isCurrentUser);
  const actorRank = resource.value.roles.find((value) => value.key === actor?.role)?.rank ?? 0;
  const memberRank = (value: GroupMember) =>
    resource.value.roles.find((item) => item.key === value.role)?.rank ?? 0;
  const canManage = (value: GroupMember) =>
    !value.isCurrentUser && value.role !== 'owner' && memberRank(value) < actorRank;
  const invitationLink = newInvitation?.token
    ? groupShareUrl({ code: group.code, token: newInvitation.token }, locale)
    : '';
  return (
    <View style={{ gap: 14 }}>
      <Segments
        value={tab}
        options={[
          { value: 'members', label: t('groups.members.section.members') },
          ...(canInvite
            ? [{ value: 'invitations' as const, label: t('groups.members.section.invitations') }]
            : []),
          ...(canReview
            ? [{ value: 'requests' as const, label: t('groups.members.section.requests') }]
            : []),
        ]}
        onChange={setTab}
      />
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      {tab === 'members' ? (
        <>
          <Field label={t('groups.members.search')} value={query} onChangeText={setQuery} />
          {resource.value.members
            .filter((value) =>
              `${value.displayName} ${groupRoleLabel(value.role, t, locale)}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((value) => (
              <Row
                key={value.userId}
                translateTitle={false}
                translateSubtitle={false}
                title={value.displayName || t('groups.member')}
                subtitle={`${groupRoleLabel(value.role, t, locale)}${value.isCurrentUser ? ` · ${t('groups.members.you')}` : ''}`}
                trailing={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {value.avatarUrl ? (
                      <GroupImage
                        source={{ uri: value.avatarUrl }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                        accessibilityLabel={value.displayName}
                      />
                    ) : null}
                    {canManage(value) &&
                    (permitted(group, 'role.assign') || permitted(group, 'member.remove')) ? (
                      <Button
                        title={t('app.groupMembersText.manageMember')}
                        variant="quiet"
                        onPress={() => {
                          setMember(value);
                          setRole(value.role);
                        }}
                      />
                    ) : null}
                  </View>
                }
              />
            ))}
        </>
      ) : null}
      {tab === 'invitations' ? (
        <>
          <T muted>{t('groups.invite.body')}</T>
          <Button
            title={t('groups.invite.create')}
            disabled={resource.busy}
            onPress={() => {
              setEmail('');
              setInviteOpen(true);
            }}
          />
          {resource.value.invitations.map((invitation) => (
            <Card key={invitation.id} style={{ gap: 8 }}>
              <T translate={false} bold>
                {invitation.invited_email || t('groups.invite.shareable')}
              </T>
              <T muted>
                {new Date(invitation.expires_at).toLocaleDateString(locale)} ·{' '}
                {format('groups.invite.usage', invitation.use_count, invitation.max_uses)} ·{' '}
                {groupStatusLabel(invitation.status, locale)}
              </T>
              {invitation.status === 'active' ? (
                <ConfirmAction
                  title={t('groups.invite.revoke')}
                  body={t('groups.invite.revoke')}
                  disabled={resource.busy}
                  action={() =>
                    void resource.run(
                      () => backend.groups.revokeInvitation(group.code, invitation.id),
                      'groups.invite.revokeError',
                    )
                  }
                />
              ) : null}
            </Card>
          ))}
          {!resource.busy && !resource.error && !resource.value.invitations.length ? (
            <Empty
              icon="link"
              title={t('groups.invite.emptyTitle')}
              message={t('groups.invite.emptyBody')}
            />
          ) : null}
        </>
      ) : null}
      {tab === 'requests' ? (
        <>
          {resource.value.requests
            .filter((request) => request.status === 'pending')
            .map((request) => (
              <Card key={request.id} style={{ gap: 10 }}>
                <T translate={false} bold>
                  {request.display_name || t('groups.member')}
                </T>
                <T translate={false}>{request.message}</T>
                <T muted>{new Date(request.created_at).toLocaleString(locale)}</T>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Button
                    title={t('groups.requests.approve')}
                    disabled={resource.busy}
                    onPress={() =>
                      void resource.run(
                        () => backend.groups.reviewJoinRequest(group.code, request.id, true),
                        'groups.requests.reviewError',
                      )
                    }
                  />
                  <Button
                    title={t('groups.requests.reject')}
                    variant="secondary"
                    disabled={resource.busy}
                    onPress={() =>
                      void resource.run(
                        () => backend.groups.reviewJoinRequest(group.code, request.id, false),
                        'groups.requests.reviewError',
                      )
                    }
                  />
                </View>
              </Card>
            ))}
          {!resource.busy &&
          !resource.error &&
          !resource.value.requests.some((request) => request.status === 'pending') ? (
            <Empty
              icon="users"
              title={t('groups.requests.emptyTitle')}
              message={t('groups.requests.emptyBody')}
            />
          ) : null}
        </>
      ) : null}
      <Sheet
        visible={member !== null}
        translateTitle={false}
        title={member?.displayName || t('groups.members.section.members')}
        onClose={() => {
          if (!resource.busy) setMember(null);
        }}
      >
        {member && permitted(group, 'role.assign') ? (
          <>
            <T bold>{t('groups.members.changeRole')}</T>
            <Segments
              value={role}
              translateLabels={false}
              options={resource.value.roles
                .filter((value) => value.key !== 'owner' && value.rank < actorRank)
                .map((value) => ({
                  value: value.key,
                  label: groupRoleLabel(value.key, t, locale),
                }))}
              onChange={setRole}
            />
            <Button
              title={t('groups.members.roleConfirm')}
              disabled={resource.busy || role === member.role}
              onPress={() =>
                void resource.run(async () => {
                  await backend.groups.setMemberRole(group.code, member.userId, role);
                  setMember(null);
                }, 'groups.members.roleError')
              }
            />
          </>
        ) : null}
        {member && permitted(group, 'member.remove') ? (
          <View style={{ gap: 12, marginTop: 20 }}>
            <ConfirmAction
              title={t('groups.members.remove')}
              body={format('groups.members.removeBody', member.displayName)}
              disabled={resource.busy}
              action={() =>
                void resource.run(async () => {
                  await backend.groups.removeMember(group.code, member.userId);
                  setMember(null);
                }, 'groups.members.removeError')
              }
            />
            <T muted>{t('groups.members.blockHint')}</T>
            <ConfirmAction
              title={t('groups.members.block')}
              body={t('groups.members.blockHint')}
              disabled={resource.busy}
              action={() =>
                void resource.run(async () => {
                  await backend.groups.removeMember(group.code, member.userId, true);
                  setMember(null);
                }, 'groups.members.removeError')
              }
            />
          </View>
        ) : null}
        <ResourceState {...resource} />
      </Sheet>
      <Sheet
        visible={inviteOpen}
        title={t('groups.invite.title')}
        onClose={() => {
          if (!resource.busy) setInviteOpen(false);
        }}
      >
        <Field
          label={t('accountManagement.emailLabel')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <T bold>{t('groups.invite.expires')}</T>
        <Segments
          value={days}
          options={['1', '7', '14', '30'].map((value) => ({
            value,
            label: format('groups.invite.days', Number(value)),
          }))}
          onChange={setDays}
        />
        <Field
          label={t('app.groupAmount')}
          value={uses}
          onChangeText={setUses}
          keyboardType="number-pad"
          maxLength={3}
        />
        <ResourceState {...resource} />
        <Button
          title={t('groups.invite.create')}
          loading={resource.busy}
          disabled={resource.busy}
          onPress={() =>
            void resource.run(async () => {
              const created = await backend.groups.createInvitation(
                group.code,
                email || undefined,
                Number(days),
                Number(uses),
              );
              setNewInvitation(created);
              setInviteOpen(false);
            }, 'groups.invite.createError')
          }
        />
      </Sheet>
      <Sheet
        visible={newInvitation !== null}
        title={t('groups.invite.ready')}
        onClose={() => setNewInvitation(null)}
      >
        <T muted>{t('groups.invite.tokenOnce')}</T>
        <T translate={false} selectable style={{ marginVertical: 16 }}>
          {invitationLink}
        </T>
        <Button
          title={t('groups.invite.copy')}
          onPress={() => void Clipboard.setStringAsync(invitationLink)}
        />
        <Button
          title={t('groups.invite.share')}
          variant="secondary"
          onPress={() =>
            void Share.share({
              title: group.name,
              message: `${format('groups.invite.shareText', group.name)}\n${invitationLink}`,
            })
          }
        />
      </Sheet>
    </View>
  );
}
