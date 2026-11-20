import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon, IconButton, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { noteTagList, type ExportableNote } from '../../../exporting/notesExport';
import type { NoteLabels } from '../../../i18n/notes';
import { targetForNote, targetTitle } from '../editor/noteEditor';
import { noteDisplayTitle, noteExcerpt } from '../editor/noteFormat';

export function NoteRow({
  note,
  language,
  labels,
  onOpen,
  onPin,
  onDelete,
  dragHandle,
}: {
  note: ExportableNote;
  language: 'en' | 'nl' | 'ar';
  labels: NoteLabels;
  onOpen: () => void;
  onPin: () => void;
  onDelete: () => void;
  dragHandle?: React.ReactNode;
}) {
  const p = usePalette();
  const target = targetForNote(note);
  const title = noteDisplayTitle(
    note,
    target ? targetTitle(target, language, labels) : labels.title,
  );
  const body = noteExcerpt(note);
  const tags = noteTagList(note.tags);
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        borderBottomWidth: 1,
        borderBottomColor: p.line,
        paddingVertical: 12,
        alignItems: 'center',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${body}`}
        onPress={onOpen}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 68,
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
          gap: 4,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {note.isPinned && <Icon name="bookmark" size={13} color={p.primary} />}
          <T translate={false} size={16} bold numberOfLines={1}>
            {title}
          </T>
        </View>
        {!!body && (
          <T translate={false} size={13} muted numberOfLines={2}>
            {body}
          </T>
        )}
        <T translate={false} size={11} muted numberOfLines={1}>
          {[
            target ? targetTitle(target, language, labels) : '',
            note.folder,
            new Date(note.updatedAt).toLocaleDateString(language),
            tags.map((tag) => `#${tag}`).join(' '),
          ]
            .filter(Boolean)
            .join(' · ')}
        </T>
      </Pressable>
      <IconButton
        name="bookmark"
        label={note.isPinned ? 'notes.unpin' : 'notes.pin'}
        selected={note.isPinned}
        onPress={onPin}
      />
      <IconButton name="trash-2" label={labels.delete} onPress={onDelete} />
      {dragHandle}
    </View>
  );
}
