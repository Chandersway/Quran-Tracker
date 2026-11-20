import assert from 'node:assert/strict';
import test from 'node:test';
import { createReaderChromeOwners } from '../src/app/providers/readerChromeOwners';

test('retained original, temporary selection and text reader cleanup cannot release another focused reader', () => {
  const chrome = createReaderChromeOwners();
  const original = Symbol('original PDF'),
    selection = Symbol('selection'),
    text = Symbol('text');
  assert.equal(chrome(original, true), true);
  assert.equal(chrome(selection, true), true);
  assert.equal(
    chrome(original, false),
    true,
    'late blur of the retained original preserves selection fullscreen',
  );
  assert.equal(chrome(text, true), true);
  assert.equal(
    chrome(selection, false),
    true,
    'replace with text then cleanup preserves text fullscreen',
  );
  assert.equal(chrome(original, true), true);
  assert.equal(chrome(text, false), true, 'pop then late cleanup preserves original fullscreen');
  assert.equal(chrome(selection, false), true, 'duplicate cleanup is harmless');
  assert.equal(
    chrome(original, false),
    false,
    'lexicon or normal navigation restores the app chrome',
  );
});
