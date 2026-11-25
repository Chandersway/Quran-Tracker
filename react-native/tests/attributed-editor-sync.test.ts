import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAttributedEditorSync,
  recordNativeEditorText,
  reconcileAttributedEditor,
  type AttributedEditorModel,
} from '../src/features/notes/editor/attributedEditorSync';

const model = (text = '', formatSpans = '', styleKey = 'plain'): AttributedEditorModel => ({
  text,
  formatSpans,
  styleKey,
});

test('native keystroke echoes never rewrite the attributed child tree during typing', () => {
  const initial = model();
  const sync = createAttributedEditorSync(initial);
  for (const text of ['r', 're', 'rea', 'read', 'readi', 'readin', 'reading']) {
    recordNativeEditorText(sync, text);
    assert.equal(reconcileAttributedEditor(sync, model(text), true), initial);
  }
  assert.equal(sync.nativeText, 'reading');
  assert.equal(reconcileAttributedEditor(sync, model('reading'), false).text, 'reading');
});

test('batched stale React acknowledgements cannot replace a newer native composition', () => {
  const initial = model();
  const sync = createAttributedEditorSync(initial);
  recordNativeEditorText(sync, 'r');
  recordNativeEditorText(sync, 're');
  assert.equal(reconcileAttributedEditor(sync, model('r', 'span-r'), true), initial);
  recordNativeEditorText(sync, 'reading');
  assert.equal(reconcileAttributedEditor(sync, model('re', 'span-re'), true), initial);
  assert.equal(reconcileAttributedEditor(sync, model('reading', 'span-reading'), true), initial);
  assert.equal(sync.nativeText, 'reading');
  assert.deepEqual(sync.pendingNativeTexts, []);
});

test('explicit formatting rebuilds the latest full presentation without losing stored spans', () => {
  const sync = createAttributedEditorSync(model());
  recordNativeEditorText(sync, 'reading');
  reconcileAttributedEditor(sync, model('reading', '0,7,16,0,false,false,false,false,gold'), true);
  const spans = '0,3,16,0,true,false,false,false,blue;3,7,16,0,false,true,false,false,gold';
  const formatted = reconcileAttributedEditor(sync, model('reading', spans, 'bold'), true);
  assert.equal(formatted.text, 'reading');
  assert.equal(formatted.formatSpans, spans);
  recordNativeEditorText(sync, 'reading!');
  assert.equal(reconcileAttributedEditor(sync, model('reading!', spans, 'bold'), true), formatted);
});

test('external text replacement and clear remain authoritative rather than becoming native echoes', () => {
  const sync = createAttributedEditorSync(model('first note', 'first spans'));
  const second = model('second note', 'second spans');
  assert.equal(reconcileAttributedEditor(sync, second, true), second);
  const empty = model();
  assert.equal(reconcileAttributedEditor(sync, empty, true), empty);
  assert.equal(sync.nativeText, '');
  assert.deepEqual(sync.pendingNativeTexts, []);
});

test('blur refresh preserves Unicode composition and the exact source span serialization', () => {
  const sync = createAttributedEditorSync(model());
  const composed =
    '\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064a\u0643\u0645 \ud83c\udf19';
  for (const text of ['\u0627', '\u0627\u0644', composed]) {
    recordNativeEditorText(sync, text);
    reconcileAttributedEditor(sync, model(text, 'original;span;bytes'), true);
  }
  const final = reconcileAttributedEditor(sync, model(composed, 'original;span;bytes'), false);
  assert.equal(final.text, composed);
  assert.equal(final.formatSpans, 'original;span;bytes');
});

test('native delete/replace returning to the same string does not reapply composing spans', () => {
  const initial = model('ab', 'old spans');
  const sync = createAttributedEditorSync(initial);
  recordNativeEditorText(sync, 'a');
  recordNativeEditorText(sync, 'ab');
  assert.equal(reconcileAttributedEditor(sync, model('ab', 'new spans'), true), initial);
  const final = reconcileAttributedEditor(sync, model('ab', 'new spans'), false);
  assert.equal(final.formatSpans, 'new spans');
});
