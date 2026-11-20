import React from 'react';
import { Pressable, View } from 'react-native';
import { Button, Segments, Sheet, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useI18n } from '../../../i18n';
import type { NoteLabels } from '../../../i18n/notes';
import type { NoteFilterState } from '../hooks/useNoteFilters';
import { FilterPill } from './FilterPill';

export function NoteFilterSheet({
  visible,
  onClose,
  filters,
  copy,
  language,
}: {
  visible: boolean;
  onClose: () => void;
  filters: NoteFilterState;
  copy: NoteLabels;
  language: 'en' | 'nl' | 'ar';
}) {
  const p = usePalette();
  const { t } = useI18n();
  const {
    selectedScope,
    setSelectedScope,
    pinnedOnly,
    setPinnedOnly,
    selectedFolder,
    setSelectedFolder,
    selectedTag,
    setSelectedTag,
    titleSort,
    setTitleSort,
    folders,
    tags,
  } = filters;
  return (
    <Sheet visible={visible} title={copy.filters} onClose={onClose}>
      <T size={14} bold>
        {copy.scope}
      </T>
      <Segments
        value={selectedScope}
        options={[
          { value: 'all', label: copy.all },
          ...(['juz', 'hizb', 'rub', 'surah', 'ayah'] as const).map((scope) => ({
            value: scope,
            label: copy.scopeLabel[scope],
          })),
        ]}
        onChange={setSelectedScope}
      />
      <FilterPill
        label={copy.pinned}
        selected={pinnedOnly}
        onPress={() => setPinnedOnly((value) => !value)}
      />
      <T size={14} bold style={{ marginTop: 12 }}>
        {copy.folder}
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <FilterPill
          label={copy.anyFolder}
          selected={selectedFolder === null}
          onPress={() => setSelectedFolder(null)}
        />
        {folders.map((folder) => (
          <FilterPill
            key={folder}
            label={folder}
            selected={selectedFolder === folder}
            onPress={() => setSelectedFolder((current) => (current === folder ? null : folder))}
          />
        ))}
      </View>
      <T size={14} bold style={{ marginTop: 16 }}>
        {copy.tags}
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <FilterPill
          label={copy.anyTag}
          selected={selectedTag === null}
          onPress={() => setSelectedTag(null)}
        />
        {tags.map((tag) => (
          <FilterPill
            key={tag}
            label={`#${tag}`}
            selected={selectedTag === tag}
            onPress={() => setSelectedTag((current) => (current === tag ? null : tag))}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(
          titleSort ? 'inline.AyahNotesScreen.0b629e13d5' : 'inline.AyahNotesScreen.ab217de6af',
        )}
        onPress={() => setTitleSort((value) => !value)}
        style={{ minHeight: 48, justifyContent: 'center', marginTop: 12 }}
      >
        <T size={14} color={p.primary} bold>
          {t(titleSort ? 'inline.AyahNotesScreen.ab217de6af' : 'inline.AyahNotesScreen.0b629e13d5')}
        </T>
      </Pressable>
      <Button
        title={language === 'nl' ? 'Gereed' : language === 'ar' ? 'تم' : 'Done'}
        onPress={onClose}
        style={{ marginTop: 12 }}
      />
    </Sheet>
  );
}
