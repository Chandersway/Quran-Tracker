import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Platform, Pressable, TextInput, View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { Group, GroupFeedPost } from '../../../services/backend/types';
import type { GroupDraftStore } from '../../../services/groups/groupDrafts';
import { useI18n } from '../../../i18n';
import { Icon, Sheet, T } from '../../../shared/components';
import { fonts, usePalette } from '../../../shared/theme';
import { communityText } from '../communityCopy';
import { feedCopy } from '../feedCopy';
import { FeedAvatar } from './FeedAvatar';
import { formatFeedTime } from './feedPresentation';
import { permitted } from './groupUi';

const MIN_INPUT_HEIGHT = 48;
const MAX_INPUT_HEIGHT = 112;

/** The draft belongs to the account/group store, never to the lifetime of this sheet. */
export function GroupDiscussionSheet({
  discussion,
  group,
  draftStore,
  backend,
  busy,
  onClose,
  onSent,
  onDeleteComment,
}: {
  discussion: GroupFeedPost | undefined;
  group: Group;
  draftStore: GroupDraftStore;
  backend: Backend;
  busy: boolean;
  onClose: () => void;
  onSent: () => void;
  onDeleteComment: (postId: string, id: string) => void;
}) {
  const { locale } = useI18n();
  const p = usePalette();
  const copy = feedCopy[locale];
  const drafts = useSyncExternalStore(
    draftStore.subscribe,
    draftStore.snapshot,
    draftStore.snapshot,
  );
  const draft = discussion ? drafts.comments[discussion.id] : undefined;
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [actionComment, setActionComment] = useState<string | null>(null);
  const pendingDelete = useRef<{ postId: string; id: string } | null>(null);
  const latestDelete = useRef(onDeleteComment);
  latestDelete.current = onDeleteComment;
  useEffect(() => {
    setInputHeight(MIN_INPUT_HEIGHT);
    setActionComment(null);
  }, [discussion?.id]);
  const sending = draft?.status === 'sending';
  const inputLineHeight = locale === 'ar' || /[\u0600-\u06ff]/u.test(draft?.text ?? '') ? 27 : 22;
  const canComment = permitted(group, 'comment.create');
  const sendDisabled = busy || sending || !draft?.text.trim();

  async function sendComment() {
    if (!discussion || !canComment || sendDisabled) return;
    const id = discussion.id;
    const sent = await draftStore.send(
      (text, actorId) => backend.groups.addComment(group.code, id, text, undefined, actorId),
      id,
    );
    if (sent) onSent();
  }
  const deleteAfterDismiss = () => {
    const pending = pendingDelete.current;
    pendingDelete.current = null;
    if (pending) latestDelete.current(pending.postId, pending.id);
  };
  const footer =
    discussion && canComment ? (
      <View
        testID="group-comment-composer"
        style={{ borderTopWidth: 1, borderColor: p.line, paddingTop: 12, gap: 6 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <TextInput
            testID="group-comment-input"
            accessibilityLabel={copy.writeComment}
            placeholder={copy.writeComment}
            placeholderTextColor={p.muted}
            selectionColor={p.primary}
            value={draft?.text ?? ''}
            onChangeText={(text) => draftStore.set(text, discussion.id)}
            onContentSizeChange={({ nativeEvent }) => {
              const height = nativeEvent.contentSize.height;
              if (Number.isFinite(height))
                setInputHeight(Math.max(MIN_INPUT_HEIGHT, Math.min(MAX_INPUT_HEIGHT, height)));
            }}
            multiline
            maxLength={400}
            scrollEnabled={inputHeight >= MAX_INPUT_HEIGHT}
            style={{
              flex: 1,
              minWidth: 0,
              height: inputHeight,
              minHeight: MIN_INPUT_HEIGHT,
              maxHeight: MAX_INPUT_HEIGHT,
              borderWidth: 1,
              borderColor: draft?.status === 'failed' ? p.danger : p.line,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 11,
              backgroundColor: p.subtle,
              color: p.ink,
              fontFamily: locale === 'ar' ? fonts.arabicUi : fonts.regular,
              fontSize: 15,
              lineHeight: inputLineHeight,
              textAlign: locale === 'ar' ? 'right' : 'left',
              writingDirection: locale === 'ar' ? 'rtl' : 'auto',
              textAlignVertical: 'top',
            }}
          />
          <Pressable
            testID="group-comment-send"
            accessibilityRole="button"
            accessibilityLabel={draft?.status === 'failed' ? copy.retry : copy.send}
            accessibilityState={{ disabled: sendDisabled, busy: sending }}
            disabled={sendDisabled}
            onPress={sendComment}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: sendDisabled ? p.subtle : p.primary,
              opacity: pressed && !sendDisabled ? 0.75 : 1,
            })}
          >
            {sending ? (
              <ActivityIndicator size="small" color={p.muted} />
            ) : (
              <Icon name="send" size={21} color={sendDisabled ? p.muted : p.onPrimary} />
            )}
          </Pressable>
        </View>
        {draft && draft.status !== 'idle' ? (
          <T
            translate={false}
            size={12}
            color={draft.status === 'failed' ? p.danger : p.muted}
            accessibilityLiveRegion="polite"
          >
            {draft.status === 'failed'
              ? copy.failed
              : draft.status === 'sending'
                ? copy.sending
                : communityText('sent', locale)}
          </T>
        ) : null}
      </View>
    ) : undefined;

  return (
    <Sheet
      visible={Boolean(discussion)}
      title={copy.commentsCount(discussion?.comments.length ?? 0)}
      translateTitle={false}
      avoidKeyboard
      size="expanded"
      onClose={onClose}
      onDismiss={deleteAfterDismiss}
      footer={footer}
    >
      {discussion ? (
        <View style={{ gap: 16 }}>
          <View
            testID="group-discussion-summary"
            style={{ paddingBottom: 12, borderBottomWidth: 1, borderColor: p.line, gap: 4 }}
          >
            <T translate={false} muted size={12} numberOfLines={1}>
              {discussion.displayName}
            </T>
            <T translate={false} size={14} numberOfLines={2} ellipsizeMode="tail">
              {discussion.content}
            </T>
          </View>
          {!discussion.comments.length ? (
            <T translate={false} muted size={14} style={{ paddingVertical: 8 }}>
              {copy.noComments}
            </T>
          ) : null}
          {discussion.comments.map((comment) => (
            <View
              key={comment.id}
              testID={`group-comment-${comment.id}`}
              style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}
            >
              <FeedAvatar name={comment.displayName} uri={comment.avatarUrl} size={32} />
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <View
                  testID={`group-comment-bubble-${comment.id}`}
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '100%',
                    backgroundColor: p.subtle,
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    gap: 2,
                  }}
                >
                  <T translate={false} bold size={13} style={{ flexShrink: 1 }}>
                    {comment.displayName}
                  </T>
                  <T
                    translate={false}
                    size={15}
                    style={{
                      lineHeight:
                        locale === 'ar' || /[\u0600-\u06ff]/u.test(comment.content) ? 27 : 22,
                    }}
                  >
                    {comment.content}
                  </T>
                </View>
                <T translate={false} muted size={11} style={{ paddingHorizontal: 12 }}>
                  {formatFeedTime(comment.createdAt, locale)}
                </T>
                {actionComment === comment.id &&
                (comment.isMine || permitted(group, 'comment.moderate')) ? (
                  <View
                    testID={`group-comment-actions-${comment.id}`}
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: p.surface,
                      borderWidth: 1,
                      borderColor: p.line,
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <Pressable
                      testID={`group-comment-delete-${comment.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={copy.deleteComment}
                      accessibilityState={{ disabled: busy || sending }}
                      disabled={busy || sending}
                      onPress={() => {
                        setActionComment(null);
                        pendingDelete.current = { postId: discussion.id, id: comment.id };
                        onClose();
                        // UIKit must finish dismissing before the confirmation is presented.
                        if (Platform.OS !== 'ios') deleteAfterDismiss();
                      }}
                      style={({ pressed }) => ({
                        minHeight: 48,
                        paddingHorizontal: 16,
                        justifyContent: 'center',
                        backgroundColor: pressed ? p.subtle : p.surface,
                        opacity: busy || sending ? 0.45 : 1,
                      })}
                    >
                      <T translate={false} size={14} color={p.danger}>
                        {copy.deleteComment}
                      </T>
                    </Pressable>
                  </View>
                ) : null}
              </View>
              {comment.isMine || permitted(group, 'comment.moderate') ? (
                <Pressable
                  testID={`group-comment-more-${comment.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={
                    actionComment === comment.id ? copy.closeCommentActions : copy.commentActions
                  }
                  accessibilityState={{
                    disabled: busy || sending,
                    expanded: actionComment === comment.id,
                  }}
                  disabled={busy || sending}
                  onPress={() => {
                    setActionComment((current) => (current === comment.id ? null : comment.id));
                  }}
                  style={({ pressed }) => ({
                    width: 48,
                    minHeight: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: busy || sending ? 0.45 : pressed ? 0.7 : 1,
                  })}
                >
                  <Icon name="more-horizontal" size={20} color={p.muted} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Sheet>
  );
}
