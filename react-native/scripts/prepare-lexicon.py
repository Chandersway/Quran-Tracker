"""Build the independent, immutable QAC lexicon without changing original imports.

No downloading and no fuzzy matching. The original morphology input is copied
verbatim; every canonical ayah/word position must agree with the bundled Study
data, except the five explicitly pinned orthographic pairs below.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import sqlite3
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA256 = 'a1d12923815341face765083805d2148ed2d9f5cc3f7d6665219d887675d8c46'
BW = dict(zip(
    "'|>&<}AbptvjHxd*rzs$SDTZEg_fqklmnhwYyFNKaui~o`{^#:@\"[;,.!-+%]",
    [chr(int(code, 16)) for code in (
        '0621 0622 0623 0624 0625 0626 0627 0628 0629 062A 062B 062C 062D 062E '
        '062F 0630 0631 0632 0633 0634 0635 0636 0637 0638 0639 063A 0640 '
        '0641 0642 0643 0644 0645 0646 0647 0648 0649 064A 064B 064C 064D '
        '064E 064F 0650 0651 0652 0670 0671 0653 0654 06DC 06DF 06E0 '
        '06E2 06E3 06E5 06E6 06E8 06EA 06EB 06EC 06ED'
    ).split()]
))
BW[' '] = ' '  # The verbatim source includes spaces inside a few FORM fields.
BW['2'] = '2'  # Preserve the source's homograph suffix in lemma identifiers/display.
EXPECTED_VARIANTS = {
    (11, 13, 3): ('\u0627\u0641\u0652\u062a\u064e\u0631\u064e\u0627\u0647\u064f \u06d6', '\u0671\u0641\u0652\u062a\u064e\u0631\u064e\u0649\u0670\u0647\u064f'),
    (12, 39, 1): ('\u064a\u064e\u0640\u0670\u0635\u064e\u0640\u0670\u062d\u0650\u0628\u064e\u0649\u0650', '\u064a\u064e\u0670\u0635\u064e\u0649\u0670\u062d\u0650\u0628\u064e\u0649\u0650'),
    (12, 41, 1): ('\u064a\u064e\u0640\u0670\u0635\u064e\u0640\u0670\u062d\u0650\u0628\u064e\u0649\u0650', '\u064a\u064e\u0670\u0635\u064e\u0649\u0670\u062d\u0650\u0628\u064e\u0649\u0650'),
    (27, 26, 8): ('\u0671\u0644\u0652\u0639\u064e\u0638\u0650\u064a\u0645\u0650 \u06e9\u200f', '\u0671\u0644\u0652\u0639\u064e\u0638\u0650\u064a\u0645\u0650'),
    (80, 25, 1): ('\u0627\u064e\u0646\u0651\u064e\u0627', '\u0623\u064e\u0646\u0651\u064e\u0627'),
}


def arabic(value: str) -> str:
    unknown = set(value) - BW.keys()
    if unknown:
        raise ValueError(f'Unrecognized QAC Buckwalter characters: {sorted(unknown)}')
    return ''.join(BW[char] for char in value)


def normalize(value: str) -> str:
    # Preserve hamza seats, alif-maqsura/ya and ta-marbuta/ha distinctions.
    value = value.replace('\u0640\u0654', '\u0621').replace('\u0640\u0655', '\u0621')
    value = unicodedata.normalize('NFC', value).replace('\u0671', '\u0627')
    return re.sub('[\u0640\u064B-\u0652\u0670\u06D6-\u06ED\\s]', '', value)


def parse_corpus(text: str) -> dict:
    words = {}
    for line in text.splitlines():
        if not line.startswith('('):
            continue
        location, form, tag, features = line.split('\t')
        match = re.fullmatch(r'\((\d+):(\d+):(\d+):(\d+)\)', location)
        if not match:
            raise ValueError(f'Invalid QAC location: {location}')
        surah, ayah, word, segment = map(int, match.groups())
        row = words.setdefault((surah, ayah, word), {'form': '', 'roots': set(), 'lemmas': set(), 'segments': []})
        if segment != len(row['segments']) + 1:
            raise ValueError(f'Non-contiguous QAC segment: {location}')
        fields = dict(field.split(':', 1) for field in features.split('|') if ':' in field)
        root, lemma, pos = fields.get('ROOT'), fields.get('LEM'), fields.get('POS')
        if root:
            row['roots'].add(root)
        if lemma:
            row['lemmas'].add(lemma)
        row['form'] += form
        row['segments'].append((segment, form, arabic(form), tag, features, pos, root, lemma))
    return words


def load_study() -> tuple[dict, dict]:
    words, hashes = {}, {}
    chapters = json.loads((ROOT / 'src/content/generated/chapters.json').read_text(encoding='utf-8'))
    for surah in range(1, 115):
        path = ROOT / f'src/content/study-details/surah-{surah}.quran'
        hashes[path.relative_to(ROOT).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
        ayahs = json.loads(path.read_text(encoding='utf-8'))
        expected = chapters[surah - 1]['verseCount']
        if [row['number'] for row in ayahs] != list(range(1, expected + 1)):
            raise ValueError(f'Incomplete Study ayahs in surah {surah}')
        for ayah in ayahs:
            if [row['position'] for row in ayah['words']] != list(range(1, len(ayah['words']) + 1)):
                raise ValueError(f'Non-contiguous Study words in {surah}:{ayah["number"]}')
            for word in ayah['words']:
                words[(surah, ayah['number'], word['position'])] = word
    return words, hashes


def validate_alignment(corpus: dict, study: dict) -> dict:
    if len(corpus) != 77429 or set(corpus) != set(study):
        raise ValueError('QAC and Study must have identical 77,429 canonical word references')
    # Equality of reference sets also verifies every ayah's complete word count;
    # never shift words, match another ayah, or infer a root from similar text.
    variants = {}
    for reference, row in corpus.items():
        pair = (study[reference]['arabic'], arabic(row['form']))
        if normalize(pair[0]) != normalize(pair[1]):
            if EXPECTED_VARIANTS.get(reference) != pair:
                raise ValueError(f'Unapproved word alignment at {reference}: {pair!r}')
            variants[reference] = pair
        elif reference in EXPECTED_VARIANTS:
            raise ValueError(f'Expected pinned orthographic pair changed at {reference}')
    if variants != EXPECTED_VARIANTS:
        raise ValueError('Pinned orthographic variant set changed')
    return variants


SCHEMA = '''
PRAGMA foreign_keys=ON;
PRAGMA user_version=1;
CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE sources(id TEXT PRIMARY KEY,name TEXT NOT NULL,url TEXT NOT NULL,version TEXT NOT NULL,license TEXT NOT NULL,notice TEXT NOT NULL);
CREATE TABLE words(id INTEGER PRIMARY KEY,surah INTEGER NOT NULL,ayah INTEGER NOT NULL,word INTEGER NOT NULL,arabic TEXT NOT NULL,corpus_arabic TEXT NOT NULL,buckwalter TEXT NOT NULL,gloss TEXT NOT NULL,transliteration TEXT NOT NULL,normalized_study TEXT NOT NULL,normalized_corpus TEXT NOT NULL,alignment TEXT NOT NULL CHECK(alignment IN ('verified','orthographic-variant')),UNIQUE(surah,ayah,word));
CREATE TABLE roots(id TEXT PRIMARY KEY COLLATE BINARY,arabic TEXT NOT NULL,normalized TEXT NOT NULL);
CREATE TABLE lemmas(id TEXT PRIMARY KEY COLLATE BINARY,arabic TEXT NOT NULL,normalized TEXT NOT NULL);
CREATE TABLE word_roots(word_id INTEGER NOT NULL REFERENCES words(id),root_id TEXT NOT NULL REFERENCES roots(id),PRIMARY KEY(word_id,root_id));
CREATE TABLE word_lemmas(word_id INTEGER NOT NULL REFERENCES words(id),lemma_id TEXT NOT NULL REFERENCES lemmas(id),PRIMARY KEY(word_id,lemma_id));
CREATE TABLE segments(word_id INTEGER NOT NULL REFERENCES words(id),segment INTEGER NOT NULL,form TEXT NOT NULL,arabic TEXT NOT NULL,tag TEXT NOT NULL,features TEXT NOT NULL,pos TEXT,root_id TEXT,lemma_id TEXT,PRIMARY KEY(word_id,segment));
CREATE TABLE ayah_counts(surah INTEGER NOT NULL,ayah INTEGER NOT NULL,word_count INTEGER NOT NULL,PRIMARY KEY(surah,ayah));
CREATE INDEX root_occurrences ON word_roots(root_id,word_id);
CREATE INDEX lemma_occurrences ON word_lemmas(lemma_id,word_id);
CREATE INDEX root_normalized ON roots(normalized);
CREATE INDEX lemma_normalized ON lemmas(normalized);
'''


def build(input_path: Path, output: Path) -> dict:
    raw = input_path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != SOURCE_SHA256:
        raise ValueError('Morphology input bytes differ from the pinned, verbatim QAC 0.4 source')
    text = raw.decode('utf-8-sig')
    notice = text[:text.index('LOCATION\tFORM\tTAG\tFEATURES')]
    corpus = parse_corpus(text)
    study, hashes = load_study()
    variants = validate_alignment(corpus, study)
    roots = sorted({value for row in corpus.values() for value in row['roots']})
    lemmas = sorted({value for row in corpus.values() for value in row['lemmas']})
    if len(roots) != 1642 or len(lemmas) != 4832:
        raise ValueError(f'Unexpected annotation counts: {len(roots)} roots / {len(lemmas)} lemmas')
    output.parent.mkdir(parents=True, exist_ok=True)
    temp = output.with_suffix('.building')
    if temp.exists():
        temp.unlink()
    db = sqlite3.connect(temp)
    try:
        db.executescript(SCHEMA)
        db.executemany('INSERT INTO sources VALUES(?,?,?,?,?,?)', [
            ('qac', 'Quranic Arabic Corpus', 'https://corpus.quran.com', '0.4', 'GNU General Public License; Tanzil text CC BY-ND 3.0', notice),
            ('study', 'Original bundled word-by-word data', '', 'original Android assets', 'Original asset attribution not specified in the word-by-word files', 'English contextual glosses and transliterations are preserved verbatim from the original Android word_by_word_surah_*.json assets. They are contextual translations, not dictionary definitions.'),
        ])
        db.executemany('INSERT INTO roots VALUES(?,?,?)', [(value, arabic(value), normalize(arabic(value))) for value in roots])
        db.executemany('INSERT INTO lemmas VALUES(?,?,?)', [(value, arabic(value), normalize(arabic(value))) for value in lemmas])
        ayah_counts = {}
        for identifier, (reference, row) in enumerate(sorted(corpus.items()), 1):
            surah, ayah, word = reference
            original = study[reference]
            surface = arabic(row['form'])
            alignment = 'orthographic-variant' if reference in variants else 'verified'
            db.execute('INSERT INTO words VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', (identifier, surah, ayah, word, original['arabic'], surface, row['form'], original['translation'], original['transliteration'], normalize(original['arabic']), normalize(surface), alignment))
            db.executemany('INSERT INTO word_roots VALUES(?,?)', [(identifier, value) for value in sorted(row['roots'])])
            db.executemany('INSERT INTO word_lemmas VALUES(?,?)', [(identifier, value) for value in sorted(row['lemmas'])])
            db.executemany('INSERT INTO segments VALUES(?,?,?,?,?,?,?,?,?)', [(identifier, *segment) for segment in row['segments']])
            ayah_counts[(surah, ayah)] = ayah_counts.get((surah, ayah), 0) + 1
        db.executemany('INSERT INTO ayah_counts VALUES(?,?,?)', [(s, a, count) for (s, a), count in sorted(ayah_counts.items())])
        summary = {'schemaVersion': 1, 'words': len(study), 'ayahs': len(ayah_counts), 'roots': len(roots), 'lemmas': len(lemmas), 'segments': sum(len(row['segments']) for row in corpus.values()), 'verified': len(study) - len(variants), 'orthographicVariants': [{'reference': {'surah': ref[0], 'ayah': ref[1], 'word': ref[2]}, 'study': pair[0], 'corpus': pair[1]} for ref, pair in sorted(variants.items())], 'inputSha256': SOURCE_SHA256, 'studySha256': hashes, 'normalization': 'NFC; wasla-to-alif; remove tatweel/vowels/Quran marks/whitespace; preserve hamza seats and letter distinctions', 'decoder': 'Official extended Buckwalter table https://corpus.quran.com/java/buckwalter.jsp'}
        db.execute('INSERT INTO metadata VALUES(?,?)', ('manifest', json.dumps(summary, ensure_ascii=False, separators=(',', ':'))))
        db.commit()
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok' or db.execute('PRAGMA foreign_key_check').fetchall():
            raise ValueError('Generated database integrity check failed')
        db.execute('VACUUM')
    finally:
        db.close()
    temp.replace(output)
    (output.parent / 'QAC-NOTICE.txt').write_bytes(notice.encode('utf-8'))
    raw_copy = ROOT / 'data/lexicon/quranic-corpus-morphology-0.4.txt'
    raw_copy.parent.mkdir(parents=True, exist_ok=True)
    if input_path.resolve() != raw_copy.resolve():
        shutil.copyfile(input_path, raw_copy)
    summary['databaseSha256'] = hashlib.sha256(output.read_bytes()).hexdigest()
    (output.parent / 'provenance.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return summary


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    default_input = ROOT / 'data/lexicon/quranic-corpus-morphology-0.4.txt'
    if not default_input.exists():
        default_input = ROOT / '.tooling/lexicon-sources/quranic-corpus-morphology-0.4.txt'
    parser.add_argument('--input', type=Path, default=default_input)
    parser.add_argument('--output', type=Path, default=ROOT / 'assets/lexicon/qac-0.4.db')
    args = parser.parse_args()
    result = build(args.input, args.output)
    print(json.dumps({key: result[key] for key in ['words', 'ayahs', 'roots', 'lemmas', 'segments', 'verified', 'databaseSha256']}))
