import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { GroupDraftStore } from '../../../services/groups/groupDrafts';
import type { Profile } from '../../../services/profiles/types';
import { Button, Sheet, T } from '../../../shared/components';
import { fonts, usePalette } from '../../../shared/theme';
import { useI18n } from '../../../i18n';
import { feedCopy } from '../feedCopy';
import { FeedAvatar } from './FeedAvatar';

/** The feed shows an invitation, while editing and its draft stay in one focused sheet. */
export function GroupPostComposer({
  backend,
  groupCode,
  draftStore,
  onSent,
  composerRef,
}: {
  backend: Backend;
  groupCode: string;
  draftStore: GroupDraftStore;
  onSent: () => void;
  composerRef?: React.RefObject<React.ComponentRef<typeof View> | null>;
}) {
  const { locale } = useI18n();
  const copy = feedCopy[locale];
  const p = usePalette();
  const [visible, setVisible] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const draft = useSyncExternalStore(
    draftStore.subscribe,
    draftStore.snapshot,
    draftStore.snapshot,
  ).post;
  useEffect(() => {
    let live = true;
    setProfile(null);
    void backend.auth
      .getUser()
      .then(async (account) => {
        if (!account || account.id !== draftStore.accountId || !live) return;
        setProfile(account);
        const value = await backend.profiles.load(account);
        if (live) setProfile(value);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [backend, draftStore]);
  const send = () => {
    void draftStore
      .send((text, actor) => backend.groups.createTextPost(groupCode, text, undefined, actor))
      .then((sent) => {
        if (!sent) return;
        if (!draftStore.snapshot().post.text.trim()) setVisible(false);
        onSent();
      });
  };
  return (
    <View
      ref={composerRef}
      collapsable={false}
      style={{ direction: locale === 'ar' ? 'rtl' : 'ltr' }}
    >
      <Pressable
        testID="feed-compose-invitation"
        accessibilityRole="button"
        accessibilityLabel={copy.writePost}
        onPress={() => setVisible(true)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 12,
          minHeight: 60,
          borderRadius: 12,
          backgroundColor: pressed ? p.subtle : p.surface,
        })}
      >
        <FeedAvatar name={profile?.displayName || copy.you} uri={profile?.avatarUrl} />
        <T
          translate={false}
          size={15}
          color={p.muted}
          numberOfLines={1}
          style={{ flex: 1, flexShrink: 1 }}
        >
          {draft.text.trim() ? draft.text : copy.writePost}
        </T>
      </Pressable>
      <Sheet
        visible={visible}
        title={copy.newPost}
        translateTitle={false}
        avoidKeyboard
        onClose={() => setVisible(false)}
        footer={
          <View style={{ gap: 6 }}>
            {draft.status === 'failed' ? (
              <T translate={false} size={12} color={p.danger} accessibilityLiveRegion="polite">
                {copy.failed}
              </T>
            ) : null}
            <Button
              title={draft.status === 'failed' ? copy.retry : copy.sendPost}
              icon="send"
              loading={draft.status === 'sending'}
              disabled={draft.status === 'sending' || !draft.text.trim()}
              onPress={send}
            />
          </View>
        }
      >
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingBottom: 12 }}>
          <FeedAvatar name={profile?.displayName || copy.you} uri={profile?.avatarUrl} />
          <T translate={false} bold size={14} style={{ flex: 1 }}>
            {profile?.displayName || copy.you}
          </T>
        </View>
        <TextInput
          testID="feed-post-input"
          accessibilityLabel={copy.postPlaceholder}
          placeholder={copy.postPlaceholder}
          value={draft.text}
          onChangeText={(text) => draftStore.set(text)}
          multiline
          maxLength={500}
          placeholderTextColor={p.muted}
          autoFocus
          style={{
            minHeight: 120,
            maxHeight: 230,
            padding: 0,
            paddingBottom: 12,
            color: p.ink,
            backgroundColor: p.background,
            fontSize: 16,
            fontFamily: locale === 'ar' ? fonts.arabicUi : fonts.regular,
            textAlignVertical: 'top',
            textAlign: locale === 'ar' ? 'right' : 'left',
            writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
          }}
        />
      </Sheet>
    </View>
  );
}
