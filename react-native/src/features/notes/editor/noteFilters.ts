import type { ExportableNote } from '../../../exporting/notesExport';
import { noteTagList } from '../../../exporting/notesExport';
import { noteTargetIncludes, type NoteScope, type QuranNoteTarget } from '../../../domain/quran';
import type { NoteLabels } from '../../../i18n/notes';
import { sameTarget, targetForNote, targetTitle } from './noteEditor';
import { noteDisplayTitle } from './noteFormat';
import { chapters } from '../../../content/quran';

export type ScopeFilter = NoteScope | 'all';
export type NoteFilters = {
  contextTarget: QuranNoteTarget | null;
  includeChildren: boolean;
  selectedScope: ScopeFilter;
  pinnedOnly: boolean;
  selectedFolder: string | null;
  selectedTag: string | null;
  query: string;
  titleSort: boolean;
  language: 'en' | 'nl' | 'ar';
  copy: NoteLabels;
};

export function filterNotes(
  notes: readonly ExportableNote[],
  filters: NoteFilters,
): ExportableNote[] {
  const {
    contextTarget,
    includeChildren,
    selectedScope,
    pinnedOnly,
    selectedFolder,
    selectedTag,
    query,
    titleSort,
    language,
    copy,
  } = filters;
  const normalized = query.trim().toLowerCase();
  return notes
    .filter((note) => {
      const target = targetForNote(note);
      const targetOk =
        !contextTarget ||
        sameTarget(target, contextTarget) ||
        (includeChildren && target !== null && noteTargetIncludes(contextTarget, target));
      const targetLabel = target ? targetTitle(target, language, copy) : '';
      return (
        targetOk &&
        (selectedScope === 'all' || note.scopeType === selectedScope) &&
        (!pinnedOnly || note.isPinned) &&
        (selectedFolder === null || note.folder === selectedFolder) &&
        (selectedTag === null ||
          noteTagList(note.tags).some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())) &&
        (!normalized ||
          [
            note.title,
            note.note,
            note.tags,
            note.folder,
            note.surahName,
            chapters.find((chapter) => chapter.id === note.surahId)?.name ?? '',
            targetLabel,
          ].some((part) => part.toLowerCase().includes(normalized)))
      );
    })
    .sort(
      (a, b) =>
        Number(b.isPinned) - Number(a.isPinned) ||
        (titleSort
          ? noteDisplayTitle(
              a,
              targetForNote(a) ? targetTitle(targetForNote(a)!, language, copy) : copy.title,
            ).localeCompare(
              noteDisplayTitle(
                b,
                targetForNote(b) ? targetTitle(targetForNote(b)!, language, copy) : copy.title,
              ),
              language,
              { sensitivity: 'base' },
            )
          : b.updatedAt - a.updatedAt),
    );
}

export function canCreateInContext(
  notes: readonly ExportableNote[],
  contextTarget: QuranNoteTarget | null,
  includeChildren: boolean,
): boolean {
  return (
    notes.length === 0 ||
    (contextTarget !== null &&
      !notes.some((note) => {
        const target = targetForNote(note);
        return (
          target &&
          (sameTarget(target, contextTarget) ||
            (includeChildren && noteTargetIncludes(contextTarget, target)))
        );
      }))
  );
}
