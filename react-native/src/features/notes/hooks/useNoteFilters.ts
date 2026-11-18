import { useMemo, useState } from 'react';
import { noteTagList, type ExportableNote } from '../../../exporting/notesExport';
import {
  canCreateInContext,
  filterNotes,
  type ScopeFilter,
  type NoteFilters,
} from '../editor/noteFilters';

export function useNoteFilters(
  notes: readonly ExportableNote[],
  context: Pick<NoteFilters, 'contextTarget' | 'language' | 'copy'>,
) {
  const { contextTarget, language, copy } = context;
  const [selectedScope, setSelectedScope] = useState<ScopeFilter>('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [includeChildren, setIncludeChildren] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [titleSort, setTitleSort] = useState(false);
  const folders = useMemo(
    () =>
      [...new Set(notes.map((note) => note.folder.trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [notes],
  );
  const tags = useMemo(
    () =>
      [...new Set(notes.flatMap((note) => noteTagList(note.tags)))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [notes],
  );
  const filtered = useMemo(
    () =>
      filterNotes(notes, {
        contextTarget,
        language,
        copy,
        includeChildren,
        selectedScope,
        pinnedOnly,
        selectedFolder,
        selectedTag,
        query,
        titleSort,
      }),
    [
      notes,
      contextTarget,
      language,
      copy,
      includeChildren,
      selectedScope,
      pinnedOnly,
      selectedFolder,
      selectedTag,
      query,
      titleSort,
    ],
  );
  function reset() {
    setQuery('');
    setSelectedScope('all');
    setSelectedFolder(null);
    setSelectedTag(null);
    setPinnedOnly(false);
  }
  const activeFilters =
    Number(selectedScope !== 'all') +
    Number(pinnedOnly) +
    Number(selectedFolder !== null) +
    Number(selectedTag !== null) +
    Number(titleSort);
  return {
    selectedScope,
    setSelectedScope,
    pinnedOnly,
    setPinnedOnly,
    includeChildren,
    setIncludeChildren,
    selectedFolder,
    setSelectedFolder,
    selectedTag,
    setSelectedTag,
    query,
    setQuery,
    titleSort,
    setTitleSort,
    folders,
    tags,
    filtered,
    reset,
    activeFilters,
    canCreate: canCreateInContext(notes, contextTarget, includeChildren),
  };
}

export type NoteFilterState = ReturnType<typeof useNoteFilters>;
