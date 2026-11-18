import type { ExportableNote } from '../exporting/notesExport';
import type { QuranNoteTarget } from './quran';

/** List badges count only this scope; ayah notes do not inflate a surah's badge. */
export function countNotesForTarget(
  notes: readonly ExportableNote[],
  target: QuranNoteTarget,
): number {
  return notes.filter((note) => {
    if (note.scopeType !== target.scope) return false;
    const number =
      target.scope === 'juz'
        ? note.juzNumber
        : target.scope === 'hizb'
          ? note.hizbNumber
          : target.scope === 'rub'
            ? note.rubNumber
            : note.surahId;
    return number === target.number && (target.scope !== 'ayah' || note.ayahNumber === target.ayah);
  }).length;
}
