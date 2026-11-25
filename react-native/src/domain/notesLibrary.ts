import type { ExportableNote } from '../exporting/notesExport';
import { validateNoteTarget, type NoteScope } from './quran';

export function normalizeNoteFolder(name: string): string {
  return name.trim().slice(0, 100);
}

/** Prefer ascending local IDs, then use a free lower ID at the safe-integer boundary. */
export function nextFreeNoteId(used: ReadonlySet<number>, start?: number): number {
  let candidate = start ?? 1;
  if (start === undefined) {
    for (const id of used) candidate = Math.max(candidate, id + 1);
  }
  if (!Number.isSafeInteger(candidate)) candidate = 1;
  while (used.has(candidate)) {
    candidate = candidate === Number.MAX_SAFE_INTEGER ? 1 : candidate + 1;
  }
  return candidate;
}

/** Append imports atomically. Existing IDs/content are never overwritten. */
export function mergeImportedNotes(
  existing: readonly ExportableNote[],
  incoming: readonly ExportableNote[],
) {
  const fingerprint = (note: ExportableNote) =>
    JSON.stringify(
      Object.fromEntries(
        Object.entries(note)
          .filter(([key]) => key !== 'id')
          .sort(([a], [b]) => a.localeCompare(b)),
      ),
    );
  const contents = new Set(existing.map(fingerprint));
  const ids = new Set(existing.map((note) => note.id));
  let nextId = nextFreeNoteId(ids);
  const added: ExportableNote[] = [];
  let skipped = 0;
  for (const note of incoming) {
    const key = fingerprint(note);
    if (contents.has(key)) {
      skipped++;
      continue;
    }
    let id = note.id;
    if (ids.has(id)) {
      id = nextFreeNoteId(ids, nextId);
      nextId = id + 1;
    }
    added.push({ ...note, id });
    ids.add(id);
    contents.add(key);
  }
  return { notes: [...existing, ...added], added: added.length, skipped };
}

export type DropBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type FolderDropRect = DropBounds & { folder: string };
export function folderAtPoint(
  rects: Iterable<FolderDropRect>,
  x: number,
  y: number,
  viewport: DropBounds,
) {
  const contains = (rect: DropBounds) =>
    rect.width > 0 &&
    rect.height > 0 &&
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height;
  if (contains(viewport)) {
    for (const rect of rects) if (contains(rect)) return rect.folder;
  }
  return undefined;
}

/** Read the unchanged Kotlin/RN schema-v2 notes export. A bad record rejects the whole file. */
export function parseNotesImport(raw: string): ExportableNote[] {
  if (raw.length > 10 * 1024 * 1024) throw new Error('notes-import-too-large');
  const data: unknown = JSON.parse(raw);
  const record = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
  if (
    !record(data) ||
    data.schemaVersion !== 2 ||
    data.type !== 'notes_export' ||
    data.app !== 'Quran Tracker' ||
    data.userScope !== 'local_device' ||
    typeof data.exportedAt !== 'string' ||
    !Number.isFinite(Date.parse(data.exportedAt.replace(/(\.\d{3})\d+Z$/, '$1Z'))) ||
    !Array.isArray(data.notes) ||
    data.notes.length > 10000
  )
    throw new Error('notes-import-invalid');
  const str = (row: Record<string, unknown>, key: string) => {
    if (typeof row[key] !== 'string') throw new Error('notes-import-invalid');
    return row[key];
  };
  const num = (row: Record<string, unknown>, key: string) => {
    if (typeof row[key] !== 'number' || !Number.isSafeInteger(row[key]))
      throw new Error('notes-import-invalid');
    return row[key];
  };
  const nullable = (row: Record<string, unknown>, key: string) =>
    row[key] === null ? null : num(row, key);
  const bool = (row: Record<string, unknown>, key: string) => {
    if (typeof row[key] !== 'boolean') throw new Error('notes-import-invalid');
    return row[key];
  };
  return data.notes.map((value) => {
    if (
      !record(value) ||
      value.userId !== null ||
      value.createdAt !== null ||
      !Array.isArray(value.tags) ||
      !value.tags.every((tag) => typeof tag === 'string')
    )
      throw new Error('notes-import-invalid');
    const id = num(value, 'id');
    if (id < 0) throw new Error('notes-import-invalid');
    const note: ExportableNote = {
      id,
      scopeType: str(value, 'scope_type'),
      juzNumber: nullable(value, 'juz_number'),
      hizbNumber: nullable(value, 'hizb_number'),
      rubNumber: nullable(value, 'rub_number'),
      surahId: nullable(value, 'surahNumber'),
      surahName: str(value, 'surahName'),
      ayahNumber: nullable(value, 'ayahNumber'),
      title: str(value, 'title'),
      note: str(value, 'text'),
      folder: str(value, 'folder'),
      tags: str(value, 'rawTags'),
      fontSize: num(value, 'fontSize'),
      headingLevel: num(value, 'headingLevel'),
      isBold: bool(value, 'isBold'),
      isItalic: bool(value, 'isItalic'),
      isUnderline: bool(value, 'isUnderline'),
      isStrike: bool(value, 'isStrike'),
      listMode: str(value, 'listMode'),
      textColorKey: str(value, 'textColorKey'),
      formatSpans: str(value, 'formatSpans'),
      isPinned: bool(value, 'isPinned'),
      updatedAt: num(value, 'updatedAtMillis'),
    };
    if (!['juz', 'hizb', 'rub', 'surah', 'ayah'].includes(note.scopeType))
      throw new Error('notes-import-invalid');
    const scope = note.scopeType as NoteScope;
    if (
      Date.parse(str(value, 'updatedAt')) !== note.updatedAt ||
      note.fontSize < 1 ||
      (scope !== 'juz' && note.juzNumber !== null) ||
      (scope !== 'hizb' && note.hizbNumber !== null) ||
      (scope !== 'rub' && note.rubNumber !== null) ||
      (scope !== 'surah' && scope !== 'ayah' && note.surahId !== null) ||
      (scope !== 'ayah' && note.ayahNumber !== null)
    )
      throw new Error('notes-import-invalid');
    const number =
      scope === 'juz'
        ? note.juzNumber
        : scope === 'hizb'
          ? note.hizbNumber
          : scope === 'rub'
            ? note.rubNumber
            : note.surahId;
    if (number === null) throw new Error('notes-import-invalid');
    validateNoteTarget({
      scope,
      number,
      ...(scope === 'ayah' ? { ayah: note.ayahNumber ?? undefined } : {}),
    });
    return note;
  });
}
