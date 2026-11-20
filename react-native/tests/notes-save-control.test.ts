import assert from 'node:assert/strict';
import test from 'node:test';
import * as rules from '../src/features/notes/editor/noteEditor';
import * as noteFormat from '../src/features/notes/editor/noteFormat';
import * as quran from '../src/domain/quran';
import * as exporting from '../src/exporting/notesExport';
import { appReducer, type Action } from '../src/state/reducer';
import { initialState } from '../src/state/models';
import type { useNoteEditor } from '../src/features/notes/hooks/useNoteEditor';
import type { NoteLabels } from '../src/i18n/notes';
import {
  componentHarness,
  elements,
  findElement,
  loadComponentModule,
  sharedComponents,
  type TestElement,
} from './helpers/componentHarness';

const copy = loadComponentModule<{ notesWords: { nl: NoteLabels } }>(
  new URL('../src/i18n/notes.ts', import.meta.url),
  { './index': {} },
).notesWords.nl;
function editorScreen(existing = false) {
  const hooks = componentHarness();
  const note = rules.prepareNoteSave(
    { ...rules.blankFields({ scope: 'surah', number: 2 }), note: 'Original' },
    [],
    3,
    100,
  );
  assert.ok(note.ok);
  let state = { ...initialState, notes: existing ? [note.note] : [] };
  let editor!: ReturnType<typeof useNoteEditor>;
  let disk: () => Promise<void> = async () => {};
  let commitCount = 0;
  let saved = 0;
  const labels = { useI18n: () => ({ t: (key: string) => key }) };
  const { useNoteEditor: useEditor } = loadComponentModule<{ useNoteEditor: typeof useNoteEditor }>(
    new URL('../src/features/notes/hooks/useNoteEditor.ts', import.meta.url),
    {
      react: hooks.react,
      'react-native': { Alert: { alert() {} } },
      '../../../i18n': labels,
      '../../../domain/quran': quran,
      '../../../exporting/notesExport': exporting,
      '../../../services/storage/shareNotesFile': {},
      '../editor/noteEditor': rules,
    },
  );
  const { NoteEditorView } = loadComponentModule<{ NoteEditorView: (props: object) => unknown }>(
    new URL('../src/features/notes/components/NoteEditorView.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': {
        Pressable: 'Pressable',
        View: 'View',
        KeyboardAvoidingView: 'KeyboardAvoidingView',
        Keyboard: { dismiss() {} },
        Platform: { OS: 'android' },
        ScrollView: 'ScrollView',
        TextInput: 'TextInput',
      },
      '../../../shared/components': { ...sharedComponents, s: { input: {} } },
      '../../../shared/theme': { usePalette: () => ({}), fonts: {} },
      '../../../i18n': labels,
      '../editor/noteEditor': rules,
      '../editor/noteFormat': noteFormat,
      '../../../exporting/notesExport': exporting,
      './FormattedNote': { FormattedNote: 'FormattedNote', useNoteColors: () => ({}) },
      './NoteTargetControl': { NoteTargetControl: 'NoteTargetControl' },
      './NoteTargetSummary': { NoteTargetSummary: 'NoteTargetSummary' },
      './RichNoteInput': { RichNoteInput: 'RichNoteInput' },
    },
  );
  const { s } = loadComponentModule<{ s: { iconButton: { width: number; height: number } } }>(
    new URL('../src/shared/components/styles.tsx', import.meta.url),
    {
      'react-native': { StyleSheet: { create: (value: unknown) => value } },
      '../theme': { fonts: {} },
    },
  );
  const { IconButton } = loadComponentModule<{ IconButton: (props: object) => TestElement }>(
    new URL('../src/shared/components/IconButton.tsx', import.meta.url),
    {
      react: hooks.react,
      'react-native': { Pressable: 'Pressable' },
      '../../i18n': labels,
      '../theme': { usePalette: () => ({}) },
      './Icon': { Icon: 'Icon' },
      './styles': { s },
    },
  );
  const render = () =>
    hooks.render(() => {
      editor = useEditor({
        notes: state.notes,
        commit: async (action: Action) => {
          commitCount++;
          state = appReducer(state, action);
          await disk();
        },
        initialNoteId: existing ? 3 : undefined,
        contextTarget: null,
        copy,
        language: 'nl',
        onSaved: () => {
          saved++;
        },
      });
      return NoteEditorView({ editor, copy, language: 'nl' });
    });
  const saveButton = () => {
    const icon = findElement(render(), 'IconButton', 'name', 'check');
    return IconButton(icon.props);
  };
  const tapSave = async () => {
    const button = saveButton();
    assert.equal(
      button.props.disabled,
      false,
      'the save check must receive the save intent, including validation',
    );
    await (button.props.onPress as () => void | Promise<void>)();
  };
  render();
  return {
    render,
    saveButton,
    tapSave,
    style: s.iconButton,
    current: () => editor,
    persistWith: (next: () => Promise<void>) => {
      disk = next;
    },
    commits: () => commitCount,
    saved: () => saved,
    notes: () => state.notes,
    start: (target: quran.QuranNoteTarget | null) => {
      editor.startNew(target, 'General');
      render();
    },
  };
}

test('a real header-check tap on an unscoped draft shows the reason and opens reference recovery', async () => {
  const app = editorScreen();
  app.start(null);
  app.current().setShowMetadata(false);
  let tree = app.render();
  (elements(tree, 'RichNoteInput')[0]!.props.onChangeText as (value: string) => void)(
    'Temporary reflection',
  );
  await app.tapSave();
  tree = app.render();
  assert.equal(app.current().showMetadata, true);
  assert.equal(app.current().error, copy.chooseScope);
  const metadata = elements(tree, 'Sheet').find((sheet) => sheet.props.visible === true)!;
  assert.ok(
    elements(metadata.props.children, 'Notice').some(
      (notice) => notice.props.message === copy.chooseScope,
    ),
  );
  assert.equal(app.commits(), 0);
  assert.equal(app.current().fields.note, 'Temporary reflection');
  assert.ok(app.style.width >= 48 && app.style.height >= 48);
  (
    elements(metadata.props.children, 'NoteTargetControl')[0]!.props.onChange as (
      target: quran.QuranNoteTarget,
    ) => void
  )({ scope: 'surah', number: 2 });
  const corrected = elements(app.render(), 'Sheet').find((sheet) => sheet.props.visible === true)!;
  assert.equal(app.current().error, null);
  await (
    findElement(corrected.props.footer, 'Button', 'title', copy.save).props
      .onPress as () => Promise<void>
  )();
  app.render();
  assert.equal(app.notes()[0]!.note, 'Temporary reflection');
  assert.equal(app.notes()[0]!.surahId, 2);
  assert.equal(app.current().isEditing, false);
});

test('unchanged existing note accepts the check and finishes without a disk write', async () => {
  const app = editorScreen(true);
  const before = structuredClone(app.notes());
  assert.equal(app.current().isEditing, true);
  await app.tapSave();
  app.render();
  assert.equal(app.current().isEditing, false);
  assert.equal(app.commits(), 0);
  assert.deepEqual(app.notes(), before);
});

test('empty content and invalid references explain the blocked save without losing the draft', async () => {
  const blank = editorScreen();
  blank.start({ scope: 'surah', number: 2 });
  await blank.tapSave();
  let tree = blank.render();
  assert.equal(blank.current().error, copy.contentRequired);
  assert.ok(
    elements(tree, 'Notice').some((notice) => notice.props.message === copy.contentRequired),
  );
  assert.equal(blank.commits(), 0);
  const invalid = editorScreen();
  invalid.start({ scope: 'ayah', number: 2, ayah: 0 });
  invalid.current().setFields((fields) => ({ ...fields, note: 'Keep this exact text' }));
  await invalid.tapSave();
  tree = invalid.render();
  assert.equal(invalid.current().error, copy.targetInvalid);
  assert.equal(invalid.current().showMetadata, true);
  assert.equal(invalid.current().fields.note, 'Keep this exact text');
  assert.ok(elements(tree, 'Notice').some((notice) => notice.props.message === copy.targetInvalid));
  assert.equal(invalid.commits(), 0);
});

test('header check saves every existing scope through a durable commit and preserves exact content/folder', async () => {
  for (const target of [
    { scope: 'juz', number: 2 },
    { scope: 'hizb', number: 4 },
    { scope: 'rub', number: 16 },
    { scope: 'surah', number: 2 },
    { scope: 'ayah', number: 2, ayah: 255 },
  ] as const) {
    const app = editorScreen();
    app.start(target);
    const tree = app.render();
    (elements(tree, 'RichNoteInput')[0]!.props.onChangeText as (value: string) => void)(
      '  Exact note\n',
    );
    await app.tapSave();
    app.render();
    assert.equal(app.notes().length, 1);
    assert.equal(app.notes()[0]!.note, '  Exact note\n');
    assert.equal(app.notes()[0]!.folder, 'General');
    assert.deepEqual(rules.targetForNote(app.notes()[0]!), target);
    assert.equal(app.current().isEditing, false);
    assert.equal(app.saved(), 1);
  }
});

test('real save check waits for disk, blocks duplicate touches, and leaves failures retryable', async () => {
  const app = editorScreen();
  app.start({ scope: 'surah', number: 2 });
  app.current().setFields((fields) => ({ ...fields, note: 'Keep this draft' }));
  let fail!: (error: Error) => void;
  app.persistWith(
    () =>
      new Promise<void>((_resolve, reject) => {
        fail = reject;
      }),
  );
  const pending = app.tapSave();
  assert.equal(app.saveButton().props.disabled, true);
  assert.equal(app.current().isEditing, true);
  assert.equal(app.saved(), 0);
  fail(new Error('Disk full'));
  await pending;
  app.render();
  assert.equal(app.current().fields.note, 'Keep this draft');
  assert.equal(app.current().error, copy.saveError);
  assert.equal(app.saveButton().props.disabled, false);
  app.persistWith(async () => {});
  await app.tapSave();
  app.render();
  assert.equal(app.notes().length, 1, 'retry uses the same note identity');
  assert.equal(app.current().isEditing, false);
  assert.equal(app.saved(), 1);
});

test('saving a reverted draft after an optimistic disk failure restores its original data', async () => {
  const app = editorScreen(true);
  app.current().setFields((fields) => ({ ...fields, note: 'Failed edit' }));
  app.persistWith(async () => {
    throw new Error('Disk full');
  });
  await app.tapSave();
  app.render();
  assert.equal(app.notes()[0]!.note, 'Failed edit', 'the app store applies optimistic changes');
  app.current().setFields((fields) => ({ ...fields, note: 'Original' }));
  app.persistWith(async () => {});
  await app.tapSave();
  app.render();
  assert.equal(app.notes()[0]!.note, 'Original');
  assert.equal(app.commits(), 2);
});
