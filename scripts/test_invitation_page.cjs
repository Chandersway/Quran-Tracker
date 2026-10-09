const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const token = 'a'.repeat(64);
function page(href, languages = ['nl-NL'], failCopy = false) {
  const nodes = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m => [m[1], {}]));
  nodes.actions.hidden = true;
  const document = { documentElement: {}, getElementById: id => nodes[id] };
  const history = { replaceState: (_, __, value) => { history.url = value; } };
  const navigator = { languages, clipboard: { writeText: async value => {
    if (failCopy) throw new Error('denied');
    navigator.copied = value;
  } } };
  vm.runInNewContext(script, { URL, document, history, navigator, window: { location: { href } } });
  return { nodes, document, navigator, history };
}
(async () => {
  for (const lang of ['nl', 'en', 'ar']) {
    const p = page(`https://qurantracker-8f775.web.app/group/ABC-1234?invite=${token}&lang=${lang}`, ['en']);
    assert.equal(p.document.documentElement.lang, lang);
    assert.equal(p.document.documentElement.dir, lang === 'ar' ? 'rtl' : 'ltr');
    assert.equal(p.nodes.actions.hidden, false);
    assert.equal(new URL(p.nodes.open.href).searchParams.get('invite'), token);
    await p.nodes.copy.onclick();
    assert.equal(p.navigator.copied, 'ABC-1234');
    assert.ok(p.nodes.status.textContent.length > 0);
    p.nodes.language.onchange({ target: { value: 'ar' } });
    assert.equal(p.document.documentElement.dir, 'rtl');
    assert.equal(new URL(p.history.url).searchParams.get('invite'), token);
    assert.equal(new URL(p.history.url).searchParams.get('lang'), 'ar');
    assert.equal(new URL(p.nodes.open.href).searchParams.get('invite'), token);
  }
  assert.equal(page('https://example.test/group/ABC-1234', ['ar-SA']).document.documentElement.lang, 'ar');
  assert.equal(page('https://example.test/group/ABC-1234?lang=xx', ['fr']).document.documentElement.lang, 'en');
  for (const lang of ['nl', 'en', 'ar']) {
    const invalid = page(`https://example.test/group/ABC-1234?invite=bad&lang=${lang}`);
    assert.equal(invalid.nodes.actions.hidden, true);
    assert.ok(invalid.nodes.description.textContent.length > 0);
    const failed = page(`https://example.test/group/ABC-1234?lang=${lang}`, ['en'], true);
    await failed.nodes.copy.onclick();
    assert.ok(failed.nodes.status.textContent.length > 0);
  }
  console.log('Invitation page: NL/EN/AR, RTL, token retention, language fallback, invalid links and copy verified.');
})();
