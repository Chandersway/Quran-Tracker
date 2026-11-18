import { GroupImage } from '../components/GroupImage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { AuthSession } from '../../../services/auth/types';
import { getBackend } from '../../../config/runtime';
import type { Backend } from '../../../services/backend/backend';
import type { Group } from '../../../services/backend/types';
import { useAppNavigation } from '../../../app/navigation/types';
import { useI18n } from '../../../i18n';
import {
  Button,
  Card,
  Empty,
  Field,
  Icon,
  IconButton,
  Notice,
  Row,
  Screen,
  Segments,
  Sheet,
  T,
} from '../../../shared/components';
import { GroupCreateWizard } from '../components/GroupCreateWizard';
import { GroupJoinFlow } from '../components/GroupJoinFlow';
import { ResourceState, useGroupResource } from '../components/groupUi';

export function GroupsScreen() {
  const backend = useMemo(() => getBackend(), []);
  const { t } = useI18n();
  const navigation = useAppNavigation();
  const [session, setSession] = useState<AuthSession | null | undefined>();
  const [error, setError] = useState('');
  const [invitations, setInvitations] = useState(false);
  useEffect(() => {
    if (!backend) return;
    let active = true;
    let revision = 0;
    const stop = backend.auth.onChange((value) => {
      revision++;
      if (active) {
        setSession(value);
        setError('');
      }
    });
    const initial = revision;
    void backend.auth
      .getSession()
      .then((value) => {
        if (active && initial === revision) setSession(value);
      })
      .catch(() => {
        if (active) setError(t('groups.error.session'));
      });
    return () => {
      active = false;
      stop();
    };
  }, [backend]);
  if (!backend || !session)
    return (
      <Screen>
        <T size={30} bold>
          {t('groups.mine.title')}
        </T>
        {!backend ? (
          <Notice message={t('account.supabaseMissing')} />
        ) : error ? (
          <Notice error message={error} />
        ) : session === undefined ? (
          <T muted>{t('common.loading')}</T>
        ) : (
          <>
            <Empty
              icon="users"
              title={t('groups.accountRequired.title')}
              message={t('groups.accountRequired.body')}
            />
            <View style={{ gap: 12 }}>
              <Button
                title={t('groups.accountRequired.action')}
                onPress={() => navigation.navigate('Account')}
              />
              <Button
                title={t('app.groupJoinWithCode')}
                variant="secondary"
                onPress={() => setInvitations(true)}
              />
            </View>
          </>
        )}
        {backend ? (
          <Sheet
            avoidKeyboard
            visible={invitations}
            title={t('groups.invitations.title')}
            onClose={() => setInvitations(false)}
          >
            <GroupJoinFlow
              backend={backend}
              onJoined={(code) => {
                setInvitations(false);
                navigation.navigate('Group', { code });
              }}
            />
          </Sheet>
        ) : null}
      </Screen>
    );
  return <GroupsContent key={session.user.id} backend={backend} />;
}

function GroupCard({ group, backend }: { group: Group; backend: Backend }) {
  const { t, format } = useI18n();
  const navigation = useAppNavigation();
  const logo = useGroupResource(
    () => backend.groups.getLogo(group.code),
    [backend, group.code],
    null as string | null,
  );
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {logo.value ? (
          <GroupImage
            source={{ uri: logo.value }}
            accessibilityLabel={group.name}
            style={{ width: 48, height: 48, borderRadius: 14 }}
          />
        ) : (
          <Icon name="users" size={28} />
        )}
        <View style={{ flex: 1 }}>
          <T translate={false} bold size={19}>
            {group.name}
          </T>
          <T muted size={12}>
            {format('app.groupCode', group.code)}
          </T>
        </View>
      </View>
      {logo.error ? (
        <T muted size={12}>
          {logo.error}
        </T>
      ) : null}
      {group.description ? (
        <T translate={false} muted numberOfLines={2}>
          {group.description}
        </T>
      ) : null}
      <Row
        title={t('groups.detail.tab.posts')}
        subtitle={
          group.member_count === undefined
            ? undefined
            : format('app.groupHome.membersCount', group.member_count)
        }
        onPress={() => navigation.navigate('Group', { code: group.code })}
      />
    </Card>
  );
}

function GroupsContent({ backend }: { backend: Backend }) {
  const { t } = useI18n();
  const navigation = useAppNavigation();
  const resource = useGroupResource(() => backend.groups.list(), [backend], [] as Group[]);
  const [tab, setTab] = useState('mine');
  const [search, setSearch] = useState('');
  const [create, setCreate] = useState(false);
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void resource.reload();
    }, [backend]),
  );
  const filtered = resource.value.filter((group) =>
    [group.name, group.description, group.code].some((value) =>
      value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
    ),
  );
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <T bold size={30} style={{ flex: 1 }}>
          {t('groups.mine.title')}
        </T>
        <IconButton
          name="refresh-cw"
          label={t('app.groupRefresh')}
          disabled={resource.busy}
          onPress={() => void resource.reload()}
        />
      </View>
      <T muted style={{ marginBottom: 16 }}>
        {t('groups.overview.subtitle')}
      </T>
      <Segments
        value={tab}
        options={[
          { value: 'mine', label: t('groups.tab.mine') },
          { value: 'invitations', label: t('groups.tab.invitations') },
        ]}
        onChange={setTab}
      />
      <View style={{ gap: 14, paddingTop: 16 }}>
        {tab === 'invitations' ? (
          <GroupJoinFlow
            backend={backend}
            onJoined={(code) => navigation.navigate('Group', { code })}
          />
        ) : (
          <>
            <Field
              label={t('groups.search.placeholder')}
              value={search}
              onChangeText={setSearch}
              maxLength={60}
            />
            <ResourceState {...resource} onRetry={() => void resource.reload()} />
            {!resource.busy && !resource.error && !filtered.length ? (
              <Empty
                icon="users"
                title={t('groups.search.empty')}
                message={t('app.groupJoinText.subtitle')}
              />
            ) : null}
            {filtered.map((group) => (
              <GroupCard key={group.id} group={group} backend={backend} />
            ))}
            <Button title={t('app.groupCreate')} icon="plus" onPress={() => setCreate(true)} />
            <Button
              title={t('app.groupJoinWithCode')}
              variant="secondary"
              onPress={() => setTab('invitations')}
            />
          </>
        )}
      </View>
      <Sheet
        visible={create}
        title={t('app.groupForm.titleCreate')}
        onClose={() => setCreate(false)}
      >
        <GroupCreateWizard
          backend={backend}
          onCreated={(code) => {
            setCreate(false);
            void resource.reload();
            navigation.navigate('Group', { code });
          }}
          onCancel={() => setCreate(false)}
        />
      </Sheet>
    </Screen>
  );
}
