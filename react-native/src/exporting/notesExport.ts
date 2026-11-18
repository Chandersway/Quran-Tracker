/**
 * The Android app exports notes but does not import a notes file. This module
 * owns the portable export format so future clients keep the same wire schema.
 */
export interface ExportableNote {
  id: number;
  scopeType: string;
  juzNumber: number | null;
  hizbNumber: number | null;
  rubNumber: number | null;
  surahId: number | null;
  surahName: string;
  ayahNumber: number | null;
  title: string;
  note: string;
  folder: string;
  tags: string;
  fontSize: number;
  headingLevel: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  listMode: string;
  textColorKey: string;
  formatSpans: string;
  isPinned: boolean;
  updatedAt: number;
}

export interface NotesExportEntry {
  id: number;
  userId: null;
  scope_type: string;
  juz_number: number | null;
  hizb_number: number | null;
  rub_number: number | null;
  surahNumber: number | null;
  surahName: string;
  ayahNumber: number | null;
  title: string;
  text: string;
  folder: string;
  tags: string[];
  rawTags: string;
  fontSize: number;
  headingLevel: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  listMode: string;
  textColorKey: string;
  formatSpans: string;
  isPinned: boolean;
  createdAt: null;
  updatedAt: string;
  updatedAtMillis: number;
}

export interface NotesExport {
  schemaVersion: 2;
  exportedAt: string;
  app: 'Quran Tracker';
  type: 'notes_export';
  userScope: 'local_device';
  notes: NotesExportEntry[];
}

/** Tags use the same delimiters, whitespace trimming and case-insensitive deduplication as Android. */
export function noteTagList(rawTags: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of rawTags.split(/[,;#]/)) {
    const tag = part.trim();
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  }
  return tags;
}

function isoInstant(epochMillis: number): string {
  if (!Number.isFinite(epochMillis))
    throw new RangeError('Timestamp must be a finite epoch millisecond value');
  const date = new Date(epochMillis);
  if (Number.isNaN(date.getTime()))
    throw new RangeError('Timestamp is outside the supported range');
  // java.time.Instant.toString() omits a zero fraction; retain that wire detail.
  return date.toISOString().replace('.000Z', 'Z');
}

export function buildNotesExport(
  notes: readonly ExportableNote[],
  exportedAt = new Date(),
): NotesExport {
  if (!(exportedAt instanceof Date) || Number.isNaN(exportedAt.getTime()))
    throw new RangeError('Export timestamp must be a valid date');
  return {
    schemaVersion: 2,
    exportedAt: exportedAt.toISOString().replace('.000Z', 'Z'),
    app: 'Quran Tracker',
    type: 'notes_export',
    userScope: 'local_device',
    // Kotlin's all-notes DAO is pinned first, then newest first. Export the
    // complete collection in that order, independent of current screen filters.
    notes: [...notes]
      .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.updatedAt - a.updatedAt)
      .map(
        (note): NotesExportEntry => ({
          id: note.id,
          userId: null,
          scope_type: note.scopeType,
          juz_number: note.juzNumber,
          hizb_number: note.hizbNumber,
          rub_number: note.rubNumber,
          surahNumber: note.surahId,
          surahName: note.surahName,
          ayahNumber: note.ayahNumber,
          title: note.title,
          text: note.note,
          folder: note.folder,
          tags: noteTagList(note.tags),
          rawTags: note.tags,
          fontSize: note.fontSize,
          headingLevel: note.headingLevel,
          isBold: note.isBold,
          isItalic: note.isItalic,
          isUnderline: note.isUnderline,
          isStrike: note.isStrike,
          listMode: note.listMode,
          textColorKey: note.textColorKey,
          formatSpans: note.formatSpans,
          isPinned: note.isPinned,
          createdAt: null,
          updatedAt: isoInstant(note.updatedAt),
          updatedAtMillis: note.updatedAt,
        }),
      ),
  };
}

export function stringifyNotesExport(
  notes: readonly ExportableNote[],
  exportedAt = new Date(),
): string {
  return JSON.stringify(buildNotesExport(notes, exportedAt), null, 2);
}

/** Android names the file using the current UTC calendar date. */
export function notesExportFileName(now = new Date()): string {
  if (!(now instanceof Date) || Number.isNaN(now.getTime()))
    throw new RangeError('Date must be valid');
  return `quran_tracker_notes_export_${now.toISOString().slice(0, 10)}.json`;
}
