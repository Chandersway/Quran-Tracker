import { GroupImage } from './GroupImage';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, Share, View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { Group, GroupFeedPost } from '../../../services/backend/types';
import { useI18n } from '../../../i18n';
import {
  Button,
  Card,
  Empty,
  Field,
  IconButton,
  Segments,
  Sheet,
  T,
} from '../../../shared/components';
import { ConfirmAction, permitted, ResourceState } from './groupUi';
import { usePalette } from '../../../shared/theme';
import type { GroupDraftStore } from '../../../services/groups/groupDrafts';
import { useGroupFeed } from './useGroupFeed';
import { communityText } from '../communityCopy';
import { ExpandablePostText } from './ExpandablePostText';

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
  const { t, format, locale } = useI18n();
  const palette = usePalette();
  const direction = 'row';
  const dateText = (date: string) => new Date(date).toLocaleString(locale);
  const resource = useGroupFeed(backend.groups, group.code, postId);
  const drafts = useSyncExternalStore(
    draftStore.subscribe,
    draftStore.snapshot,
    draftStore.snapshot,
  );
  const message = drafts.post.text;
  const setMessage = (text: string) => draftStore.set(text);
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
  useEffect(() => {
    setDiscussionId(postId ?? null);
  }, [postId]);
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: direction, alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: resource.connection === 'live' ? palette.primary : palette.muted,
          }}
        />
        <T translate={false} muted size={12} style={{ flex: 1 }} accessibilityLiveRegion="polite">
          {copy(resource.connection)}
        </T>
      </View>
      <ResourceState {...resource} onRetry={() => void resource.retry()} />
      {postId ? (
        <Button title={t('groups.feed.closeDiscussion')} variant="secondary" onPress={clearFocus} />
      ) : null}
      {permitted(group, 'post.create') ? (
        <View ref={composerRef} collapsable={false}>
          <Card style={{ gap: 10 }}>
            <Field
              label={t('app.groupFeed.placeholder')}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              style={{ maxHeight: 160, textAlignVertical: 'top' }}
            />
            <Button
              title={drafts.post.status === 'failed' ? t('common.retry') : t('groups.detail.post')}
              icon="send"
              disabled={drafts.post.status === 'sending' || !message.trim()}
              loading={drafts.post.status === 'sending'}
              onPress={() =>
                void draftStore
                  .send((text, actorId) =>
                    backend.groups.createTextPost(group.code, text, undefined, actorId),
                  )
                  .then((sent) => {
                    if (sent) void resource.reload();
                  })
              }
            />
            {drafts.post.status !== 'idle' ? (
              <T
                translate={false}
                size={13}
                color={drafts.post.status === 'failed' ? palette.danger : palette.muted}
                accessibilityLiveRegion="polite"
              >
                {copy(drafts.post.status)}
              </T>
            ) : null}
          </Card>
        </View>
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
      {[...resource.value]
        .sort((left, right) => Number(right.isPinned) - Number(left.isPinned))
        .map((post) => (
          <Card key={post.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: direction, gap: 10, alignItems: 'center' }}>
              {post.avatarUrl ? (
                <GroupImage
                  source={{ uri: post.avatarUrl }}
                  style={{ width: 38, height: 38, borderRadius: 19 }}
                  accessibilityLabel={post.displayName}
                />
              ) : (
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: palette.subtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T translate={false} bold color={palette.primary}>
                    {post.displayName.trim().slice(0, 1)}
                  </T>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <T translate={false} bold>
                  {post.displayName}
                </T>
                <T muted size={12}>
                  {dateText(post.createdAt)}
                  {post.editedAt ? ` · ${t('groups.feed.edited')}` : ''}
                  {post.isPinned ? ` · ${t('groups.detail.pinned')}` : ''}
                </T>
              </View>
              <IconButton
                name="more-horizontal"
                label={t('groups.feed.moreActions')}
                onPress={() => {
                  setSelected(post);
                  setEdit(false);
                  setReport(false);
                  setEdited(post.content);
                  setDetails('');
                  setReason('spam');
                }}
              />
            </View>
            {post.media ? (
              <GroupImage
                source={{ uri: post.media.signedUrl }}
                style={{ width: '100%', aspectRatio: 1.5, borderRadius: 10 }}
                accessibilityLabel={post.media.caption || post.media.file_name}
              />
            ) : null}
            <ExpandablePostText key={`${post.id}:${post.editedAt ?? ''}`} content={post.content} />
            {permitted(group, 'reaction.create') ? (
              <View style={{ flexDirection: direction, flexWrap: 'wrap', gap: 6 }}>
                {['like', 'love', 'dua', 'insightful'].map((reaction) => (
                  <Pressable
                    key={reaction}
                    accessibilityRole="button"
                    accessibilityLabel={t(`groups.feed.reaction.${reaction}`)}
                    accessibilityState={{
                      selected: post.myReaction === reaction,
                      disabled: resource.busy,
                    }}
                    disabled={resource.busy}
                    onPress={() =>
                      void resource.run(() =>
                        backend.groups.toggleReaction(group.code, post.id, reaction),
                      )
                    }
                    style={{
                      minHeight: 48,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor:
                        post.myReaction === reaction ? palette.subtle : palette.surface,
                      borderWidth: 1,
                      borderColor: palette.line,
                      justifyContent: 'center',
                    }}
                  >
                    <T size={12} bold={post.myReaction === reaction}>
                      {t(`groups.feed.reaction.${reaction}`)} · {post.reactionCounts[reaction] ?? 0}
                    </T>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Button
              title={
                post.comments.length
                  ? format(
                      post.comments.length === 1
                        ? 'groups.feed.comment.one'
                        : 'groups.feed.comment.other',
                      post.comments.length,
                    )
                  : t('app.groupFeed.reply')
              }
              variant="quiet"
              icon="message-circle"
              onPress={() => setDiscussionId(post.id)}
            />
          </Card>
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
      <Sheet
        avoidKeyboard
        visible={Boolean(discussion)}
        title={t('groups.feed.discussion')}
        onClose={() => setDiscussionId(null)}
      >
        <ResourceState {...resource} />
        {discussion ? (
          <View style={{ gap: 16 }}>
            <T translate={false} bold>
              {discussion.displayName}
            </T>
            <T translate={false}>{discussion.content}</T>
            {!discussion.comments.length ? <T muted>{t('groups.feed.noComments')}</T> : null}
            {discussion.comments.map((comment) => (
              <View
                key={comment.id}
                style={{
                  paddingStart: 14,
                  borderStartWidth: 1,
                  borderStartColor: palette.line,
                  gap: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: direction,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <T translate={false} bold size={13}>
                      {comment.displayName}
                    </T>
                    <T muted size={11}>
                      {dateText(comment.createdAt)}
                    </T>
                  </View>
                  {comment.isMine || permitted(group, 'comment.moderate') ? (
                    <IconButton
                      name="trash-2"
                      label={t('groups.feed.comment.delete.action')}
                      disabled={resource.busy}
                      onPress={() => {
                        setDeletingComment({ postId: discussion.id, id: comment.id });
                        setDiscussionId(null);
                      }}
                    />
                  ) : null}
                </View>
                <T translate={false} size={14}>
                  {comment.content}
                </T>
              </View>
            ))}
            {permitted(group, 'comment.create') ? (
              <>
                <Field
                  label={t('app.groupManagement.feedReplyPlaceholder')}
                  value={drafts.comments[discussion.id]?.text ?? ''}
                  onChangeText={(content) => draftStore.set(content, discussion.id)}
                  maxLength={400}
                  multiline
                />
                <Button
                  title={
                    drafts.comments[discussion.id]?.status === 'failed'
                      ? t('common.retry')
                      : t('app.groupManagement.feedReplySubmit')
                  }
                  disabled={
                    drafts.comments[discussion.id]?.status === 'sending' ||
                    !drafts.comments[discussion.id]?.text.trim()
                  }
                  loading={drafts.comments[discussion.id]?.status === 'sending'}
                  onPress={() =>
                    void draftStore
                      .send(
                        (text, actorId) =>
                          backend.groups.addComment(
                            group.code,
                            discussion.id,
                            text,
                            undefined,
                            actorId,
                          ),
                        discussion.id,
                      )
                      .then((sent) => {
                        if (sent) void resource.reload();
                      })
                  }
                />
                {drafts.comments[discussion.id]?.status &&
                drafts.comments[discussion.id]?.status !== 'idle' ? (
                  <T
                    translate={false}
                    size={13}
                    color={
                      drafts.comments[discussion.id]?.status === 'failed'
                        ? palette.danger
                        : palette.muted
                    }
                    accessibilityLiveRegion="polite"
                  >
                    {copy(drafts.comments[discussion.id]!.status as 'sending' | 'failed' | 'sent')}
                  </T>
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}
      </Sheet>
      <Sheet
        visible={deletingComment !== null}
        title={t('groups.feed.comment.delete.title')}
        onClose={() => {
          if (!resource.busy && deletingComment) {
            setDiscussionId(deletingComment.postId);
            setDeletingComment(null);
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
                setDeletingComment(null);
                setDiscussionId(pending.postId);
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
            if (deletingComment) setDiscussionId(deletingComment.postId);
            setDeletingComment(null);
          }}
        />
      </Sheet>
    </View>
  );
}
