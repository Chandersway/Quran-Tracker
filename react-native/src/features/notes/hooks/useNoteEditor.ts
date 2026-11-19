import { useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useI18n } from '../../../i18n';
import type { NoteLabels } from '../../../i18n/notes';
import type { Action } from '../../../state/reducer';
import { validateNoteTarget, type QuranNoteTarget } from '../../../domain/quran';
import {
  notesExportFileName,
  noteTagList,
  stringifyNotesExport,
  type ExportableNote,
} from '../../../exporting/notesExport';
import { shareNotesFile } from '../../../services/storage/shareNotesFile';
import {
  blankFields,
  fieldsForNote,
  prepareNoteSave,
  targetTitle,
  type EditorFields,
} from '../editor/noteEditor';

type Options = {
  notes: ExportableNote[];
  commit: (action: Action) => Promise<void>;
  initialNoteId?: number;
  contextTarget: QuranNoteTarget | null;
  copy: NoteLabels;
  language: 'en' | 'nl' | 'ar';
  onSaved: (target: QuranNoteTarget) => void;
};

export function useNoteEditor({
  notes,
  commit,
  initialNoteId,
  contextTarget,
  copy,
  language,
  onSaved,
}: Options) {
  const { t } = useI18n();
  const [editorId, setEditorId] = useState<number | null>(initialNoteId ?? null);
  const selectedFromRoute = notes.find((note) => note.id === initialNoteId);
  const [fields, setFields] = useState<EditorFields>(() =>
    selectedFromRoute ? fieldsForNote(selectedFromRoute) : blankFields(contextTarget),
  );
  const [editorOriginal, setEditorOriginal] = useState(() =>
    JSON.stringify(
      selectedFromRoute ? fieldsForNote(selectedFromRoute) : blankFields(contextTarget),
    ),
  );
  const [preview, setPreview] = useState(Boolean(selectedFromRoute));
  const [showFormatting, setShowFormatting] = useState(false);
  const [showMetadata, setShowMetadata] = useState(!contextTarget && !selectedFromRoute);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const newDraftId = useRef<number | null>(null);
  const latestFields = useRef(fields);
  latestFields.current = fields;
  const isEditing = editorId !== null || message === 'new';
  const noteTarget = fields.target;
  const validTarget = useMemo(() => {
    if (!noteTarget) return false;
    try {
      validateNoteTarget(noteTarget);
      return true;
    } catch {
      return false;
    }
  }, [noteTarget]);

  function startNew(defaultTarget: QuranNoteTarget | null, folder = '') {
    if (inFlight.current) return;
    newDraftId.current = null;
    const empty = { ...blankFields(defaultTarget), folder };
    setEditorId(null);
    setFields(empty);
    setEditorOriginal(JSON.stringify(empty));
    setPreview(false);
    setShowMetadata(defaultTarget === null);
    setShowFormatting(false);
    setError(null);
    setMessage('new');
  }
  function startEdit(note: ExportableNote) {
    if (inFlight.current) return;
    newDraftId.current = null;
    const next = fieldsForNote(note);
    setEditorId(note.id);
    setFields(next);
    setEditorOriginal(JSON.stringify(next));
    setPreview(true);
    setShowMetadata(false);
    setShowFormatting(false);
    setError(null);
    setMessage(null);
  }
  function closeEditor() {
    if (inFlight.current) return;
    if (JSON.stringify(fields) !== editorOriginal) {
      Alert.alert(t('inline.AyahNotesScreen.516399f24c'), t('inline.AyahNotesScreen.11980f1e7b'), [
        { text: t('inline.AyahNotesScreen.e76fd2add0'), style: 'cancel' },
        { text: copy.discard, style: 'destructive', onPress: () => clearEditor() },
      ]);
      return;
    }
    clearEditor();
  }
  function clearEditor() {
    newDraftId.current = null;
    const empty = blankFields(contextTarget);
    setEditorId(null);
    setFields(empty);
    setEditorOriginal(JSON.stringify(empty));
    setPreview(false);
    setError(null);
    setMessage(null);
  }
  async function saveNote() {
    if (inFlight.current) return;
    const result = prepareNoteSave(fields, notes, editorId ?? newDraftId.current, Date.now());
    if (!result.ok) {
      setError(copy[result.reason]);
      return;
    }
    const note = result.note;
    // Retain the identity if optimistic state was updated but the disk write failed.
    // Retrying the draft then updates the same note instead of creating another.
    if (editorId === null) newDraftId.current = note.id;
    const savedFields = JSON.stringify(fields);
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await commit({ type: 'note/save', note });
      onSaved(result.target);
      if (JSON.stringify(latestFields.current) === savedFields) clearEditor();
      else {
        // A slow write must never discard text typed while saving.
        setEditorId(note.id);
        setEditorOriginal(savedFields);
      }
      setMessage(
        `${t('inline.AyahNotesScreen.1842dbf59d')}${targetTitle(result.target, language, copy)}`,
      );
    } catch {
      setError(copy.saveError);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function deleteNote(id: number) {
    Alert.alert(copy.deleteTitle, copy.deleteBody, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.delete,
        style: 'destructive',
        onPress: async () => {
          if (inFlight.current) return;
          inFlight.current = true;
          setBusy(true);
          setError(null);
          try {
            await commit({ type: 'note/delete', id });
            if (editorId === id) clearEditor();
            setMessage(null);
          } catch {
            setError(copy.saveError);
          } finally {
            inFlight.current = false;
            setBusy(false);
          }
        },
      },
    ]);
  }
  async function pinNote(note: ExportableNote) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await commit({ type: 'note/save', note: { ...note, isPinned: !note.isPinned } });
    } catch {
      setError(copy.saveError);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function exportNotes() {
    if (!notes.length || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await shareNotesFile(stringifyNotesExport(notes), notesExportFileName());
      setMessage(copy.exportReady);
    } catch {
      setError(copy.exportError);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const activeNote = editorId === null ? undefined : notes.find((note) => note.id === editorId);
  const tagSuggestions = [
    ...new Set([...notes.flatMap((note) => noteTagList(note.tags)), ...copy.tagSuggestions]),
  ];
  return {
    fields,
    setFields,
    editorId,
    activeNote,
    tagSuggestions,
    isEditing,
    preview,
    setPreview,
    showFormatting,
    setShowFormatting,
    showMetadata,
    setShowMetadata,
    message,
    error,
    busy,
    noteTarget,
    validTarget,
    editorOriginal,
    startNew,
    startEdit,
    closeEditor,
    saveNote,
    deleteNote,
    pinNote,
    exportNotes,
  };
}

export type NoteEditor = ReturnType<typeof useNoteEditor>;
