import assert from 'node:assert/strict';
import test from 'node:test';
import { countNotesForTarget } from '../src/domain/noteCounts';
import type { ExportableNote } from '../src/exporting/notesExport';
import {
  componentHarness,
  findElement,
  loadComponentModule,
  press,
  sharedComponents,
  type TestElement,
} from './helpers/componentHarness';

const notes = [
  { scopeType: 'surah', surahId: 2 },
  { scopeType: 'surah', surahId: 2 },
  { scopeType: 'ayah', surahId: 2, ayahNumber: 1 },
  { scopeType: 'juz', juzNumber: 2 },
  { scopeType: 'hizb', hizbNumber: 2 },
  { scopeType: 'rub', rubNumber: 40, hizbNumber: 10 },
].map(
  (note, index): ExportableNote => ({
    id: index + 1,
    juzNumber: null,
    hizbNumber: null,
    rubNumber: null,
    surahId: null,
    surahName: '',
    ayahNumber: null,
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
    updatedAt: 0,
    ...note,
  }),
);

test('contextual note badges count exact scopes and global rub numbers', () => {
  assert.equal(countNotesForTarget(notes, { scope: 'surah', number: 2 }), 2);
  assert.equal(countNotesForTarget(notes, { scope: 'ayah', number: 2, ayah: 1 }), 1);
  assert.equal(countNotesForTarget(notes, { scope: 'juz', number: 2 }), 1);
  assert.equal(countNotesForTarget(notes, { scope: 'hizb', number: 10 }), 0);
  assert.equal(countNotesForTarget(notes, { scope: 'rub', number: 40 }), 1);
  assert.equal(countNotesForTarget(notes, { scope: 'rub', number: 4 }), 0);
});

test('the real note-count button displays the count and opens that exact context', () => {
  const harness = componentHarness();
  const routes: unknown[][] = [];
  const target = { scope: 'surah', number: 2 };
  const module = loadComponentModule<{ NoteCountButton: (props: unknown) => TestElement }>(
    new URL('../src/features/notes/components/NoteCountButton.tsx', import.meta.url),
    {
      react: harness.react,
      'react-native': { Pressable: 'Pressable', View: 'View' },
      '../../../domain/noteCounts': { countNotesForTarget },
      '../../../app/navigation/types': {
        useAppNavigation: () => ({ navigate: (...args: unknown[]) => routes.push(args) }),
      },
      '../../../state/store': { useAppStore: () => ({ state: { notes } }) },
      '../../../i18n': {
        useI18n: () => ({
          t: (key: string) => key,
          format: (_key: string, count: number) => `${count} notes`,
        }),
      },
      '../../../shared/components': sharedComponents,
      '../../../shared/theme': { usePalette: () => ({ primary: 'green' }) },
    },
  );
  const tree = harness.render(() => module.NoteCountButton({ target }));
  press(findElement(tree, 'Pressable', 'accessibilityLabel', 'navigation.notes: 2 notes'));
  assert.equal(routes[0]?.[0], 'Notes');
  assert.equal((routes[0]?.[1] as { target: unknown }).target, target);
});
