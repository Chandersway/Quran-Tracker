"""Build the Warsh -> app (Hafs) reference bridge, never a constant offset.

Input: https://quran-json.risanb.com/text/warsh/quran.json
Only references are emitted; the app's existing text/word datasets are unchanged.
"""
import argparse
import hashlib
import json
import sqlite3
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    raw = args.source.read_bytes()
    chapters = json.loads(raw)
    geometry = json.loads((root / 'app/src/main/assets/warsh_maknoon_positions.json').read_text())
    drawn = {(s[0], s[1]) for p in geometry.values() for s in p['segments']}
    with sqlite3.connect(f'file:{root / "app/src/main/assets/Quraan.db"}?mode=ro', uri=True) as db:
        known = set(db.execute('SELECT SURA_num, AYA_num FROM [ALL]'))
    mapping = {}
    assert len(chapters) == 114
    for chapter in chapters:
        surah = chapter['id']
        verses = chapter['verses']
        assert [v['id'] for v in verses] == list(range(1, len(verses) + 1))
        refs = [v['number_in_hafs'] for v in verses]
        assert all(r and r == sorted(set(r)) for r in refs)
        assert all((surah, a) in known for r in refs for a in r)
        assert all(a[0] <= b[0] for a, b in zip(refs, refs[1:]))
        mapping[str(surah)] = refs
    assert drawn == {(int(s), a) for s, refs in mapping.items() for a in range(1, len(refs) + 1)}
    assert len(drawn) == 6214
    # Independent regression anchors: the shift changes within Al-Baqarah.
    assert mapping['2'][0] == [1, 2]
    assert mapping['2'][4] == [6]
    assert mapping['2'][199] == [202]
    assert mapping['2'][284] == [286]
    output = {
        'source': 'https://quran-json.risanb.com/text/warsh/quran.json',
        'source_sha256': hashlib.sha256(raw).hexdigest(),
        'license': 'CC-BY-SA-4.0; Quran JSON / Quranpedia.net (KFGQPC Warsh)',
        'chapters': mapping,
    }
    args.output.write_text(json.dumps(output, separators=(',', ':')), encoding='utf-8')
    print('Validated all 6214 Warsh references against all 604 pages and the app database.')


if __name__ == '__main__':
    main()
