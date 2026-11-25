import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanTodoLine,
  decodeNoteFormatSpans,
  encodeNoteFormatSpans,
  isTodoChecked,
  noteDisplayFontSize,
  noteDisplayTitle,
  noteExcerpt,
  noteFormatSegments,
  sourceNoteColorKeys,
  updateNoteFormatSpansForTextChange,
} from '../src/features/notes/editor/noteFormat';
import { switchNoteScope } from '../src/domain/quran';

const span = {
  start: 2,
  end: 6,
  fontSize: 18,
  headingLevel: 0,
  isBold: true,
  isItalic: false,
  isUnderline: false,
  isStrike: false,
  textColorKey: 'mint',
};

test('note format span encoding keeps the Android delimiter and property order', () => {
  const encoded = '2,6,18,0,1,0,0,0,mint';
  assert.deepEqual(decodeNoteFormatSpans(encoded), [span]);
  assert.equal(encodeNoteFormatSpans([span]), encoded);
  assert.deepEqual(decodeNoteFormatSpans('bad;1,3,16,0,0,0,0,0,gold'), [
    {
      start: 1,
      end: 3,
      fontSize: 16,
      headingLevel: 0,
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrike: false,
      textColorKey: 'gold',
    },
  ]);
});

test('editing text shifts existing spans and applies active formatting to inserted text', () => {
  const active = {
    fontSize: 16,
    headingLevel: 0,
    isBold: false,
    isItalic: true,
    isUnderline: false,
    isStrike: false,
    textColorKey: 'gold',
    hasFormatting: true,
  };
  assert.deepEqual(updateNoteFormatSpansForTextChange('abcdef', 'abXcdef', [span], active), [
    { start: 2, end: 3, ...activeWithoutFlag(active) },
    { ...span, start: 3, end: 7 },
  ]);
  assert.deepEqual(noteFormatSegments('abcdefg', [{ ...span, start: 1, end: 4 }]), [
    { text: 'a' },
    { text: 'bcd', span: { ...span, start: 1, end: 4 } },
    { text: 'efg' },
  ]);
});

function activeWithoutFlag(active: {
  fontSize: number;
  headingLevel: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  textColorKey: string;
  hasFormatting: boolean;
}) {
  const { hasFormatting: _hasFormatting, ...style } = active;
  return style;
}

test('source formatting rejects partial integers and retains valid zero values before display clamping', () => {
  assert.deepEqual(decodeNoteFormatSpans('1x,3,16,0,0,0,0,0,gold'), []);
  assert.equal(decodeNoteFormatSpans('1,3,0,0,0,0,0,0,gold')[0]!.fontSize, 0);
  assert.equal(noteDisplayFontSize(28, 1), 34);
  assert.equal(noteDisplayFontSize(0, 0), 12);
  assert.equal(noteDisplayFontSize(16, 2), 21);
});
test('later source span styles override earlier overlap, including colors and reset flags', () => {
  const earlier = { ...span, start: 0, end: 6, textColorKey: 'green' };
  const later = { ...span, start: 2, end: 4, isBold: false, textColorKey: 'rose' };
  const segments = noteFormatSegments('abcdef', [earlier, later]);
  assert.equal(segments[1]!.text, 'cd');
  assert.equal(segments[1]!.span?.textColorKey, 'rose');
  assert.equal(segments[1]!.span?.isBold, false);
  assert.deepEqual(sourceNoteColorKeys, ['gold', 'white', 'green', 'blue', 'rose', 'violet']);
});
test('source TODO presentation and title fallback do not rewrite exported note text', () => {
  assert.equal(isTodoChecked('  [X] Remember'), true);
  assert.equal(isTodoChecked('[ ] Read'), false);
  assert.equal(cleanTodoLine('   [x] Read'), 'Read');
  const note = { title: '', note: '\n  [x] A first thought\n[ ] Another thought' };
  assert.equal(noteDisplayTitle(note, 'Surah'), 'A first thought');
  assert.equal(noteExcerpt(note), 'Another thought');
  assert.equal(note.note, '\n  [x] A first thought\n[ ] Another thought');
  assert.equal(noteDisplayTitle({ title: '', note: '\n ' }, 'Surah'), 'Surah');
});
test('source scope switches preserve the intended hierarchy instead of reusing unrelated numbers', () => {
  assert.deepEqual(switchNoteScope({ scope: 'juz', number: 30 }, 'hizb'), {
    scope: 'hizb',
    number: 59,
  });
  assert.deepEqual(switchNoteScope({ scope: 'rub', number: 238 }, 'juz'), {
    scope: 'juz',
    number: 30,
  });
  assert.deepEqual(switchNoteScope({ scope: 'hizb', number: 4 }, 'rub'), {
    scope: 'rub',
    number: 13,
  });
  assert.deepEqual(switchNoteScope({ scope: 'surah', number: 112 }, 'juz'), {
    scope: 'juz',
    number: 1,
  });
  assert.deepEqual(switchNoteScope({ scope: 'surah', number: 112 }, 'ayah'), {
    scope: 'ayah',
    number: 112,
    ayah: 1,
  });
  assert.deepEqual(switchNoteScope({ scope: 'ayah', number: 2, ayah: 255 }, 'surah'), {
    scope: 'surah',
    number: 2,
  });
});
