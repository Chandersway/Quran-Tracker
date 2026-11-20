import assert from 'node:assert/strict';
import test from 'node:test';
import { stringifyNotesExport, type ExportableNote } from '../src/exporting/notesExport';
import { folderAtPoint, mergeImportedNotes, parseNotesImport } from '../src/domain/notesLibrary';
import { initialState } from '../src/state/models';
import { appReducer, type Action } from '../src/state/reducer';
import { decodeState } from '../src/state/persistence/decodeState';
import { blankFields, prepareNoteSave } from '../src/features/notes/editor/noteEditor';
import * as library from '../src/domain/notesLibrary';
import { noteDisplayTitle } from '../src/features/notes/editor/noteFormat';
import { notesLibraryCopy } from '../src/features/notes/libraryCopy';
import {
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
  type TestElement,
} from './helpers/componentHarness';

const note = (id: number, patch: Partial<ExportableNote> = {}): ExportableNote => ({
  id,
  scopeType: 'ayah',
  juzNumber: null,
  hizbNumber: null,
  rubNumber: null,
  surahId: 2,
  surahName: 'Al-Baqarah',
  ayahNumber: 255,
  title: 'Reflection',
  note: '  Arabisch: الله\nNederlandse reflectie  ',
  folder: 'Studie',
  tags: 'Tafsir; reflectie',
  fontSize: 18,
  headingLevel: 1,
  isBold: true,
  isItalic: false,
  isUnderline: true,
  isStrike: false,
  listMode: 'bullet',
  textColorKey: 'gold',
  formatSpans: '0,4,18,1,1,0,1,0,gold',
  isPinned: true,
  updatedAt: 1795000000000,
  ...patch,
});

test('the unchanged Kotlin/RN notes-export format roundtrips all five note references, text and formatting', () => {
  const notes = [
    note(1),
    note(2, { scopeType: 'surah', ayahNumber: null }),
    note(3, { scopeType: 'hizb', hizbNumber: 20, surahId: null, ayahNumber: null }),
    note(4, { scopeType: 'juz', juzNumber: 12, surahId: null, ayahNumber: null }),
    note(5, { scopeType: 'rub', rubNumber: 240, surahId: null, ayahNumber: null }),
  ];
  assert.deepEqual(parseNotesImport(stringifyNotesExport(notes)), notes);
});

test('colliding IDs are remapped without overwriting and re-importing the same export is idempotent', () => {
  const existing = [note(4, { note: 'Keep this original exactly' })];
  const incoming = [note(4), note(5, { title: 'Different source note' })];
  const original = JSON.stringify(existing);
  const merged = mergeImportedNotes(existing, parseNotesImport(stringifyNotesExport(incoming)));
  assert.equal(JSON.stringify(existing), original);
  assert.deepEqual(merged.notes[0], existing[0]);
  assert.equal(merged.added, 2);
  assert.equal(new Set(merged.notes.map((item) => item.id)).size, 3);
  assert.equal(merged.notes[1]!.id, 5);
  assert.equal(merged.notes[2]!.id, 6);
  const repeated = mergeImportedNotes(
    merged.notes,
    parseNotesImport(stringifyNotesExport(incoming)),
  );
  assert.equal(repeated.added, 0);
  assert.equal(repeated.skipped, 2);
  const differentPropertyOrder = Object.fromEntries(
    Object.entries(incoming[0]!).reverse(),
  ) as unknown as ExportableNote;
  assert.equal(mergeImportedNotes(merged.notes, [differentPropertyOrder]).added, 0);
});

test('one malformed record rejects the entire import before any state changes', () => {
  const saved = { ...initialState, notes: [note(1)] };
  const bytes = JSON.stringify(saved);
  const valid = JSON.parse(stringifyNotesExport([note(2)]));
  for (const broken of [
    null,
    { ...valid.notes[0], text: null },
    { ...valid.notes[0], surahNumber: 999 },
    { ...valid.notes[0], id: 1.2 },
    { ...valid.notes[0], isBold: 'yes' },
    { ...valid.notes[0], juz_number: 1 },
    { ...valid.notes[0], scope_type: 'surah' },
    { ...valid.notes[0], tags: [42] },
    { ...valid.notes[0], fontSize: -1 },
    { ...valid.notes[0], updatedAtMillis: valid.notes[0].updatedAtMillis + 1 },
  ]) {
    const payload = JSON.stringify({ ...valid, notes: [...valid.notes, broken] });
    assert.throws(() =>
      appReducer(saved, { type: 'notes/import', notes: parseNotesImport(payload) }),
    );
    assert.equal(JSON.stringify(saved), bytes);
  }
  assert.throws(() => parseNotesImport(JSON.stringify({ ...valid, schemaVersion: 3 })));
  assert.throws(() => parseNotesImport(JSON.stringify({ ...valid, userScope: 'unknown' })));
  assert.throws(() => parseNotesImport(JSON.stringify({ ...valid, exportedAt: null })));
  assert.equal(
    parseNotesImport(JSON.stringify({ ...valid, exportedAt: '2026-01-01T00:00:00.123456789Z' }))
      .length,
    1,
  );
  assert.throws(() => parseNotesImport('x'.repeat(10 * 1024 * 1024 + 1)));
});

test('colliding maximum-safe export IDs and subsequent drafts all retain their own notes', () => {
  const high = Number.MAX_SAFE_INTEGER;
  let state = appReducer(initialState, {
    type: 'notes/import',
    notes: parseNotesImport(stringifyNotesExport([note(high), note(1, { title: 'Other' })])),
  });
  state = appReducer(state, {
    type: 'notes/import',
    notes: parseNotesImport(stringifyNotesExport([note(high, { title: 'A different note' })])),
  });
  for (const title of ['New draft', 'Another draft']) {
    const draft = prepareNoteSave(
      { ...blankFields({ scope: 'juz', number: 3 }), title },
      state.notes,
      null,
      1795000000001,
    );
    assert.ok(draft.ok);
    state = appReducer(state, { type: 'note/save', note: draft.note });
  }
  assert.deepEqual(
    state.notes.map((saved) => saved.id),
    [4, 3, high, 1, 2],
  );
  assert.equal(parseNotesImport(stringifyNotesExport(state.notes)).length, 5);
});

test('empty general folders survive restart; moving a note retains its exact reference, formatting and dates', () => {
  let state = appReducer(
    { ...initialState, notes: [note(7)] },
    { type: 'note/folder-create', name: '  Algemeen  ' },
  );
  state = decodeState(JSON.stringify(state));
  assert.deepEqual(state.noteFolders, ['Algemeen']);
  assert.equal(state.notes[0]!.folder, 'Studie');
  state = appReducer(state, { type: 'note/move', id: 7, folder: 'Algemeen' });
  assert.deepEqual(state.notes[0], { ...note(7), folder: 'Algemeen' });
  assert.deepEqual(state.history, []);
  assert.deepEqual(parseNotesImport(stringifyNotesExport(state.notes)), state.notes);
  const legacy = JSON.parse(JSON.stringify(state));
  delete legacy.noteFolders;
  assert.deepEqual(decodeState(JSON.stringify(legacy)).noteFolders, []);
  assert.throws(() => decodeState(JSON.stringify({ ...state, noteFolders: [null] })));
});

test('import action adds all records in one reducer transition and retains their folders', () => {
  const before = { ...initialState, notes: [note(1)] };
  const next = appReducer(before, {
    type: 'notes/import',
    notes: parseNotesImport(
      stringifyNotesExport([note(2, { title: 'New', folder: 'Nieuwe map' })]),
    ),
  });
  assert.equal(before.notes.length, 1);
  assert.equal(next.notes.length, 2);
  assert.deepEqual(next.noteFolders, ['Nieuwe map']);
  assert.deepEqual(next.notes[0], before.notes[0]);
});

test('moving to an existing imported folder uses its original full name', () => {
  const folder = 'Hoofdstuk '.repeat(13);
  const imported = appReducer(initialState, {
    type: 'notes/import',
    notes: parseNotesImport(stringifyNotesExport([note(1, { folder }), note(2, { folder: '' })])),
  });
  const moved = appReducer(imported, { type: 'note/move', id: 2, folder });
  assert.deepEqual(moved.noteFolders, [folder]);
  assert.equal(moved.notes[1]!.folder, folder);
  assert.equal(appReducer(moved, { type: 'note/move', id: 99, folder: 'Missing note' }), moved);
});

test('the accessible move chooser creates a destination and moves the selected untitled note in one write', async () => {
  const hooks = componentHarness();
  const original = note(7, { title: '', note: 'A reflection', folder: '' });
  let state = { ...initialState, notes: [original] };
  const copy = notesLibraryCopy[state.preferences.language];
  const writes: Action[] = [];
  const commit = async (action: Action) => {
    writes.push(action);
    state = appReducer(state, action);
  };
  let selected: string | null = null;
  const { NotesScreen } = loadComponentModule<{ NotesScreen: (props: unknown) => unknown }>(
    new URL('../src/features/notes/screens/NotesScreen.tsx', import.meta.url),
    {
      react: { ...hooks.react, useLayoutEffect: hooks.react.useEffect },
      'react-native': { View: 'View', Pressable: 'Pressable' },
      '@react-navigation/native': { usePreventRemove() {} },
      '../../../state/store': { useAppStore: () => ({ state, commit }) },
      '../../../i18n': { useI18n: () => ({ t: (key: string) => key }) },
      '../../../i18n/notes': { useNotesCopy: () => ({ pinned: 'Pinned', title: 'Notes' }) },
      '../../../shared/components': sharedComponents,
      '../../../shared/theme': { usePalette: () => ({}) },
      '../../../domain/quran': {},
      '../editor/noteEditor': {},
      '../editor/noteFormat': { noteDisplayTitle },
      '../hooks/useNoteFilters': {
        useNoteFilters: () => ({
          filtered: state.notes,
          folders: state.noteFolders,
          setSelectedFolder: (name: string) => {
            selected = name;
          },
        }),
      },
      '../hooks/useNoteEditor': { useNoteEditor: () => ({ isEditing: false }) },
      '../components/NoteRow': { NoteRow: 'NoteRow' },
      '../components/NoteEditorView': {},
      '../components/NoteFilterSheet': {},
      '../components/NoteTargetSummary': {},
      '../libraryCopy': { notesLibraryCopy },
      '../../../domain/notesLibrary': library,
      '../../../services/storage/pickNotesFile': {},
      '../components/NoteFoldersBar': { NoteFoldersBar: 'NoteFoldersBar' },
      '../components/NoteDragHandle': { NoteDragHandle: 'NoteDragHandle' },
    },
  );
  const props = { route: {}, navigation: { setOptions() {} } };
  const render = () => hooks.render(() => NotesScreen(props));
  const handle = elements(render(), 'NoteRow')[0]!.props.dragHandle as TestElement;
  assert.equal(handle.props.label, `${copy.move}: A reflection`);
  (handle.props.onChoose as () => void)();
  const chooser = findElement(render(), 'Sheet', 'title', copy.move);
  assert.equal(chooser.props.visible, true);
  await press(findElement(chooser, 'Button', 'title', copy.create));
  const create = findElement(render(), 'Sheet', 'title', copy.create);
  assert.equal(create.props.visible, true);
  (elements(create, 'Field')[0]!.props.onChangeText as (value: string) => void)('  Study  ');
  await press(findElement(render(), 'Button', 'title', copy.create));
  assert.equal(writes.length, 1);
  assert.equal(writes[0]!.type, 'note/move');
  assert.equal(selected, 'Study');
  assert.deepEqual(state.notes, [{ ...original, folder: 'Study' }]);
  assert.deepEqual(state.noteFolders, ['Study']);
});

test('drop hit testing moves into the visible folder, including unfiled; outside release has no target', () => {
  const targets = [
    { folder: 'Studie', x: 10, y: 600, width: 100, height: 48 },
    { folder: '', x: 120, y: 600, width: 100, height: 48 },
  ];
  const viewport = { x: 15, y: 600, width: 180, height: 48 };
  assert.equal(folderAtPoint(targets, 50, 620, viewport), 'Studie');
  assert.equal(folderAtPoint(targets, 180, 620, viewport), '');
  assert.equal(folderAtPoint(targets, 50, 599, viewport), undefined);
  assert.equal(folderAtPoint(targets, 500, 620, viewport), undefined);
  assert.equal(folderAtPoint(targets, 11, 620, viewport), undefined);
  assert.equal(folderAtPoint(targets, 205, 620, viewport), undefined);
});
