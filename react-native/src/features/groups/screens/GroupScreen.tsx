import { GroupImage } from '../components/GroupImage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import type { AuthSession } from '../../../services/auth/types';
import { getBackend } from '../../../config/runtime';
import type { Backend } from '../../../services/backend/backend';
import type { Group } from '../../../services/backend/types';
import { groupShareUrl, parseGroupJoinInput } from '../../../services/groups/groupJoin';
import { pendingGroup } from '../../../services/groups/pendingGroup';
import { useI18n } from '../../../i18n';
import { useAppNavigation, type RootStack } from '../../../app/navigation/types';
import {
  Button,
  Card,
  IconButton,
  Notice,
  Row,
  Screen,
  Icon,
  Sheet,
  T,
} from '../../../shared/components';
import { GroupFeedPanel } from '../components/GroupFeedPanel';
import { GroupTasksPanel } from '../components/GroupTasksPanel';
import { GroupMembersPanel } from '../components/GroupMembersPanel';
import { GroupMediaPanel } from '../components/GroupMediaPanel';
import { GroupEventsPanel } from '../components/GroupEventsPanel';
import { GroupProgressPanel } from '../components/GroupProgressPanel';
import { GroupOverviewPanel } from '../components/GroupOverviewPanel';
import { groupLanguageLabel } from '../groupProgressCopy';
import { GroupProfilePanel } from '../components/GroupProfilePanel';
import {
  GroupRulesPanel,
  GroupReportsPanel,
  GroupAuditPanel,
} from '../components/GroupGovernancePanels';
import { GroupNoticesPanel } from '../components/GroupNoticesPanel';
import { GroupSettingsPanel } from '../components/GroupSettingsPanel';
import { GroupJoinFlow } from '../components/GroupJoinFlow';
import {
  GroupRefreshContext,
  permitted,
  ResourceState,
  useGroupResource,
} from '../components/groupUi';

import { groupDrafts } from '../../../services/groups/groupDrafts';
import { communityText, groupRoleLabel } from '../communityCopy';
import { usePalette } from '../../../shared/theme';
import { chatText } from '../chatCopy';

type Tab =
  | 'overview'
  | 'feed'
  | 'tasks'
  | 'members'
  | 'media'
  | 'events'
  | 'progress'
  | 'notices'
  | 'rules'
  | 'profile'
  | 'settings'
  | 'reports'
  | 'audit';
type Params = RootStack['Group'];

export function GroupScreen() {
  const { params } = useRoute<RouteProp<RootStack, 'Group'>>();
  const backend = useMemo(() => getBackend(), []);
  const navigation = useAppNavigation();
  const { t } = useI18n();
  const [session, setSession] = useState<AuthSession | null | undefined>();
  const [authError, setAuthError] = useState('');
  useEffect(() => {
    if (!backend) return;
    let active = true;
    let revision = 0;
    const stop = backend.auth.onChange((value) => {
      revision++;
      if (active) {
        setSession(value);
        setAuthError('');
      }
    });
    const initial = revision;
    void backend.auth
      .getSession()
      .then((value) => {
        if (active && revision === initial) setSession(value);
      })
      .catch(() => {
        if (active) setAuthError(t('groups.error.session'));
      });
    return () => {
      active = false;
      stop();
    };
  }, [backend]);
  if (!backend)
    return (
      <Screen>
        <Notice message={t('account.supabaseMissing')} />
        <Button
          title={t('groups.accountRequired.action')}
          onPress={() => navigation.navigate('Account')}
        />
      </Screen>
    );
  if (authError)
    return (
      <Screen>
        <Notice error message={authError} />
        <Button
          title={t('groups.accountRequired.action')}
          onPress={() => navigation.navigate('Account')}
        />
      </Screen>
    );
  if (session === undefined)
    return (
      <Screen>
        <T muted>{t('common.loading')}</T>
      </Screen>
    );
  if (!session)
    return (
      <Screen>
        <T size={30} bold>
          {t('groups.accountRequired.title')}
        </T>
        <T muted style={{ marginVertical: 16 }}>
          {t('groups.error.login')}
        </T>
        <Button
          title={t('groups.accountRequired.action')}
          onPress={() => navigation.navigate('Account')}
        />
        <GroupJoinFlow
          backend={backend}
          target={
            parseGroupJoinInput(
              'qurantracker://group/' +
                params.code +
                (params.invite ? '?invite=' + encodeURIComponent(params.invite) : ''),
            ) ?? undefined
          }
          onJoined={(code) => navigation.replace('Group', { code })}
          onCancel={() => navigation.goBack()}
        />
      </Screen>
    );
  return (
    <GroupContent
      key={session.user.id + ':' + params.code}
      backend={backend}
      params={params}
      accountId={session.user.id}
    />
  );
}

function GroupLogo({ backend, group }: { backend: Backend; group: Group }) {
  const logo = useGroupResource(
    () => backend.groups.getLogo(group.code),
    [backend, group.code],
    null as string | null,
  );
  return (
    <>
      {logo.value ? (
        <GroupImage
          source={{ uri: logo.value }}
          style={{ width: 48, height: 48, borderRadius: 14 }}
          accessibilityLabel={group.name}
        />
      ) : null}
      {logo.error ? (
        <T size={12} muted>
          {logo.error}
        </T>
      ) : null}
    </>
  );
}

function GroupContent({
  backend,
  params,
  accountId,
}: {
  backend: Backend;
  params: Params;
  accountId: string;
}) {
  const { t, format, locale } = useI18n();
  const palette = usePalette();
  const copy = (key: Parameters<typeof communityText>[0]) => communityText(key, locale);
  const draftStore = useMemo(() => groupDrafts(accountId, params.code), [accountId, params.code]);
  const [toolsVisible, setToolsVisible] = useState(false);
  const navigation = useAppNavigation();
  const resource = useGroupResource(
    () => backend.groups.get(params.code),
    [backend, params.code],
    null as Group | null,
  );
  const [tab, setTab] = useState<Tab>('feed');
  const [refresh, setRefresh] = useState(0);
  const firstFocus = useRef(true);
  const composer = useRef<React.ComponentRef<typeof View>>(null);
  const [inviteVisible, setInviteVisible] = useState(Boolean(params.invite));
  const incoming = parseGroupJoinInput(
    'qurantracker://group/' +
      params.code +
      (params.invite ? '?invite=' + encodeURIComponent(params.invite) : ''),
  );
  const closeInvite = () => {
    if (incoming) void pendingGroup.consume(incoming).catch(() => undefined);
    setInviteVisible(false);
    navigation.setParams({ invite: undefined });
  };
  useEffect(() => {
    if (params.postId) setTab('feed');
  }, [params.postId]);
  useEffect(() => {
    setInviteVisible(Boolean(params.invite));
  }, [params.invite]);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void resource.reload();
      setRefresh((value) => value + 1);
    }, [backend, params.code]),
  );
  const group = resource.value;
  const reload = async () => {
    await resource.reload();
    setRefresh((value) => value + 1);
  };
  const clearFocus = () => {
    navigation.setParams({ postId: undefined });
  };
  const openPost = (postId: string) => {
    navigation.setParams({ postId });
    setTab('feed');
  };
  const toolSections: {
    title: string;
    items: { value: Tab; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[];
  }[] = [
    {
      title: copy('participate'),
      items: [
        { value: 'tasks', label: t('groups.detail.tab.tasks'), icon: 'check-square' },
        { value: 'media', label: t('groups.detail.tab.media'), icon: 'image' },
        { value: 'events', label: t('groups.detail.tab.events'), icon: 'calendar' },
        { value: 'notices', label: t('notifications.title'), icon: 'bell' },
      ],
    },
    {
      title: copy('about'),
      items: [
        { value: 'overview', label: t('groups.detail.tab.overview'), icon: 'info' },
        { value: 'rules', label: t('ui.groups.rules'), icon: 'book-open' },
        { value: 'profile', label: t('groups.profile.title'), icon: 'user' },
      ],
    },
    {
      title: copy('manage'),
      items: [
        ...(group && permitted(group, 'group.update')
          ? [
              {
                value: 'settings' as const,
                label: t('app.groupForm.titleSettings'),
                icon: 'settings' as const,
              },
            ]
          : []),
        ...(group && permitted(group, 'report.manage')
          ? [
              {
                value: 'reports' as const,
                label: t('ui.groups.moderation'),
                icon: 'shield' as const,
              },
            ]
          : []),
        ...(group && permitted(group, 'audit.view')
          ? [{ value: 'audit' as const, label: t('ui.groups.auditLog'), icon: 'list' as const }]
          : []),
      ],
    },
  ];
  const secondaryTitle = toolSections
    .flatMap((section) => section.items)
    .find((item) => item.value === tab)?.label;
  return (
    <Screen avoidKeyboard keyboardRevealRef={tab === 'feed' ? composer : undefined}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderColor: palette.line,
        }}
      >
        {group ? <GroupLogo backend={backend} group={group} /> : <Icon name="users" />}
        <View style={{ flex: 1, gap: 3 }}>
          <T translate={false} size={25} bold>
            {group?.name || params.code}
          </T>
          {group ? (
            <>
              <T translate={false} muted size={12}>
                {format('app.groupHome.membersCount', group.member_count ?? 0)} {'\u00b7'}{' '}
                {groupRoleLabel(group.viewer_role ?? 'guest', t, locale)}
              </T>
              <T translate={false} muted size={12}>
                {t(
                  `app.groupPrivacyOption.${group.privacy === 'public' ? 'public' : group.privacy === 'private' ? 'inviteOnly' : 'codeOnly'}`,
                )}
                {' · '}
                {t('app.language')}: {groupLanguageLabel(group.language_code, locale)}
              </T>
            </>
          ) : null}
        </View>
        <IconButton
          name="more-horizontal"
          label={copy('tools')}
          onPress={() => setToolsVisible(true)}
        />
        <IconButton
          name="refresh-cw"
          label={t('app.groupRefresh')}
          disabled={resource.busy}
          onPress={() => void reload()}
        />
      </View>
      <ResourceState {...resource} onRetry={() => void reload()} />
      {group?.viewer_role && group.viewer_role !== 'guest' ? (
        <>
          <Button
            title={chatText('open', locale)}
            icon="message-circle"
            variant="quiet"
            onPress={() => navigation.navigate('GroupChat', { code: group.code })}
            style={{ alignSelf: 'flex-end', paddingHorizontal: 0, marginTop: 2, marginBottom: 0 }}
          />
          <View
            accessibilityRole="tablist"
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderColor: palette.line,
            }}
          >
            {(
              [
                { value: 'feed', label: t('groups.detail.tab.posts') },
                { value: 'progress', label: t('groups.detail.tab.ranking') },
                { value: 'members', label: t('groups.detail.tab.members') },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.value}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: tab === item.value }}
                onPress={() => {
                  setTab(item.value);
                  if (item.value !== 'feed' && params.postId) clearFocus();
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 52,
                  paddingHorizontal: 6,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottomWidth: 2,
                  borderBottomColor: tab === item.value ? palette.clay : 'transparent',
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <T
                  translate={false}
                  size={14}
                  bold={tab === item.value}
                  color={tab === item.value ? palette.ink : palette.muted}
                  style={{ textAlign: 'center' }}
                >
                  {item.label}
                </T>
              </Pressable>
            ))}
          </View>
          {secondaryTitle ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingTop: 8,
              }}
            >
              <T translate={false} size={21} bold style={{ flex: 1 }}>
                {secondaryTitle}
              </T>
              <Button
                title={t('groups.detail.tab.posts')}
                variant="quiet"
                icon="message-circle"
                onPress={() => setTab('feed')}
              />
            </View>
          ) : null}
          <Sheet
            visible={toolsVisible}
            title={copy('tools')}
            translateTitle={false}
            onClose={() => setToolsVisible(false)}
          >
            {toolSections
              .filter((section) => section.items.length)
              .map((section) => (
                <View key={section.title} style={{ marginBottom: 20 }}>
                  <T translate={false} size={16} bold style={{ marginBottom: 6 }}>
                    {section.title}
                  </T>
                  {section.items.map((item) => (
                    <Row
                      key={item.value}
                      title={item.label}
                      translateTitle={false}
                      icon={item.icon}
                      onPress={() => {
                        setTab(item.value);
                        setToolsVisible(false);
                        if (params.postId) clearFocus();
                      }}
                    />
                  ))}
                </View>
              ))}
          </Sheet>
          <GroupRefreshContext value={refresh}>
            <View key={tab} style={{ paddingTop: tab === 'feed' ? 10 : 16 }}>
              {tab === 'overview' ? (
                <View style={{ gap: 14 }}>
                  <Card style={{ gap: 14 }}>
                    <T translate={false}>{group.description}</T>
                    <Row
                      icon="users"
                      title={t('groups.members.section.members')}
                      subtitle={format('app.groupHome.membersCount', group.member_count ?? 0)}
                      onPress={() => setTab('members')}
                    />
                    <Row
                      icon="target"
                      title={t('groups.detail.groupGoal')}
                      subtitle={
                        group.goal_target
                          ? String(group.goal_target) +
                            ' ' +
                            t('app.groupUnitOption.' + group.progress_unit)
                          : t('app.groupGoalText.noFixedGoal')
                      }
                      onPress={() => setTab('progress')}
                    />
                    <T muted>{format('app.groupCode', group.code)}</T>
                    <Button
                      title={t('app.groupForm.shareGroup')}
                      icon="share-2"
                      variant="secondary"
                      onPress={() =>
                        void Share.share({
                          title: group.name,
                          message:
                            group.name +
                            '\n' +
                            groupShareUrl({ code: group.code, token: null }, locale),
                        })
                      }
                    />
                    <Button
                      title={t('groups.detail.startDiscussion')}
                      onPress={() => setTab('feed')}
                    />
                  </Card>
                  <GroupOverviewPanel backend={backend} group={group} />
                </View>
              ) : null}
              {tab === 'feed' ? (
                <GroupFeedPanel
                  backend={backend}
                  group={group}
                  postId={params.postId}
                  clearFocus={clearFocus}
                  draftStore={draftStore}
                  composerRef={composer}
                />
              ) : null}
              {tab === 'tasks' ? <GroupTasksPanel backend={backend} group={group} /> : null}
              {tab === 'members' ? <GroupMembersPanel backend={backend} group={group} /> : null}
              {tab === 'media' ? <GroupMediaPanel backend={backend} group={group} /> : null}
              {tab === 'events' ? <GroupEventsPanel backend={backend} group={group} /> : null}
              {tab === 'progress' ? <GroupProgressPanel backend={backend} group={group} /> : null}
              {tab === 'notices' ? (
                <GroupNoticesPanel backend={backend} group={group} openPost={openPost} />
              ) : null}
              {tab === 'rules' ? <GroupRulesPanel backend={backend} group={group} /> : null}
              {tab === 'profile' ? <GroupProfilePanel backend={backend} group={group} /> : null}
              {tab === 'settings' && permitted(group, 'group.update') ? (
                <GroupSettingsPanel
                  backend={backend}
                  group={group}
                  onSaved={reload}
                  onDeleted={() => navigation.replace('Groups')}
                />
              ) : null}
              {tab === 'reports' && permitted(group, 'report.manage') ? (
                <GroupReportsPanel backend={backend} group={group} />
              ) : null}
              {tab === 'audit' && permitted(group, 'audit.view') ? (
                <GroupAuditPanel backend={backend} group={group} />
              ) : null}
            </View>
          </GroupRefreshContext>
        </>
      ) : !resource.busy && !params.invite ? (
        <GroupJoinFlow
          backend={backend}
          target={incoming ?? undefined}
          onJoined={(code) => navigation.replace('Group', { code })}
        />
      ) : null}
      <Sheet
        visible={inviteVisible && incoming !== null}
        title={t('groups.invite.confirmTitle')}
        onClose={closeInvite}
      >
        {incoming ? (
          <GroupJoinFlow
            backend={backend}
            target={incoming}
            onJoined={(code) => {
              setInviteVisible(false);
              navigation.replace('Group', { code });
            }}
            onCancel={closeInvite}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}
