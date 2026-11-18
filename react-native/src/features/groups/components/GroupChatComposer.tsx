import React from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { useI18n } from '../../../i18n';
import { Icon, T } from '../../../shared/components';
import { fonts, usePalette } from '../../../shared/theme';
import type { GroupDraft } from '../../../services/groups/groupDrafts';
import { GROUP_CHAT_MAX_LENGTH } from '../../../services/groups/groupChat';
import { communityText } from '../communityCopy';
import { chatText } from '../chatCopy';

export function GroupChatComposer({
  draft,
  setDraft,
  send,
  error,
  allowed,
  onFocus,
  onBlur,
}: {
  draft: GroupDraft;
  setDraft(text: string): void;
  send(): void;
  error: string;
  allowed: boolean;
  onFocus?(): void;
  onBlur?(): void;
}) {
  const { locale, t } = useI18n();
  const p = usePalette();
  const sending = draft.status === 'sending';
  const disabled = sending || !draft.text.trim();
  if (!allowed)
    return (
      <T muted style={{ padding: 16 }}>
        {chatText('readOnly', locale)}
      </T>
    );
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        gap: 8,
        borderTopWidth: 1,
        borderColor: p.line,
        backgroundColor: p.background,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        <TextInput
          testID="group-chat-input"
          accessibilityLabel={chatText('placeholder', locale)}
          placeholder={chatText('placeholder', locale)}
          placeholderTextColor={p.muted}
          value={draft.text}
          onChangeText={setDraft}
          onFocus={onFocus}
          onBlur={onBlur}
          multiline
          maxLength={GROUP_CHAT_MAX_LENGTH}
          style={{
            flex: 1,
            minHeight: 50,
            maxHeight: 128,
            borderWidth: 1,
            borderColor: draft.status === 'failed' ? p.danger : p.line,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: p.surface,
            color: p.ink,
            fontFamily: locale === 'ar' ? fonts.arabicUi : fonts.regular,
            fontSize: 16,
            textAlign: locale === 'ar' ? 'right' : 'left',
            textAlignVertical: 'top',
          }}
        />
        <Pressable
          testID="group-chat-send"
          accessibilityRole="button"
          accessibilityLabel={
            draft.status === 'failed' ? t('common.retry') : chatText('send', locale)
          }
          accessibilityState={{ disabled, busy: sending }}
          disabled={disabled}
          onPress={send}
          style={({ pressed }) => ({
            minWidth: 50,
            minHeight: 50,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: p.primary,
            opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
          })}
        >
          {sending ? (
            <ActivityIndicator color={p.onPrimary} />
          ) : (
            <Icon
              name={draft.status === 'failed' ? 'rotate-cw' : 'send'}
              color={p.onPrimary}
              size={21}
            />
          )}
        </Pressable>
      </View>
      {draft.status !== 'idle' ? (
        <T
          size={12}
          color={draft.status === 'failed' ? p.danger : p.muted}
          accessibilityLiveRegion="polite"
        >
          {draft.status === 'failed'
            ? chatText('failed', locale) + (error ? '\n' + error : '')
            : communityText(draft.status, locale)}
        </T>
      ) : null}
      {draft.text.length >= 450 ? (
        <T muted size={12}>
          {draft.text.length} / {GROUP_CHAT_MAX_LENGTH}
        </T>
      ) : null}
    </View>
  );
}
