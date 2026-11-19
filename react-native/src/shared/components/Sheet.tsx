import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../i18n';
import { usePalette } from '../theme';
import { T } from './AppText';
import { IconButton } from './IconButton';
import { layoutDirection } from '../../domain/layoutDirection';

export function Sheet({
  visible,
  title,
  onClose,
  onDismiss,
  children,
  translateTitle = true,
  footer,
  avoidKeyboard = false,
  size = 'content',
}: React.PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  onDismiss?: () => void;
  translateTitle?: boolean;
  footer?: React.ReactNode;
  avoidKeyboard?: boolean;
  size?: 'content' | 'expanded';
}>) {
  const p = usePalette();
  const { t, locale } = useI18n();
  const { width, height } = useWindowDimensions();
  const shortLandscape = width > height && height < 500;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <KeyboardAvoidingView
        enabled={avoidKeyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          direction: layoutDirection(locale),
          justifyContent: 'flex-end',
          backgroundColor: '#00000066',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Close dialog')}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView
          edges={['bottom', 'left', 'right']}
          accessibilityViewIsModal
          onFocus={(event) => event.stopPropagation()}
          style={{
            backgroundColor: p.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: shortLandscape ? '96%' : '90%',
            height: size === 'expanded' ? (shortLandscape ? '96%' : '90%') : undefined,
            width: '100%',
            maxWidth: 700,
            alignSelf: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: shortLandscape ? 6 : 20,
            }}
          >
            <T translate={false} size={shortLandscape ? 20 : 23} bold style={{ flex: 1 }}>
              {translateTitle ? t(title) : title}
            </T>
            <IconButton name="x" label="Close" onPress={onClose} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ flexShrink: 1, flex: size === 'expanded' ? 1 : undefined }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: footer ? 12 : shortLandscape ? 16 : 32,
            }}
          >
            {children}
          </ScrollView>
          {footer && <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>{footer}</View>}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
