import newUiCopy from '../src/i18n/new-ui-copy.json';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readingUnitLabelKey } from '../src/domain/readingUnit';
import { readingStreakText } from '../src/i18n/readingStreak';
import {
  formatSource,
  hasAllLocaleEntries,
  hasArabicLocaleEntries,
  resolveLocale,
  sourceCatalog,
  translate,
  translateTemplate,
} from '../src/i18n';

test('locale resolver only accepts supported language codes', () => {
  assert.equal(resolveLocale('nl'), 'nl');
  assert.equal(resolveLocale('ar'), 'ar');
  assert.equal(resolveLocale('fr'), 'en');
  assert.equal(resolveLocale(undefined), 'en');
});

test('stored reading units have complete labels, and a single reading day uses a singular phrase', () => {
  for (const unit of ['ayah', 'ayahs', 'page', 'pages', 'surah', 'hizb', 'rub', 'juz', 'minutes']) {
    const key = readingUnitLabelKey(unit);
    for (const locale of ['nl', 'en', 'ar'] as const)
      assert.notEqual(translate(key, locale), key, `${unit}/${locale}`);
    assert.match(translate(key, 'ar'), /[\u0600-\u06ff]/, unit);
  }
  assert.equal(readingStreakText(1, 'nl'), '1 dag op rij');
  assert.equal(readingStreakText(2, 'nl'), '2 dagen op rij');
  assert.equal(readingStreakText(1, 'en'), '1 day in a row');
  assert.match(readingStreakText(2, 'ar'), /^يومان/);
  assert.match(readingStreakText(3, 'ar'), /أيام/);
});

test('every dictionary entry has complete localized copy with Arabic script', () => {
  assert.equal(hasAllLocaleEntries(), true);
  assert.equal(hasArabicLocaleEntries(), true);
});

test('Arabic reading streaks preserve every whole-day plural form without Intl.PluralRules', () => {
  const rules = new Intl.PluralRules('ar');
  const expected = Array.from({ length: 401 }, (_, days) => {
    const number = days.toLocaleString('ar');
    return {
      zero: 'لم تبدأ سلسلة القراءة بعد',
      one: 'يوم واحد من القراءة المتواصلة',
      two: 'يومان من القراءة المتواصلة',
      few: `${number} أيام متتالية من القراءة`,
      many: `${number} يومًا متتاليًا من القراءة`,
      other: `${number} يوم من القراءة المتواصلة`,
    }[rules.select(days)];
  });
  const original = Object.getOwnPropertyDescriptor(Intl, 'PluralRules');
  assert.ok(original);
  try {
    Object.defineProperty(Intl, 'PluralRules', { value: undefined, configurable: true });
    expected.forEach((phrase, days) => assert.equal(readingStreakText(days, 'ar'), phrase));
  } finally {
    Object.defineProperty(Intl, 'PluralRules', original);
  }
});

test('translation is exact and leaves Quran and user supplied text untouched', () => {
  const QuranText = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
  const userNote = 'Today';
  assert.equal(translate(QuranText, 'nl'), QuranText);
  assert.equal(translate(userNote, 'en'), userNote);
  assert.equal(translate('A title from a user', 'ar'), 'A title from a user');
  assert.equal(translate('Today', 'nl'), 'Vandaag');
});

test('dynamic copy translates only its fixed template and substitutes values', () => {
  assert.equal(translateTemplate('Read {count} times', 'nl', { count: 3 }), '3x gelezen');
  assert.equal(formatSource('common.countOfTotal', 'ar', [3, 10]), '3 من 10');
});

test('curated source wording replaces invented migration slogans in every locale', () => {
  assert.equal(translate('Less noise. More presence.', 'nl'), 'Focus / Leessessie');
  assert.equal(translate('Less noise. More presence.', 'ar'), 'جلسة تركيز');
  assert.equal(translate('Circle', 'ar'), 'المجموعات');
  assert.equal(translate('app.surah', 'ar'), 'السور');
  assert.equal(
    translate('onboarding.planning.description', 'nl'),
    'Plan wat je wilt lezen of herhalen. Kies een datum en stel eventueel een herinnering in.',
  );
});

test('all extracted values retain a source path and line, and unknown copy stays visible', () => {
  for (const row of Object.values(sourceCatalog))
    for (const language of Object.keys(row.values) as (keyof typeof row.values)[]) {
      assert.ok(row.provenance[language]?.path.startsWith('app/'));
      assert.ok((row.provenance[language]?.line ?? 0) > 0);
    }
  assert.equal(translate('Unreviewed RN-only sentence.', 'ar'), 'Unreviewed RN-only sentence.');
});

test('new functional copy has an explicit namespace and uses the same formatter', () => {
  assert.equal(translate('ui.groups.rules', 'nl'), 'Groepsregels');
  assert.equal(formatSource('ui.groups.ruleVersion', 'ar', [3]), 'الإصدار 3');
});

test('explicit RN functional copy has complete UTF-8 locales and no lost Arabic characters', () => {
  for (const [key, row] of Object.entries(newUiCopy.entries)) {
    assert.match(row.ar, /[\u0600-\u06ff]/, key);
    assert.ok(row.en.trim() && row.nl.trim(), key);
    assert.ok(!/\?{2,}/.test(row.ar), key);
  }
});

test('reader jump uses its own complete labels while repeat preserves source selection wording', () => {
  assert.equal(translate('ui.reader.jumpToAyah', 'nl'), 'Ga naar aya');
  assert.equal(translate('repeat.from', 'nl'), 'Vanaf ayah');
  assert.notEqual(translate('ui.reader.jumpToAyah', 'ar'), translate('repeat.from', 'ar'));
  assert.equal(formatSource('ui.reader.ayahNumberRange', 'nl', [142, 252]), 'Aya (142–252)');
  for (const locale of ['en', 'nl', 'ar'] as const) {
    const invalid = formatSource('ui.reader.ayahRangeInvalid', locale, [142, 252]);
    assert.ok(invalid.includes('142') && invalid.includes('252'));
    assert.ok(!invalid.includes('%'));
    assert.equal(translate('repeat.title', locale), sourceCatalog['repeat.title']!.values[locale]);
    assert.equal(translate('repeat.start', locale), sourceCatalog['repeat.start']!.values[locale]);
  }
});
