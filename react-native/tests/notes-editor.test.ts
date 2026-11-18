import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as editorRules from '../src/features/notes/editor/noteEditor';
import {
  filterNotes,
  canCreateInContext,
  type NoteFilters,
} from '../src/features/notes/editor/noteFilters';
import { decodeNoteFormatSpans } from '../src/features/notes/editor/noteFormat';
import * as quranRules from '../src/domain/quran';
import * as notesExport from '../src/exporting/notesExport';
import { appReducer } from '../src/state/reducer';
import { initialState } from '../src/state/models';
import type { NoteLabels } from '../src/i18n/notes';
import type { useNoteEditor } from '../src/features/notes/hooks/useNoteEditor';

function load<T>(
  path: string,
  modules: Record<string, unknown>,
  globals: Record<string, unknown> = {},
): T {
  const output = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    ...globals,
    require(name: string) {
      assert.ok(name in modules, `Missing dependency ${name}`);
      return modules[name];
    },
  });
  return exports as T;
}

const copy = load<{ notesWords: { en: NoteLabels } }>('../src/i18n/notes.ts', { './index': {} })
  .notesWords.en;
const ayah = { scope: 'ayah' as const, number: 2, ayah: 255 };

function makeNote(id: number, patch: Partial<editorRules.EditorFields> = {}) {
  const result = editorRules.prepareNoteSave(
    { ...editorRules.blankFields(ayah), note: 'Reflection', ...patch },
    [],
    id,
    id * 100,
  );
  assert.ok(result.ok);
  return result.note;
}

test('new and edited notes keep scope, body whitespace and formatting through reducer and export', () => {
  const draft = {
    ...editorRules.blankFields(ayah),
    title: '  Meaning  ',
    note: '  First line\nSecond line  ',
    folder: '  Study ',
    tags: ' Tafsir;reflection ',
    isPinned: true,
    fontSize: 18,
    headingLevel: 2,
    isBold: true,
    listMode: 'bullet',
    formatSpans: '2,7,18,2,1,0,0,0,gold',
  };
  const first = editorRules.prepareNoteSave(draft, [makeNote(4)], null, 123);
  assert.ok(first.ok);
  assert.equal(first.note.id, 5);
  assert.equal(first.note.title, 'Meaning');
  assert.equal(first.note.note, draft.note);
  assert.equal(first.note.folder, 'Study');
  assert.equal(first.note.tags, 'Tafsir;reflection');
  assert.deepEqual(editorRules.targetForNote(first.note), ayah);
  let state = appReducer(initialState, { type: 'note/save', note: first.note });
  const reopened = editorRules.fieldsForNote(state.notes[0]!);
  assert.deepEqual(reopened, {
    ...draft,
    title: 'Meaning',
    folder: 'Study',
    tags: 'Tafsir;reflection',
  });
  const edited = editorRules.prepareNoteSave(
    { ...reopened, title: 'Edited' },
    state.notes,
    first.note.id,
    456,
  );
  assert.ok(edited.ok);
  state = appReducer(state, { type: 'note/save', note: edited.note });
  assert.equal(state.notes.length, 1);
  const exported = notesExport.buildNotesExport(state.notes, new Date('2026-11-14T00:00:00Z'))
    .notes[0]!;
  assert.equal(exported.id, 5);
  assert.equal(exported.title, 'Edited');
  assert.equal(exported.text, draft.note);
  assert.equal(exported.formatSpans, draft.formatSpans);
  assert.equal(exported.surahNumber, 2);
  assert.equal(exported.ayahNumber, 255);
  assert.equal(exported.updatedAtMillis, 456);
});

test('draft validation and reference roundtrip retain the existing save rules', () => {
  assert.deepEqual(editorRules.prepareNoteSave(editorRules.blankFields(), [], null, 1), {
    ok: false,
    reason: 'chooseScope',
  });
  assert.deepEqual(
    editorRules.prepareNoteSave({ ...editorRules.blankFields(ayah), title: ' ' }, [], null, 1),
    { ok: false, reason: 'contentRequired' },
  );
  assert.deepEqual(
    editorRules.prepareNoteSave(
      { ...editorRules.blankFields({ ...ayah, ayah: 999 }), note: 'Text' },
      [],
      null,
      1,
    ),
    { ok: false, reason: 'targetInvalid' },
  );
  for (const target of [
    { scope: 'juz', number: 3 },
    { scope: 'hizb', number: 4 },
    { scope: 'rub', number: 5 },
    { scope: 'surah', number: 6 },
    ayah,
  ] as const) {
    const note = makeNote(1, { target });
    assert.deepEqual(editorRules.targetForNote(note), target);
    assert.deepEqual(editorRules.fieldsForNote(note).target, target);
  }
});

test('editor text changes preserve existing spans and apply active formatting to inserted text', () => {
  const before = {
    ...editorRules.blankFields(ayah),
    note: 'abcdef',
    isItalic: true,
    formatSpans: '2,6,18,0,1,0,0,0,mint',
    listMode: 'todo',
  };
  const changed = editorRules.updateEditorText(before, 'abXcdef');
  const spans = decodeNoteFormatSpans(changed.formatSpans);
  assert.deepEqual(
    spans.map(({ start, end, isBold, isItalic }) => ({ start, end, isBold, isItalic })),
    [
      { start: 2, end: 3, isBold: false, isItalic: true },
      { start: 3, end: 7, isBold: true, isItalic: false },
    ],
  );
  assert.equal(changed.listMode, 'todo');
  assert.equal(before.note, 'abcdef');
  assert.equal(editorRules.toggleTag('Tafsir, reflection', 'TAFSIR'), 'reflection');
});

test('filters combine section inclusion, scope, tags, folders, search and pinned/title sorting', () => {
  const notes = [
    makeNote(1, { target: { scope: 'surah', number: 2 }, title: 'Zebra' }),
    makeNote(2, { title: 'Alpha', tags: 'Tafsir;reflection', folder: 'Study', isPinned: true }),
    makeNote(3, { title: 'Beta', tags: 'TAFSIR', folder: 'Study' }),
    makeNote(4, { target: { scope: 'surah', number: 3 }, title: 'Other' }),
  ];
  const before = structuredClone(notes);
  const filters: NoteFilters = {
    contextTarget: { scope: 'surah', number: 2 },
    includeChildren: false,
    selectedScope: 'all',
    pinnedOnly: false,
    selectedFolder: null,
    selectedTag: null,
    query: '',
    titleSort: false,
    language: 'en',
    copy,
  };
  const ids = (patch: Partial<NoteFilters>) =>
    filterNotes(notes, { ...filters, ...patch }).map((note) => note.id);
  assert.deepEqual(ids({}), [1]);
  assert.deepEqual(ids({ includeChildren: true }), [2, 3, 1]);
  assert.deepEqual(
    ids({
      includeChildren: true,
      selectedScope: 'ayah',
      selectedTag: 'tafsir',
      selectedFolder: 'Study',
    }),
    [2, 3],
  );
  assert.deepEqual(ids({ contextTarget: null, query: '2:255' }), [2, 3]);
  assert.deepEqual(ids({ contextTarget: null, pinnedOnly: true }), [2]);
  assert.deepEqual(ids({ contextTarget: null, titleSort: true }), [2, 3, 4, 1]);
  assert.deepEqual(
    filterNotes([{ ...notes[1]!, surahName: '' }], {
      ...filters,
      contextTarget: null,
      language: 'ar',
      query: 'baqarah',
    }).map((note) => note.id),
    [2],
  );
  assert.equal(canCreateInContext([notes[1]!], filters.contextTarget, false), true);
  assert.equal(canCreateInContext([notes[1]!], filters.contextTarget, true), false);
  assert.deepEqual(notes, before);
});

type AlertButton = { style: string; onPress?: () => void };
function editorHarness() {
  let index = 0;
  const slots: unknown[] = [];
  const alerts: AlertButton[][] = [];
  let state = { ...initialState, notes: [makeNote(7)] };
  const shares: Array<{ json: string; name: string }> = [];
  let shareFails = false;
  let persistence: () => Promise<void> = async () => {};
  let commits = 0;
  let saved = 0;
  const { useNoteEditor: useEditor } = load<{ useNoteEditor: typeof useNoteEditor }>(
    '../src/features/notes/hooks/useNoteEditor.ts',
    {
      react: {
        useState(value: unknown) {
          const slot = index++;
          if (!(slot in slots)) slots[slot] = typeof value === 'function' ? value() : value;
          return [
            slots[slot],
            (next: unknown) => {
              slots[slot] = typeof next === 'function' ? next(slots[slot]) : next;
            },
          ];
        },
        useMemo: (fn: () => unknown) => fn(),
        useRef(value: unknown) {
          const slot = index++;
          if (!(slot in slots)) slots[slot] = { current: value };
          return slots[slot];
        },
      },
      'react-native': {
        Alert: {
          alert: (_title: string, _body: string, buttons: AlertButton[]) => alerts.push(buttons),
        },
      },
      '../../../i18n': { useI18n: () => ({ t: (key: string) => key }) },
      '../../../domain/quran': quranRules,
      '../../../exporting/notesExport': notesExport,
      '../../../services/storage/shareNotesFile': {
        shareNotesFile: async (json: string, name: string) => {
          if (shareFails) throw new Error('No sharing');
          shares.push({ json, name });
        },
      },
      '../editor/noteEditor': editorRules,
    },
  );
  function render() {
    index = 0;
    return useEditor({
      notes: state.notes,
      commit: async (action: Parameters<typeof appReducer>[1]) => {
        commits++;
        state = appReducer(state, action);
        await persistence();
      },
      initialNoteId: 7,
      contextTarget: null,
      copy,
      language: 'en',
      onSaved: () => {
        saved++;
      },
    });
  }
  return {
    render,
    alerts,
    shares,
    notes: () => state.notes,
    commits: () => commits,
    saved: () => saved,
    persistWith: (next: () => Promise<void>) => {
      persistence = next;
    },
    failSharing: () => {
      shareFails = true;
    },
  };
}

test('editor callbacks retain unsaved confirmation, save/edit, pin and confirmed deletion', async () => {
  const harness = editorHarness();
  let editor = harness.render();
  assert.equal(editor.preview, true);
  editor.setFields((current) => ({ ...current, title: 'Unsaved title' }));
  editor = harness.render();
  editor.closeEditor();
  assert.equal(harness.render().isEditing, true);
  assert.equal(harness.alerts.length, 1);
  assert.equal(harness.alerts[0]![0]!.style, 'cancel');
  harness.alerts[0]![1]!.onPress!();
  assert.equal(harness.render().isEditing, false);
  editor = harness.render();
  editor.startEdit(harness.notes()[0]!);
  editor = harness.render();
  editor.setFields((current) => ({ ...current, title: 'Saved title' }));
  await harness.render().saveNote();
  assert.equal(harness.notes()[0]!.title, 'Saved title');
  assert.equal(harness.notes().length, 1);
  await harness.render().pinNote(harness.notes()[0]!);
  assert.equal(harness.notes()[0]!.isPinned, true);
  harness.render().deleteNote(7);
  assert.equal(harness.notes().length, 1);
  await harness.alerts.at(-1)![1]!.onPress!();
  assert.equal(harness.notes().length, 0);
});

test('editor waits for durable save, blocks double-submit and preserves the draft on failure', async () => {
  const harness = editorHarness();
  harness
    .render()
    .setFields((current) => ({ ...current, title: 'Must survive a storage failure' }));
  let fail!: (reason: Error) => void;
  const disk = new Promise<void>((_resolve, reject) => {
    fail = reject;
  });
  harness.persistWith(() => disk);
  const saving = harness.render().saveNote();
  const duplicate = harness.render().saveNote();
  assert.equal(harness.render().isEditing, true);
  assert.equal(harness.render().busy, true);
  assert.equal(harness.commits(), 1);
  assert.equal(harness.saved(), 0);
  fail(new Error('Disk full'));
  await Promise.all([saving, duplicate]);
  assert.equal(harness.render().isEditing, true);
  assert.equal(harness.render().fields.title, 'Must survive a storage failure');
  assert.ok(harness.render().error);
  assert.equal(harness.render().busy, false);
  assert.equal(harness.saved(), 0);
  harness.persistWith(async () => {});
  await harness.render().saveNote();
  assert.equal(harness.saved(), 1);
  assert.equal(harness.render().isEditing, false);
  assert.equal(harness.notes().length, 1);
});

test('failed new note save retries the same identity without exporting a duplicate', async () => {
  const harness = editorHarness();
  harness.render().startNew(ayah);
  harness.render().setFields((current) => ({ ...current, title: 'A new reflection' }));
  harness.persistWith(async () => {
    throw new Error('Disk full');
  });
  await harness.render().saveNote();
  assert.equal(harness.render().isEditing, true);
  assert.equal(harness.notes().length, 2);
  harness.persistWith(async () => {});
  await harness.render().saveNote();
  assert.equal(harness.notes().length, 2);
  assert.equal(harness.saved(), 1);
});

test('export uses original pinned-first, newest-first order without mutating notes', () => {
  const notes = [makeNote(5), makeNote(1, { isPinned: true }), makeNote(3, { isPinned: true })];
  const before = structuredClone(notes);
  assert.deepEqual(
    notesExport.buildNotesExport(notes).notes.map((note) => note.id),
    [3, 1, 5],
  );
  assert.deepEqual(notes, before);
});

test('export callback preserves the portable JSON and reports success or failure', async () => {
  const harness = editorHarness();
  await harness.render().exportNotes();
  assert.equal(harness.shares.length, 1);
  assert.match(harness.shares[0]!.name, /^quran_tracker_notes_export_\d{4}-\d{2}-\d{2}\.json$/);
  const exported = JSON.parse(harness.shares[0]!.json);
  assert.deepEqual(exported.notes, notesExport.buildNotesExport(harness.notes()).notes);
  assert.equal(harness.render().message, copy.exportReady);
  assert.equal(harness.render().busy, false);
  harness.failSharing();
  await harness.render().exportNotes();
  assert.equal(harness.render().error, copy.exportError);
  assert.equal(harness.render().busy, false);
});

test('the note editor offers existing user tags alongside the original curated suggestions', async () => {
  const harness = editorHarness();
  harness.render().setFields((current) => ({ ...current, tags: 'My research;Dua' }));
  await harness.render().saveNote();
  const suggestions = harness.render().tagSuggestions;
  assert.ok(suggestions.includes('My research'));
  assert.ok(copy.tagSuggestions.every((tag) => suggestions.includes(tag)));
  assert.equal(suggestions.filter((tag) => tag === 'Dua').length, 1);
});

test('native and web file adapters share/download the exact supplied bytes and clean up browser URLs', async () => {
  const json = notesExport.stringifyNotesExport([makeNote(1)], new Date('2026-11-14T00:00:00Z'));
  const writes: string[] = [];
  const shares: Array<{ uri: string; options: Record<string, string> }> = [];
  const native = load<{ shareNotesFile: (json: string, name: string) => Promise<void> }>(
    '../src/services/storage/shareNotesFile.native.ts',
    {
      'expo-file-system': {
        Paths: { cache: 'cache' },
        File: class {
          exists = true;
          uri = 'cache/notes.json';
          delete() {
            writes.push('delete');
          }
          async write(value: string) {
            writes.push(value);
          }
        },
      },
      'expo-sharing': {
        isAvailableAsync: async () => true,
        shareAsync: async (uri: string, options: Record<string, string>) => {
          shares.push({ uri, options });
        },
      },
    },
  );
  await native.shareNotesFile(json, 'notes.json');
  assert.deepEqual(writes, ['delete', json]);
  assert.equal(shares[0]!.options.mimeType, 'application/json');
  assert.equal(shares[0]!.options.UTI, 'public.json');
  const revoked: string[] = [];
  const anchor = {
    href: '',
    download: '',
    click() {
      throw new Error('Download failed');
    },
  };
  let blob: Blob | undefined;
  const web = load<{ shareNotesFile: (json: string, name: string) => Promise<void> }>(
    '../src/services/storage/shareNotesFile.web.ts',
    {},
    {
      Blob,
      URL: {
        createObjectURL(value: Blob) {
          blob = value;
          return 'blob:notes';
        },
        revokeObjectURL: (url: string) => revoked.push(url),
      },
      document: { createElement: () => anchor },
    },
  );
  await assert.rejects(web.shareNotesFile(json, 'notes.json'), /Download failed/);
  assert.equal(await blob!.text(), json);
  assert.equal(anchor.download, 'notes.json');
  assert.deepEqual(revoked, ['blob:notes']);
});
