import React from 'react';
import { Pressable, View } from 'react-native';
import type { QuranNoteTarget } from '../../../domain/quran';
import { countNotesForTarget } from '../../../domain/noteCounts';
import { useAppNavigation } from '../../../app/navigation/types';
import { useAppStore } from '../../../state/store';
import { useI18n } from '../../../i18n';
import { Icon, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';

export function NoteCountButton({ target }: { target: QuranNoteTarget }) {
  const { state } = useAppStore();
  const nav = useAppNavigation();
  const { t, format } = useI18n();
  const p = usePalette();
  const count = countNotesForTarget(state.notes, target);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('navigation.notes')}: ${format('notes.noteCount', count)}`}
      onPress={() => nav.navigate('Notes', { target })}
      style={{ minWidth: 44, minHeight: 48, justifyContent: 'center', paddingHorizontal: 6 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Icon name="edit-3" size={18} color={p.primary} />
        {count > 0 && (
          <T size={12} color={p.primary}>
            {count}
          </T>
        )}
      </View>
    </Pressable>
  );
}
