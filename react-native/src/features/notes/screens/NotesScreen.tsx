import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { usePreventRemove } from '@react-navigation/native';
import { Pressable, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStack } from '../../../app/navigation/types';
import { useAppStore } from '../../../state/store';
import { useI18n } from '../../../i18n';
import { useNotesCopy } from '../../../i18n/notes';
import {
  Button,
  Card,
  Empty,
  Field,
  Icon,
  IconButton,
  Notice,
  Screen,
  T,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { noteTargetIncludes, type NoteScope } from '../../../domain/quran';
import type { ExportableNote } from '../../../exporting/notesExport';
import { sameTarget } from '../editor/noteEditor';
import { useNoteFilters } from '../hooks/useNoteFilters';
import { useNoteEditor } from '../hooks/useNoteEditor';
import { targetTitle } from '../editor/noteEditor';
import { NoteRow } from '../components/NoteRow';
import { NoteEditorView } from '../components/NoteEditorView';
import { NoteFilterSheet } from '../components/NoteFilterSheet';
import { NoteTargetSummary } from '../components/NoteTargetSummary';

type Props = NativeStackScreenProps<RootStack, 'Notes'>;

export function NotesScreen({ route, navigation }: Props) {
  const p = usePalette();
  const { t } = useI18n();
  const { state, commit } = useAppStore();
  const language = state.preferences.language;
  const copy = useNotesCopy(language);
  const routeTarget = useMemo(() => {
    const params = route.params;
    if (params?.target) return params.target;
    if (!params?.surah) return null;
    return params.ayah
      ? { scope: 'ayah' as const, number: params.surah, ayah: params.ayah }
      : { scope: 'surah' as const, number: params.surah };
  }, [route.params?.surah, route.params?.ayah, route.params?.target]);
  const [contextTarget, setContextTarget] = useState(routeTarget);
  useEffect(() => {
    setContextTarget(routeTarget);
  }, [routeTarget]);
  const filters = useNoteFilters(state.notes, { contextTarget, language, copy });
  const {
    selectedScope,
    includeChildren,
    setIncludeChildren,
    selectedFolder,
    query,
    setQuery,
    filtered,
    activeFilters,
    canCreate,
  } = filters;
  const [showFilters, setShowFilters] = useState(false);
  const editor = useNoteEditor({
    notes: state.notes,
    commit,
    initialNoteId: route.params?.noteId,
    contextTarget,
    copy,
    language,
    onSaved(target) {
      if (contextTarget && !sameTarget(contextTarget, target)) {
        if (noteTargetIncludes(contextTarget, target)) setIncludeChildren(true);
        else {
          setContextTarget(target);
          setIncludeChildren(false);
        }
      }
      filters.reset();
    },
  });
  const {
    isEditing,
    closeEditor,
    startEdit,
    pinNote,
    deleteNote,
    exportNotes,
    message,
    error,
    busy,
  } = editor;
  usePreventRemove(isEditing, closeEditor);
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !isEditing });
  }, [navigation, isEditing]);
  function startNew() {
    const target =
      contextTarget ??
      (selectedScope === 'all'
        ? null
        : {
            scope: selectedScope,
            number: 1,
            ...(selectedScope === 'ayah' ? { ayah: 1 } : {}),
          });
    editor.startNew(target, selectedFolder ?? '');
  }
  const groupedNotes = filtered.reduce<Record<string, ExportableNote[]>>((groups, note) => {
    const label = contextTarget
      ? copy.scopeLabel[note.scopeType as NoteScope]
      : note.isPinned
        ? copy.pinned
        : t('inline.AyahNotesScreen.8a7525b149');
    (groups[label] ??= []).push(note);
    return groups;
  }, {});
  if (isEditing) return <NoteEditorView editor={editor} copy={copy} language={language} />;

  return (
    <Screen style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <T size={32} bold>
          {copy.title}
        </T>
        <T size={13} muted>
          {copy.saved} · {filtered.length}
        </T>
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}
      >
        <IconButton
          name="download"
          label={copy.export}
          disabled={busy || !state.notes.length}
          onPress={exportNotes}
        />
        <Button title={copy.add} icon="plus" onPress={startNew} />
      </View>
      {message && <Notice message={message} />}
      {error && <Notice message={error} error />}
      {contextTarget && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            paddingVertical: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <T size={16} bold>
              {targetTitle(contextTarget, language, copy)}
            </T>
            <NoteTargetSummary target={contextTarget} />
          </View>
          {['surah', 'hizb', 'juz'].includes(contextTarget.scope) && (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: includeChildren }}
              onPress={() => setIncludeChildren((value) => !value)}
              style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 }}
            >
              <Icon
                name={includeChildren ? 'check-square' : 'square'}
                size={17}
                color={p.primary}
              />
              <T size={12}>{copy.includeChildren}</T>
            </Pressable>
          )}
        </View>
      )}
      {state.notes.length > 0 && (
        <>
          <Field
            label={copy.search}
            value={query}
            onChangeText={setQuery}
            placeholder={copy.search}
            autoCapitalize="none"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${copy.filters}${activeFilters ? `, ${activeFilters} active` : ''}`}
            onPress={() => setShowFilters(true)}
            style={{
              minHeight: 48,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
              paddingHorizontal: 14,
              borderRadius: 24,
              backgroundColor: p.subtle,
            }}
          >
            <Icon name="sliders" size={17} color={p.primary} />
            <T size={14} bold color={p.primary}>
              {copy.filters}
              {activeFilters ? ` · ${activeFilters}` : ''}
            </T>
          </Pressable>
        </>
      )}
      {filtered.length === 0 ? (
        canCreate ? (
          <Card style={{ alignItems: 'center', gap: 10, padding: 20, marginTop: 4 }}>
            <View style={{ padding: 13, backgroundColor: p.subtle, borderRadius: 30 }}>
              <Icon name="edit-3" size={25} color={p.primary} />
            </View>
            <T size={21} bold>
              {copy.empty}
            </T>
            <T muted style={{ textAlign: 'center' }}>
              {copy.emptyBody}
            </T>
            <Button
              title={copy.add}
              icon="plus"
              onPress={startNew}
              style={{ alignSelf: 'stretch', marginTop: 3 }}
            />
          </Card>
        ) : (
          <Empty
            icon="search"
            title={copy.noMatch}
            message={copy.noMatch}
            action={copy.all}
            onAction={() => {
              filters.reset();
            }}
          />
        )
      ) : (
        <View>
          {Object.entries(groupedNotes).map(([label, notes]) => (
            <View key={label}>
              <T translate={false} muted size={12} style={{ marginVertical: 12 }}>
                {label} ({notes.length})
              </T>
              {notes.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  language={language}
                  labels={copy}
                  onOpen={() => startEdit(note)}
                  onPin={() => pinNote(note)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
            </View>
          ))}
        </View>
      )}
      <NoteFilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        copy={copy}
        language={language}
      />
    </Screen>
  );
}
