import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNotesExport,
  notesExportFileName,
  noteTagList,
  stringifyNotesExport,
  type ExportableNote,
} from '../src/exporting/notesExport';

const note: ExportableNote = {
  id: 14,
  scopeType: 'ayah',
  juzNumber: null,
  hizbNumber: null,
  rubNumber: null,
  surahId: 2,
  surahName: 'Al-Baqarah',
  ayahNumber: 255,
  title: 'Meaning',
  note: 'Text',
  folder: 'Study',
  tags: 'Tafsir, question;TAFSIR #reflection',
  fontSize: 18,
  headingLevel: 2,
  isBold: true,
  isItalic: false,
  isUnderline: true,
  isStrike: false,
  listMode: 'bullet',
  textColorKey: 'gold',
  formatSpans: '[]',
  isPinned: true,
  updatedAt: 1_700_000_000_123,
};

test('notes export retains v2 envelope, source ordering and all nullable fields', () => {
  const exportData = buildNotesExport([note], new Date('2024-02-03T04:05:06.000Z'));
  assert.deepEqual(Object.keys(exportData), [
    'schemaVersion',
    'exportedAt',
    'app',
    'type',
    'userScope',
    'notes',
  ]);
  assert.equal(exportData.schemaVersion, 2);
  assert.equal(exportData.exportedAt, '2024-02-03T04:05:06Z');
  assert.equal(exportData.app, 'Quran Tracker');
  assert.equal(exportData.type, 'notes_export');
  assert.equal(exportData.userScope, 'local_device');
  assert.deepEqual(exportData.notes[0], {
    id: 14,
    userId: null,
    scope_type: 'ayah',
    juz_number: null,
    hizb_number: null,
    rub_number: null,
    surahNumber: 2,
    surahName: 'Al-Baqarah',
    ayahNumber: 255,
    title: 'Meaning',
    text: 'Text',
    folder: 'Study',
    tags: ['Tafsir', 'question', 'reflection'],
    rawTags: note.tags,
    fontSize: 18,
    headingLevel: 2,
    isBold: true,
    isItalic: false,
    isUnderline: true,
    isStrike: false,
    listMode: 'bullet',
    textColorKey: 'gold',
    formatSpans: '[]',
    isPinned: true,
    createdAt: null,
    updatedAt: '2023-11-14T22:13:20.123Z',
    updatedAtMillis: 1_700_000_000_123,
  });
  assert.deepEqual(Object.keys(exportData.notes[0]), [
    'id',
    'userId',
    'scope_type',
    'juz_number',
    'hizb_number',
    'rub_number',
    'surahNumber',
    'surahName',
    'ayahNumber',
    'title',
    'text',
    'folder',
    'tags',
    'rawTags',
    'fontSize',
    'headingLevel',
    'isBold',
    'isItalic',
    'isUnderline',
    'isStrike',
    'listMode',
    'textColorKey',
    'formatSpans',
    'isPinned',
    'createdAt',
    'updatedAt',
    'updatedAtMillis',
  ]);
});

test('tags split on comma, semicolon and hash, trim and deduplicate case-insensitively', () => {
  assert.deepEqual(noteTagList(' Tafsir, question;TAFSIR #reflection,, '), [
    'Tafsir',
    'question',
    'reflection',
  ]);
});

test('export JSON is indented and filename uses UTC date', () => {
  assert.match(
    stringifyNotesExport([note], new Date('2024-02-03T04:05:06.000Z')),
    /^\{\n  "schemaVersion": 2,/,
  );
  assert.equal(
    notesExportFileName(new Date('2024-02-03T23:59:59.000Z')),
    'quran_tracker_notes_export_2024-02-03.json',
  );
  assert.equal(
    notesExportFileName(new Date('2024-02-04T00:00:00.000Z')),
    'quran_tracker_notes_export_2024-02-04.json',
  );
});
