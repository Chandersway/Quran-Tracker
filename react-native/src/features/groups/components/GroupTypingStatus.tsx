import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { T } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import type { GroupTypingParticipant } from '../../../services/groups/groupTyping';
import { groupTypingText } from '../groupTypingCopy';

export function GroupTypingStatus({
  participants,
}: {
  participants: readonly GroupTypingParticipant[];
}) {
  const { locale } = useI18n();
  const { fontScale } = useWindowDimensions();
  const lineHeight = locale === 'ar' ? 22 : 18;
  const height = Math.max(26, Math.ceil(lineHeight * fontScale) + 8);
  const text = groupTypingText(participants, locale);
  return (
    <View testID="group-typing-status" style={{ height, justifyContent: 'center' }}>
      {!!text && (
        <T
          translate={false}
          muted
          size={12}
          numberOfLines={1}
          ellipsizeMode="middle"
          style={{ lineHeight }}
          accessibilityLiveRegion="polite"
          accessibilityLabel={text}
        >
          {text}
        </T>
      )}
    </View>
  );
}
