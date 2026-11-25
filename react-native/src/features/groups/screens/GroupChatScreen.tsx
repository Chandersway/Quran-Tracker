import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBackend } from '../../../config/runtime';
import type { Backend } from '../../../services/backend/backend';
import type { Group, GroupFeedPost } from '../../../services/backend/types';
import { GroupChatScroll } from '../../../services/groups/groupChat';
import { useAppNavigation, type RootStack } from '../../../app/navigation/types';
import { useI18n } from '../../../i18n';
import { Button, Empty, IconButton, Notice, Screen, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { GroupChatComposer } from '../components/GroupChatComposer';
import { GroupTypingStatus } from '../components/GroupTypingStatus';
import { useChatSession, useGroupChat } from '../hooks/useGroupChat';
import { useGroupTyping } from '../hooks/useGroupTyping';
import { permitted, ResourceState, useGroupResource } from '../components/groupUi';
import { communityText } from '../communityCopy';
import { chatText } from '../chatCopy';

export function GroupChatScreen() {
  const { params } = useRoute<RouteProp<RootStack, 'GroupChat'>>();
  const backend = useMemo(() => getBackend(), []);
  const account = useChatSession(backend);
  const { t } = useI18n();
  const navigation = useAppNavigation();
  if (!backend || account.error || !account.session)
    return (
      <Screen>
        {account.session === undefined && backend && !account.error ? (
          <T muted>{t('common.loading')}</T>
        ) : (
          <>
            <Notice
              error={account.error}
              message={t(
                !backend
                  ? 'account.supabaseMissing'
                  : account.error
                    ? 'groups.error.session'
                    : 'groups.error.login',
              )}
              onRetry={account.error ? account.retry : undefined}
            />
            <Button
              title={t('groups.accountRequired.action')}
              onPress={() => navigation.navigate('Account')}
            />
          </>
        )}
      </Screen>
    );
  return (
    <ChatGroup
      key={account.session.user.id + ':' + params.code}
      backend={backend}
      code={params.code}
      accountId={account.session.user.id}
    />
  );
}

function ChatGroup({
  backend,
  code,
  accountId,
}: {
  backend: Backend;
  code: string;
  accountId: string;
}) {
  const { t } = useI18n();
  const group = useGroupResource(
    () => backend.groups.get(code),
    [backend, code],
    null as Group | null,
  );
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else void group.reload();
    }, [backend, code]),
  );
  if (
    !group.value ||
    group.error ||
    !group.value.viewer_role ||
    group.value.viewer_role === 'guest'
  )
    return (
      <Screen>
        <ResourceState {...group} onRetry={() => void group.reload()} />
        {!group.busy && !group.error ? (
          <Notice error message={t('groups.error.permission')} />
        ) : null}
      </Screen>
    );
  return (
    <Conversation
      backend={backend}
      group={group.value}
      accountId={accountId}
      refreshGroup={group.reload}
    />
  );
}

function Conversation({
  backend,
  group,
  accountId,
  refreshGroup,
}: {
  backend: Backend;
  group: Group;
  accountId: string;
  refreshGroup(): Promise<void>;
}) {
  const { locale, t } = useI18n();
  const p = usePalette();
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const header = useHeaderHeight();
  const root = useRef<React.ComponentRef<typeof View>>(null);
  const list = useRef<FlatList<GroupFeedPost>>(null);
  const policy = useMemo(() => new GroupChatScroll(), [accountId, group.code]);
  const [windowTop, setWindowTop] = useState(header);
  const [unread, setUnread] = useState(0);
  const chat = useGroupChat(backend, group.code, accountId);
  const canSend = !chat.accessDenied && permitted(group, 'post.create');
  const typing = useGroupTyping(backend, group.code, accountId, canSend);
  const lastSent = useRef(0);
  const direction = 'row';
  useEffect(() => {
    if (chat.sendDenied) void refreshGroup();
  }, [chat.sendDenied]);
  useEffect(() => {
    if (chat.sentRevision !== lastSent.current) {
      lastSent.current = chat.sentRevision;
      policy.showLatest();
    }
    const change = policy.observe(chat.value);
    setUnread(change.unread);
    if (change.scroll) {
      const frame = requestAnimationFrame(() => {
        if (policy.takeScroll()) list.current?.scrollToOffset({ offset: 0, animated: false });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [chat.value, chat.sentRevision, policy]);
  const showLatest = () => {
    policy.showLatest();
    setUnread(0);
    if (policy.takeScroll()) list.current?.scrollToOffset({ offset: 0, animated: false });
  };
  return (
    <View
      ref={root}
      style={{ flex: 1, backgroundColor: p.background }}
      onLayout={() =>
        root.current?.measureInWindow((_x, top) => {
          if (Number.isFinite(top)) setWindowTop(top);
        })
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={windowTop}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            width: '100%',
            maxWidth: 880,
            alignSelf: 'center',
            paddingBottom: insets.bottom,
          }}
        >
          <View
            style={{
              flexDirection: direction,
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderColor: p.line,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <T translate={false} size={20} bold>
                {group.name}
              </T>
              <T translate={false} muted size={12} accessibilityLiveRegion="polite">
                {chat.connection === 'polling'
                  ? chatText('polling', locale)
                  : communityText(chat.connection, locale)}
              </T>
            </View>
            <IconButton
              name="refresh-cw"
              label={t('app.groupRefresh')}
              disabled={chat.busy}
              onPress={() => {
                void refreshGroup();
                void chat.reload();
              }}
            />
          </View>
          {chat.error ? (
            <View style={{ paddingHorizontal: 16 }}>
              <Notice
                error
                message={chat.error}
                onRetry={() => {
                  void chat.retry();
                  void refreshGroup();
                }}
              />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <FlatList
              ref={list}
              testID="group-chat-list"
              style={{ flex: 1 }}
              inverted
              data={chat.accessDenied ? [] : chat.value}
              keyExtractor={(item) => item.id}
              initialNumToRender={20}
              maxToRenderPerBatch={16}
              windowSize={7}
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
              scrollEventThrottle={32}
              onScrollBeginDrag={() => policy.beginHistory()}
              onScroll={(event) => setUnread(policy.setOffset(event.nativeEvent.contentOffset.y))}
              onContentSizeChange={() => {
                if (policy.takeScroll()) {
                  list.current?.scrollToOffset({ offset: 0, animated: false });
                }
              }}
              ListEmptyComponent={
                chat.accessDenied ? undefined : chat.busy ? (
                  <T muted>{t('common.loading')}</T>
                ) : !chat.error ? (
                  <Empty
                    icon="message-circle"
                    title={chatText('empty', locale)}
                    message={chatText('emptyBody', locale)}
                  />
                ) : undefined
              }
              ListFooterComponent={
                chat.accessDenied || !chat.value.length ? undefined : chat.nextCursor ? (
                  <Button
                    title={chatText('older', locale)}
                    variant="quiet"
                    loading={chat.loadingOlder}
                    disabled={chat.busy}
                    onPress={() => void chat.loadOlder()}
                  />
                ) : (
                  <T muted size={12} style={{ textAlign: 'center', paddingVertical: 12 }}>
                    {chatText('beginning', locale)}
                  </T>
                )
              }
              renderItem={({ item, index }) => {
                const date = new Date(item.createdAt);
                const previous = chat.value[index + 1];
                const dayStart =
                  !previous || new Date(previous.createdAt).toDateString() !== date.toDateString();
                return (
                  <View style={{ paddingVertical: 5 }}>
                    {dayStart ? (
                      <T muted size={12} style={{ textAlign: 'center', paddingVertical: 12 }}>
                        {date.toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </T>
                    ) : null}
                    <View
                      style={{
                        alignSelf: item.isMine
                          ? locale === 'ar'
                            ? 'flex-start'
                            : 'flex-end'
                          : locale === 'ar'
                            ? 'flex-end'
                            : 'flex-start',
                        maxWidth: '92%',
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingTop: 10,
                        paddingBottom: 4,
                        backgroundColor: item.isMine ? p.subtle : p.surface,
                      }}
                    >
                      <T translate={false} bold size={13} color={p.primary}>
                        {item.displayName}
                        {item.isMine ? ' · ' + chatText('you', locale) : ''}
                      </T>
                      <T translate={false} selectable style={{ paddingTop: 3 }}>
                        {item.content}
                      </T>
                      <View style={{ flexDirection: direction, alignItems: 'center', gap: 8 }}>
                        <T muted size={12} style={{ flex: 1 }}>
                          {date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          {item.editedAt ? ' · ' + chatText('edited', locale) : ''}
                        </T>
                        <IconButton
                          name="more-horizontal"
                          label={chatText('discussion', locale)}
                          onPress={() =>
                            navigation.navigate('Group', { code: group.code, postId: item.id })
                          }
                        />
                      </View>
                    </View>
                  </View>
                );
              }}
            />
            {unread ? (
              <Button
                title={chatText('latest', locale) + ' (' + unread + ')'}
                icon="arrow-down"
                variant="secondary"
                onPress={showLatest}
                style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}
              />
            ) : null}
          </View>
          <View style={{ paddingHorizontal: 16 }}>
            <GroupTypingStatus participants={typing.participants} />
          </View>
          <GroupChatComposer
            draft={chat.draft}
            setDraft={(text) => {
              chat.setDraft(text);
              typing.activity(text.trim().length > 0);
            }}
            onFocus={typing.focus}
            onBlur={typing.blur}
            send={() => {
              typing.stop();
              void chat.send();
            }}
            error={chat.sendError}
            allowed={canSend}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
