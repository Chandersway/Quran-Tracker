import React, { useEffect, useState, useRef } from 'react';
import { Platform, Share, View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { Group, GroupFeedPost } from '../../../services/backend/types';
import { useI18n } from '../../../i18n';
import { Button, Empty, Field, Segments, Sheet, T } from '../../../shared/components';
import { ConfirmAction, permitted, ResourceState } from './groupUi';
import { usePalette } from '../../../shared/theme';
import type { GroupDraftStore } from '../../../services/groups/groupDrafts';
import { useGroupFeed } from './useGroupFeed';
import { communityText } from '../communityCopy';
import { GroupFeedPostCard } from './GroupFeedPostCard';
import { GroupPostComposer } from './GroupPostComposer';
import { GroupDiscussionSheet } from './GroupDiscussionSheet';
import { useFeedWindow } from '../hooks/useFeedWindow';
import { feedCopy } from '../feedCopy';
import { useFeedReactions } from '../hooks/useFeedReactions';

export function GroupFeedPanel({
  backend,
  group,
  postId,
  clearFocus,
  draftStore,
  composerRef,
}: {
  backend: Backend;
  group: Group;
  postId?: string;
  clearFocus: () => void;
  draftStore: GroupDraftStore;
  composerRef?: React.RefObject<React.ComponentRef<typeof View> | null>;
}) {
  const { t, locale } = useI18n();
  const palette = usePalette();
  const resource = useGroupFeed(backend.groups, group.code, postId);
  const reactions = useFeedReactions(backend, group.code, resource.value, resource.setValue);
  const feedWindow = useFeedWindow(reactions.posts, postId);
  const copy = (key: Parameters<typeof communityText>[0]) => communityText(key, locale);
  const [selected, setSelected] = useState<GroupFeedPost | null>(null);
  const [edit, setEdit] = useState(false);
  const [edited, setEdited] = useState('');
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [discussionId, setDiscussionId] = useState<string | null>(postId ?? null);
  const [deletingComment, setDeletingComment] = useState<{ postId: string; id: string } | null>(
    null,
  );
  const discussion = resource.value.find((post) => post.id === discussionId);
  const pendingDiscussion = useRef<string | null>(null);
  const returnToDiscussion = (id: string) => {
    setDeletingComment(null);
    if (Platform.OS === 'ios') pendingDiscussion.current = id;
    else setDiscussionId(id);
  };
  useEffect(() => {
    setDiscussionId(postId ?? null);
  }, [postId]);
  return (
    <View style={{ gap: 10, position: 'relative' }}>
      {feedWindow.unseenCount > 0 ? (
        <View style={{ position: 'absolute', top: 0, start: 8, end: 8, zIndex: 2 }}>
          <Button
            title={feedCopy[locale].newPosts(feedWindow.unseenCount)}
            icon="arrow-up"
            variant="secondary"
            onPress={feedWindow.reveal}
            style={{ backgroundColor: palette.surface }}
          />
        </View>
      ) : null}
      {resource.connection === 'offline' && !resource.error ? (
        <T translate={false} muted size={12} accessibilityLiveRegion="polite">
          {copy('offline')}
        </T>
      ) : null}
      <ResourceState
        busy={resource.busy && !resource.value.length}
        error={reactions.error || resource.error}
        onRetry={() => {
          reactions.clearError();
          void resource.retry();
        }}
      />
      {postId ? (
        <Button title={t('groups.feed.closeDiscussion')} variant="secondary" onPress={clearFocus} />
      ) : null}
      {permitted(group, 'post.create') ? (
        <GroupPostComposer
          backend={backend}
          groupCode={group.code}
          draftStore={draftStore}
          composerRef={composerRef}
          onSent={() => void resource.reload()}
        />
      ) : null}
      {resource.busy && !resource.value.length ? (
        <View
          accessible
          accessibilityLabel={t('common.loading')}
          style={{ gap: 10, paddingVertical: 16 }}
        >
          {[0, 1].map((placeholder) => (
            <View
              key={placeholder}
              style={{
                gap: 10,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderColor: palette.line,
              }}
            >
              <View
                style={{
                  height: 16,
                  width: '45%',
                  borderRadius: 4,
                  backgroundColor: palette.subtle,
                }}
              />
              <View
                style={{
                  height: 14,
                  width: '90%',
                  borderRadius: 4,
                  backgroundColor: palette.subtle,
                }}
              />
              <View
                style={{
                  height: 14,
                  width: '65%',
                  borderRadius: 4,
                  backgroundColor: palette.subtle,
                }}
              />
            </View>
          ))}
        </View>
      ) : null}
      {!resource.busy && !resource.error && !resource.value.length ? (
        <Empty
          icon="message-circle"
          title={t('groups.detail.posts.emptyTitle')}
          message={t('app.groupManagement.noActivityBody')}
        />
      ) : null}
      {feedWindow.posts.map((post) => (
        <GroupFeedPostCard
          key={post.id}
          post={post}
          locale={locale}
          busy={reactions.busy(post.id)}
          canReact={permitted(group, 'reaction.create')}
          onReact={(reaction) =>
            permitted(group, 'reaction.create') && reactions.toggle(post, reaction)
          }
          onReply={() => setDiscussionId(post.id)}
          onMore={() => {
            setSelected(post);
            setEdit(false);
            setReport(false);
            setEdited(post.content);
            setDetails('');
            setReason('spam');
          }}
        />
      ))}
      {!postId && resource.nextCursor ? (
        <Button
          title={copy('older')}
          variant="secondary"
          loading={resource.loadingOlder}
          disabled={resource.busy || resource.loadingOlder}
          onPress={() => void resource.loadOlder()}
        />
      ) : !postId && resource.value.length && !resource.busy ? (
        <T translate={false} muted size={13}>
          {copy('end')}
        </T>
      ) : null}
      <Sheet
        avoidKeyboard
        visible={selected !== null}
        title={t(
          edit
            ? 'groups.feed.edit.title'
            : report
              ? 'groups.feed.report.title'
              : 'groups.feed.moreActions',
        )}
        onClose={() => {
          if (!resource.busy) setSelected(null);
        }}
      >
        <ResourceState {...resource} />
        {selected && edit ? (
          <>
            <Field
              label={t('groups.feed.edit.body')}
              value={edited}
              onChangeText={setEdited}
              multiline
              maxLength={10000}
            />
            <Button
              title={t('groups.feed.edit.confirm')}
              loading={resource.busy}
              disabled={resource.busy || !edited.trim()}
              onPress={() =>
                void resource.run(async () => {
                  await backend.groups.updatePost(group.code, selected.id, edited);
                  setSelected(null);
                }, 'groups.feed.edit.error')
              }
            />
          </>
        ) : selected && report ? (
          <>
            <T muted>{t('groups.feed.report.body')}</T>
            <Segments
              value={reason}
              options={['spam', 'harassment', 'inappropriate', 'misinformation', 'other'].map(
                (value) => ({ value, label: t(`groups.feed.report.reason.${value}`) }),
              )}
              onChange={setReason}
            />
            <Field
              label={t('groups.feed.report.details')}
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={2000}
            />
            <Button
              title={t('groups.feed.report.confirm')}
              loading={resource.busy}
              disabled={resource.busy}
              onPress={() =>
                void resource.run(async () => {
                  await backend.groups.reportPost(group.code, selected.id, reason, details);
                  setSelected(null);
                }, 'groups.feed.report.error')
              }
            />
          </>
        ) : selected ? (
          <View style={{ gap: 12 }}>
            {selected.isMine && selected.type === 'text' ? (
              <Button
                title={t('groups.feed.edit.action')}
                variant="secondary"
                onPress={() => setEdit(true)}
              />
            ) : null}
            {permitted(group, 'post.pin') ? (
              <Button
                title={t(selected.isPinned ? 'groups.feed.unpin.action' : 'groups.feed.pin.action')}
                variant="secondary"
                disabled={resource.busy}
                onPress={() =>
                  void resource.run(async () => {
                    await backend.groups.pinPost(group.code, selected.id, !selected.isPinned);
                    setSelected(null);
                  }, 'groups.feed.pin.error')
                }
              />
            ) : null}
            <Button
              title={t('groups.feed.share')}
              variant="quiet"
              onPress={() =>
                void Share.share({
                  title: group.name,
                  message: `${selected.content}\nqurantracker://group/${encodeURIComponent(group.code)}?postId=${encodeURIComponent(selected.id)}`,
                })
              }
            />
            {!selected.isMine ? (
              <Button
                title={t('groups.feed.report.action')}
                variant="quiet"
                onPress={() => setReport(true)}
              />
            ) : null}
            {selected.isMine || permitted(group, 'post.moderate') ? (
              <ConfirmAction
                title={t('groups.feed.delete.action')}
                body={t('groups.feed.delete.body')}
                disabled={resource.busy}
                action={() =>
                  void resource.run(async () => {
                    await backend.groups.deletePost(group.code, selected.id);
                    setSelected(null);
                  }, 'groups.feed.delete.error')
                }
              />
            ) : null}
          </View>
        ) : null}
      </Sheet>
      <GroupDiscussionSheet
        discussion={discussion}
        group={group}
        backend={backend}
        draftStore={draftStore}
        busy={resource.busy}
        onClose={() => setDiscussionId(null)}
        onSent={() => void resource.reload()}
        onDeleteComment={(parentId, id) => {
          setDeletingComment({ postId: parentId, id });
          setDiscussionId(null);
        }}
      />
      <Sheet
        visible={deletingComment !== null}
        title={t('groups.feed.comment.delete.title')}
        onDismiss={() => {
          if (pendingDiscussion.current) {
            setDiscussionId(pendingDiscussion.current);
            pendingDiscussion.current = null;
          }
        }}
        onClose={() => {
          if (!resource.busy && deletingComment) {
            returnToDiscussion(deletingComment.postId);
          }
        }}
      >
        <T style={{ marginBottom: 16 }}>{t('groups.feed.comment.delete.body')}</T>
        <ResourceState {...resource} />
        <Button
          title={t('groups.feed.delete.confirm')}
          variant="danger"
          loading={resource.busy}
          disabled={resource.busy}
          onPress={() =>
            void resource.run(
              async () => {
                if (!deletingComment) return;
                const pending = deletingComment;
                await backend.groups.deleteComment(group.code, pending.postId, pending.id);
                resource.setValue((rows) =>
                  rows.map((post) =>
                    post.id === pending.postId
                      ? {
                          ...post,
                          comments: post.comments.filter((comment) => comment.id !== pending.id),
                        }
                      : post,
                  ),
                );
                returnToDiscussion(pending.postId);
              },
              'groups.feed.comment.delete.error',
              false,
            )
          }
        />
        <Button
          title={t('common.cancel')}
          variant="quiet"
          disabled={resource.busy}
          onPress={() => {
            if (deletingComment) returnToDiscussion(deletingComment.postId);
          }}
        />
      </Sheet>
    </View>
  );
}
