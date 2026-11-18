import { chapters } from '../../../content/quran';
import { noteTagList, type ExportableNote } from '../../../exporting/notesExport';
import {
  targetQuarter,
  targetHizbNumber,
  validateNoteTarget,
  type QuranNoteTarget,
  type NoteScope,
} from '../../../domain/quran';
import type { NoteLabels } from '../../../i18n/notes';
import {
  decodeNoteFormatSpans,
  encodeNoteFormatSpans,
  updateNoteFormatSpansForTextChange,
} from './noteFormat';

export type EditorFields = {
  target: QuranNoteTarget | null;
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
};

export const blankFields = (target: QuranNoteTarget | null = null): EditorFields => ({
  target,
  title: '',
  note: '',
  folder: '',
  tags: '',
  fontSize: 16,
  headingLevel: 0,
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrike: false,
  listMode: 'none',
  textColorKey: 'gold',
  formatSpans: '',
  isPinned: false,
});

export function targetForNote(note: ExportableNote): QuranNoteTarget | null {
  const scope = note.scopeType as NoteScope;
  if (!['juz', 'hizb', 'rub', 'surah', 'ayah'].includes(scope)) return null;
  const number =
    scope === 'juz'
      ? note.juzNumber
      : scope === 'hizb'
        ? note.hizbNumber
        : scope === 'rub'
          ? note.rubNumber
          : note.surahId;
  if (number == null) return null;
  return {
    scope,
    number,
    ...(scope === 'ayah' && note.ayahNumber != null ? { ayah: note.ayahNumber } : {}),
  };
}

export function fieldsForNote(note: ExportableNote): EditorFields {
  return {
    target: targetForNote(note),
    title: note.title,
    note: note.note,
    folder: note.folder,
    tags: note.tags,
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
  };
}

export function targetTitle(
  target: QuranNoteTarget,
  language: 'en' | 'nl' | 'ar',
  labels: NoteLabels,
): string {
  const label = labels.scopeLabel[target.scope];
  if (target.scope === 'surah')
    return language === 'ar'
      ? (chapters[target.number - 1]?.nameAr ?? `سورة ${target.number}`)
      : (chapters[target.number - 1]?.name ?? `Surah ${target.number}`);
  if (target.scope === 'ayah')
    return `${language === 'ar' ? chapters[target.number - 1]?.nameAr : (chapters[target.number - 1]?.name ?? `Surah ${target.number}`)} ${target.number}:${target.ayah ?? ''}`;
  if (target.scope === 'rub')
    return `${label} ${targetQuarter(target)} · ${labels.scopeLabel.hizb} ${targetHizbNumber(target)}`;
  return `${label} ${target.number}`;
}

export function toggleTag(rawTags: string, tag: string): string {
  const tags = noteTagList(rawTags);
  const existing = tags.findIndex((value) => value.toLowerCase() === tag.toLowerCase());
  if (existing >= 0) tags.splice(existing, 1);
  else tags.push(tag);
  return tags.join(', ');
}

function noteTargetFields(target: QuranNoteTarget) {
  return {
    scopeType: target.scope,
    juzNumber: target.scope === 'juz' ? target.number : null,
    hizbNumber: target.scope === 'hizb' ? target.number : null,
    rubNumber: target.scope === 'rub' ? target.number : null,
    surahId: target.scope === 'surah' || target.scope === 'ayah' ? target.number : null,
    ayahNumber: target.scope === 'ayah' ? (target.ayah ?? null) : null,
  };
}

export function sameTarget(a: QuranNoteTarget | null, b: QuranNoteTarget | null): boolean {
  return a?.scope === b?.scope && a?.number === b?.number && a?.ayah === b?.ayah;
}

function saveFormatInfo(fields: EditorFields) {
  return {
    fontSize: fields.fontSize,
    headingLevel: fields.headingLevel,
    isBold: fields.isBold,
    isItalic: fields.isItalic,
    isUnderline: fields.isUnderline,
    isStrike: fields.isStrike,
    listMode: fields.listMode,
    textColorKey: fields.textColorKey,
    formatSpans: fields.formatSpans,
  };
}

export function updateEditorText(current: EditorFields, note: string): EditorFields {
  const active = {
    ...saveFormatInfo(current),
    hasFormatting:
      current.fontSize !== 16 ||
      current.headingLevel > 0 ||
      current.isBold ||
      current.isItalic ||
      current.isUnderline ||
      current.isStrike ||
      current.textColorKey !== 'gold',
  };
  return {
    ...current,
    note,
    formatSpans: encodeNoteFormatSpans(
      updateNoteFormatSpansForTextChange(
        current.note,
        note,
        decodeNoteFormatSpans(current.formatSpans),
        active,
      ),
    ),
  };
}

export type NoteSaveResult =
  | { ok: true; note: ExportableNote; target: QuranNoteTarget }
  | { ok: false; reason: 'chooseScope' | 'targetInvalid' | 'contentRequired' };

/** Build the existing local/export representation without changing note text or formatting. */
export function prepareNoteSave(
  fields: EditorFields,
  notes: readonly ExportableNote[],
  editorId: number | null,
  now: number,
): NoteSaveResult {
  if (!fields.target) return { ok: false, reason: 'chooseScope' };
  try {
    validateNoteTarget(fields.target);
  } catch {
    return { ok: false, reason: 'targetInvalid' };
  }
  if (!fields.title.trim() && !fields.note.trim()) return { ok: false, reason: 'contentRequired' };
  const targetFields = noteTargetFields(fields.target);
  return {
    ok: true,
    target: fields.target,
    note: {
      id: editorId ?? Math.max(0, ...notes.map((note) => note.id).filter(Number.isFinite)) + 1,
      ...targetFields,
      surahName: targetFields.surahId ? (chapters[targetFields.surahId - 1]?.name ?? '') : '',
      title: fields.title.trim(),
      note: fields.note,
      folder: fields.folder.trim(),
      tags: fields.tags.trim(),
      ...saveFormatInfo(fields),
      isPinned: fields.isPinned,
      updatedAt: now,
    },
  };
}
