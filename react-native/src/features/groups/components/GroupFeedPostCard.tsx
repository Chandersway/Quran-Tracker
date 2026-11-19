import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { GroupFeedPost } from '../../../services/backend/types';
import { Icon, IconButton, T } from '../../../shared/components';
import type { IconName } from '../../../shared/components/Icon';
import { usePalette } from '../../../shared/theme';
import { feedCopy, type FeedLocale, type FeedReaction } from '../feedCopy';
import { ExpandablePostText } from './ExpandablePostText';
import { FeedAvatar } from './FeedAvatar';
import { formatFeedTime } from './feedPresentation';
import { GroupImage } from './GroupImage';

const reactionIcons: Record<FeedReaction, IconName> = {
  like: 'thumbs-up',
  love: 'heart',
  dua: 'moon',
  insightful: 'sun',
};
const reactions = Object.keys(reactionIcons) as FeedReaction[];

/** A plain, content-sized feed item. Only the requested reaction picker adds temporary space. */
export function GroupFeedPostCard({
  post,
  canReact,
  busy,
  locale,
  onReact,
  onReply,
  onMore,
}: {
  post: GroupFeedPost;
  canReact: boolean;
  busy: boolean;
  locale: FeedLocale;
  onReact: (reaction: string) => void;
  onReply: () => void;
  onMore: () => void;
}) {
  const p = usePalette();
  const copy = feedCopy[locale];
  const [picker, setPicker] = useState(false);
  const chosen = reactions.find((reaction) => reaction === post.myReaction);
  const counts = reactions
    .map((reaction) => ({ reaction, count: Math.max(0, post.reactionCounts[reaction] ?? 0) }))
    .filter(({ count }) => count > 0);
  const total = counts.reduce((sum, { count }) => sum + count, 0);
  const accent = p.primary;
  return (
    <View
      testID={`feed-post-${post.id}`}
      style={{
        backgroundColor: p.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: p.line,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingTop: 8,
        overflow: 'hidden',
        direction: locale === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <FeedAvatar name={post.displayName} uri={post.avatarUrl} />
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <T translate={false} bold size={14} numberOfLines={2} style={{ flexShrink: 1 }}>
            {post.displayName}
          </T>
          <T
            translate={false}
            muted
            size={11}
            accessibilityLabel={new Date(post.createdAt).toLocaleString(locale)}
          >
            {formatFeedTime(post.createdAt, locale)}
            {post.editedAt ? ` · ${copy.edited}` : ''}
            {post.isPinned ? ` · ${copy.pinned}` : ''}
          </T>
        </View>
        <IconButton name="more-horizontal" label={copy.more} onPress={onMore} />
      </View>
      <View style={{ paddingTop: 6, paddingBottom: 8, gap: 8 }}>
        <ExpandablePostText key={`${post.id}:${post.editedAt ?? ''}`} content={post.content} />
        {post.media ? (
          <GroupImage
            source={{ uri: post.media.signedUrl }}
            style={{ width: '100%', aspectRatio: 1.5, borderRadius: 6 }}
            accessibilityLabel={post.media.caption || post.media.file_name}
          />
        ) : null}
      </View>
      {total > 0 || post.comments.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 5,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {total > 0 ? (
            <View
              accessible
              accessibilityLabel={copy.reactionsCount(total)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              {counts.map(({ reaction }) => (
                <Icon key={reaction} name={reactionIcons[reaction]} size={14} color={p.muted} />
              ))}
              <T translate={false} muted size={12}>
                {total.toLocaleString(locale)}
              </T>
            </View>
          ) : (
            <View />
          )}
          {post.comments.length > 0 ? (
            <T translate={false} muted size={12}>
              {copy.commentsCount(post.comments.length)}
            </T>
          ) : null}
        </View>
      ) : null}
      {picker && canReact ? (
        <View
          testID="feed-reaction-picker"
          accessibilityLabel={copy.chooseReaction}
          style={{
            flexDirection: 'row',
            backgroundColor: p.subtle,
            borderRadius: 10,
            marginVertical: 4,
            padding: 3,
          }}
        >
          {reactions.map((reaction) => (
            <Pressable
              key={reaction}
              accessibilityRole="button"
              accessibilityLabel={copy.reactions[reaction]}
              accessibilityState={{ selected: chosen === reaction, disabled: busy }}
              disabled={busy}
              onPress={() => {
                setPicker(false);
                onReact(reaction);
              }}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 56,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                paddingVertical: 5,
                paddingHorizontal: 2,
                borderRadius: 8,
                backgroundColor: pressed || chosen === reaction ? p.surface : 'transparent',
              })}
            >
              <Icon
                name={reactionIcons[reaction]}
                size={21}
                color={chosen === reaction ? accent : p.ink}
              />
              <T
                translate={false}
                size={11}
                bold={chosen === reaction}
                style={{ textAlign: 'center', flexShrink: 1 }}
              >
                {copy.reactions[reaction]}
              </T>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: p.line,
        }}
      >
        {canReact ? (
          <View style={{ flex: 1.5, minWidth: 0, flexDirection: 'row' }}>
            <Pressable
              testID="feed-like-action"
              accessibilityRole="button"
              accessibilityLabel={copy.reactions[chosen ?? 'like']}
              accessibilityState={{ selected: Boolean(chosen), disabled: busy }}
              accessibilityActions={[{ name: 'longpress', label: copy.chooseReaction }]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'longpress') setPicker(true);
              }}
              disabled={busy}
              delayLongPress={350}
              onLongPress={() => setPicker(true)}
              onPress={() => {
                setPicker(false);
                onReact(chosen ?? 'like');
              }}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingHorizontal: 6,
                paddingVertical: 7,
                backgroundColor: pressed ? p.subtle : 'transparent',
                opacity: busy ? 0.55 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  flexShrink: 1,
                  minWidth: 0,
                }}
              >
                <Icon
                  name={reactionIcons[chosen ?? 'like']}
                  size={21}
                  color={chosen ? accent : p.muted}
                />
                <T
                  translate={false}
                  size={13}
                  numberOfLines={2}
                  bold={Boolean(chosen)}
                  color={chosen ? accent : p.muted}
                  style={{ flexShrink: 1, minWidth: 0, textAlign: 'center' }}
                >
                  {locale === 'nl' && (!chosen || chosen === 'like')
                    ? copy.reactions.like.replace(/ (?=\S+$)/u, '\n')
                    : copy.reactions[chosen ?? 'like']}
                </T>
              </View>
            </Pressable>
            <Pressable
              testID="feed-reaction-disclosure"
              accessibilityRole="button"
              accessibilityLabel={picker ? copy.closeReactions : copy.chooseReaction}
              accessibilityState={{ expanded: picker, disabled: busy }}
              disabled={busy}
              onPress={() => setPicker((value) => !value)}
              style={({ pressed }) => ({
                minHeight: 48,
                width: 48,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? p.subtle : 'transparent',
                opacity: busy ? 0.55 : 1,
              })}
            >
              <Icon name={picker ? 'chevron-up' : 'chevron-down'} size={18} color={p.muted} />
            </Pressable>
          </View>
        ) : null}
        <Pressable
          testID="feed-comment-action"
          accessibilityRole="button"
          accessibilityLabel={copy.reply}
          onPress={onReply}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 0,
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 7,
            paddingHorizontal: 4,
            backgroundColor: pressed ? p.subtle : 'transparent',
          })}
        >
          <Icon name="message-circle" size={21} color={p.muted} />
          <T translate={false} size={13} color={p.muted} style={{ flexShrink: 1 }}>
            {copy.reply}
          </T>
        </Pressable>
      </View>
    </View>
  );
}
