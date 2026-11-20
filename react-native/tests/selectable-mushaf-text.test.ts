import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSelectableMushafPage, type SourceMushafVerse } from '../src/domain/selectableMushaf';
import {
  SELECTABLE_BASMALLAH,
  fitSelectablePageText,
  selectablePageLayoutKey,
  selectablePageText,
} from '../src/domain/selectableMushafText';

test('the actual native warm-entry float values retain the requested fit at the same physical size', () => {
  const density = 2.625;
  const windowKey = selectablePageLayoutKey(50, 381.42857142857144, 560.7, 0, density);
  const measuredKey = selectablePageLayoutKey(50, 381.4285583496094, 560.6999807739257, 0, density);
  const requestedFit = { signature: windowKey, scale: 0.92 };
  assert.equal(measuredKey, requestedFit.signature);
  assert.equal(requestedFit.signature === measuredKey ? requestedFit.scale : 1, 0.92);
});

test('physical size, rotation, density, source page and explicit retry invalidate page fit identity', () => {
  const key = selectablePageLayoutKey(50, 381.42857142857144, 560.7, 0, 2.625);
  for (const next of [
    selectablePageLayoutKey(50, 382, 560.7, 0, 2.625),
    selectablePageLayoutKey(50, 560.7, 381.42857142857144, 0, 2.625),
    selectablePageLayoutKey(50, 381.42857142857144, 560.7, 0, 3),
    selectablePageLayoutKey(604, 381.42857142857144, 560.7, 0, 2.625),
    selectablePageLayoutKey(50, 381.42857142857144, 560.7, 1, 2.625),
  ])
    assert.notEqual(next, key);
});

/** Synthetic layout fixture; never bundled as Quran content. */
function sourceWord(id: number, line: number, text = 'كَلِمَةٌ') {
  return {
    id,
    position: id,
    page_number: 50,
    line_number: line,
    char_type_name: 'word' as const,
    text_qpc_hafs: text,
    text_uthmani: text,
  };
}
function fullPage() {
  const verses: SourceMushafVerse[] = [
    {
      verse_key: '3:17',
      words: Array.from({ length: 30 }, (_, index) =>
        sourceWord(index + 1, Math.floor(index / 2) + 1),
      ),
    },
  ];
  return buildSelectableMushafPage(50, verses, (reference) => ({ status: 'verified', reference }));
}
function measured(texts: readonly string[], width = 200) {
  return texts.map((text, index) => ({
    text: text + (index < texts.length - 1 ? '\n' : ''),
    width,
  }));
}

test('one page selection buffer retains all fifteen prescribed lines and global UTF16 token offsets', () => {
  const source = fullPage();
  const before = JSON.stringify(source);
  const page = selectablePageText(source, () => 'البقرة');
  assert.equal(page.lines.length, 15);
  assert.equal(page.text.split('\n').length, 15);
  assert.equal(page.text, source.lines.map((line) => line.text).join('\n'));
  for (const line of page.lines) {
    assert.equal(page.text.slice(line.start, line.end), line.text);
    assert.equal(line.parts.map((part) => part.text).join(''), line.text);
    for (const part of line.parts) {
      assert.equal(page.text.slice(part.start, part.end), part.text);
      if (part.token) {
        assert.equal(part.token.alignment.status, 'verified');
        assert.equal(
          part.token,
          source.lines[line.number - 1]!.tokens.find((word) => word.id === part.token!.id),
        );
      }
    }
  }
  assert.equal(JSON.stringify(source), before, 'page construction must not mutate publisher data');
});

test('Select All includes exact heading/basmallah and retains empty source line slots', () => {
  const source = buildSelectableMushafPage(50, [{ verse_key: '3:1', words: [sourceWord(1, 3)] }]);
  const page = selectablePageText(source, () => 'آل عمران');
  assert.equal(page.lines[0]!.text, 'آل عمران');
  assert.equal(page.lines[1]!.text, SELECTABLE_BASMALLAH);
  assert.equal(page.lines[2]!.text, 'كَلِمَةٌ');
  assert.equal(page.lines[14]!.text, '');
  assert.equal(
    page.text,
    ['آل عمران', SELECTABLE_BASMALLAH, 'كَلِمَةٌ', ...Array<string>(12).fill('')].join('\n'),
  );
  assert.equal(page.text.split('\n').length, 15);
});

test('a selection crossing two lines contains whole Arabic words, marks and a real newline', () => {
  const source = fullPage();
  const first = source.lines[0]!;
  const second = source.lines[1]!;
  first.text = 'قَيُّومٌ عَلَيْهِمْ';
  first.tokens[0] = { ...first.tokens[0]!, text: 'قَيُّومٌ', start: 0, end: 'قَيُّومٌ'.length };
  first.tokens[1] = {
    ...first.tokens[1]!,
    text: 'عَلَيْهِمْ',
    start: 'قَيُّومٌ '.length,
    end: first.text.length,
  };
  second.text = 'آيَةٌ رَحْمَةٌ';
  second.tokens[0] = { ...second.tokens[0]!, text: 'آيَةٌ', start: 0, end: 'آيَةٌ'.length };
  second.tokens[1] = {
    ...second.tokens[1]!,
    text: 'رَحْمَةٌ',
    start: 'آيَةٌ '.length,
    end: second.text.length,
  };
  const page = selectablePageText(source, () => '');
  const start = page.lines[0]!.parts.find((part) => part.token?.id === 2)!.start;
  const end = page.lines[1]!.parts.find((part) => part.token?.id === 3)!.end;
  assert.equal(page.text.slice(start, end), 'عَلَيْهِمْ\nآيَةٌ');
  assert.equal(
    page.lines[0]!.parts.find((part) => part.token?.id === 2)!.token!.alignment.status,
    'verified',
  );
});

test('invalid publisher line slots and token offsets are rejected instead of silently rearranged', () => {
  const source = fullPage();
  assert.throws(
    () => selectablePageText({ ...source, lines: source.lines.slice(1) }, () => ''),
    /prescribed/,
  );
  source.lines[0]!.tokens[0]!.end++;
  assert.throws(() => selectablePageText(source, () => ''), /offsets/);
});

test('native layout is verified only when every source line and its width agree', () => {
  const page = selectablePageText(fullPage(), () => '');
  const lines = measured(page.lines.map((line) => line.text));
  assert.deepEqual(fitSelectablePageText(page, lines, 200, 1), { status: 'verified', scale: 1 });
  assert.deepEqual(fitSelectablePageText(page, lines, 199, 0.8), {
    status: 'verified',
    scale: 0.8,
  });
  const wrong = [...lines];
  wrong[4] = { text: 'different source text', width: 200 };
  assert.equal(fitSelectablePageText(page, wrong, 200, 1).status, 'resize');
});

test('wrapped or too-wide native text reduces font size without capping or dropping lines', () => {
  const page = selectablePageText(fullPage(), () => '');
  const lines = measured(page.lines.map((line) => line.text));
  const wrapped = [...lines.slice(0, 3), { text: 'continuation', width: 100 }, ...lines.slice(3)];
  const next = fitSelectablePageText(page, wrapped, 200, 1);
  assert.equal(next.status, 'resize');
  assert.ok(next.scale < 1 && next.scale >= 0.35);
  assert.equal(wrapped.length, 16, 'overflow remains in the native buffer');
  assert.equal(
    fitSelectablePageText(
      page,
      measured(
        page.lines.map((line) => line.text),
        240,
      ),
      200,
      1,
    ).status,
    'resize',
  );
});

test('unmeasurable or persistently wrapped text expands rather than falsely claiming fifteen lines', () => {
  const page = selectablePageText(fullPage(), () => '');
  assert.deepEqual(fitSelectablePageText(page, [], 200, 1), { status: 'expanded', scale: 1 });
  assert.deepEqual(fitSelectablePageText(page, [{ text: '', width: NaN }], 200, 1), {
    status: 'expanded',
    scale: 1,
  });
  assert.deepEqual(fitSelectablePageText(page, [{ text: page.text, width: 500 }], 200, 0.35), {
    status: 'expanded',
    scale: 0.35,
  });
  assert.equal(page.text.split('\n').length, 15);
});
