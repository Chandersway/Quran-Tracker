"""Build offline rub starts from a pinned quran-meta snapshot.

--fetch obtains the three source files; subsequent builds need no network.
--check validates reproducibility without changing app assets.
Printed Warsh references remain explicit: never navigate by a constant offset.
"""
import argparse
import hashlib
import json
import re
import sqlite3
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'app/src/main/assets'
SNAPSHOT = ROOT / 'scripts/data/rub-source'
REVISION = '3b7afc7f8c905da3d8fb3e8725f86805bd76b2bd'
BASE = f'https://raw.githubusercontent.com/quran-center/quran-meta/{REVISION}/'
FILES = {'HafsLists.ts': 'src/lists/HafsLists.ts',
         'WarshLists.ts': 'src/lists/WarshLists.ts', 'LICENSE': 'LICENSE'}


def array(source, name):
    match = re.search(r'export const ' + name + r'[^=]*=\s*\[(.*?)\]', source, re.S)
    if not match:
        raise ValueError(f'Missing {name}')
    body = re.sub(r'//[^\n]*', '', match[1])
    if re.search(r'[^\s,\d]', body):
        raise ValueError(f'Unexpected syntax in {name}')
    return [int(x) for x in re.findall(r'\d+', body)]


def query(file, sql):
    with sqlite3.connect(file.as_uri() + '?mode=ro', uri=True) as db:
        return db.execute(sql).fetchall()


def build():
    bridge = json.loads((ASSETS / 'warsh_ayah_map.json').read_text(encoding='utf-8'))['chapters']
    hafs_refs = query(ASSETS / 'Quraan.db', 'SELECT SURA_num, AYA_num FROM [ALL] ORDER BY 1,2')
    warsh_refs = [(s, a) for s in range(1, 115) for a in range(1, len(bridge[str(s)]) + 1)]
    assert len(hafs_refs) == 6236 and len(set(hafs_refs)) == 6236
    assert len(warsh_refs) == 6214
    pages = {'hafs': {}, 'warsh': {}}
    for p, s, a in query(ASSETS / 'hafs_ayahinfo_1260.db',
            'SELECT DISTINCT page_number, sura_number, ayah_number FROM glyphs ORDER BY 1,2,3'):
        pages['hafs'].setdefault((s, a), []).append(p)
    geometry = json.loads((ASSETS / 'warsh_maknoon_positions.json').read_text(encoding='utf-8'))
    for p, data in sorted(geometry.items(), key=lambda pair: int(pair[0])):
        for s, a in sorted({tuple(segment[:2]) for segment in data['segments']}):
            pages['warsh'].setdefault((s, a), []).append(int(p))
    old = (ROOT / 'app/src/main/java/com/Ameender/qurantracker/data/HizbData.kt').read_text(encoding='utf-8')
    old_hizb = {int(n): (int(s), int(a)) for n, s, a in re.findall(
        r'HizbInfo\((\d+),\s*"[^"\n]*",\s*(\d+),\s*(\d+),', old)}
    assert len(old_hizb) == 60
    output = {'schemaVersion': 1, 'source': {'project': 'quran-center/quran-meta',
        'revision': REVISION, 'license': 'MIT; see rub_starts.LICENSE.txt',
        'files': {name: {'url': BASE + path, 'sha256': hashlib.sha256((SNAPSHOT / name).read_bytes()).hexdigest()}
                  for name, path in FILES.items()}},
        'scope': ['hafs_ayahinfo_1260', 'warsh_maknoon'],
        'validation': 'Reference existence is NOT proof of correct rub boundaries. See editionStatus before use.',
        'editionStatus': {
            'hafs': {'status': 'structurally_validated', 'visualVerificationComplete': False},
            'warsh': {'status': 'quarantined_source_conflicts', 'readyForNavigation': False,
                      'reason': 'Source quarter starts disagree with app text bridge; do not wire into navigation'}},
        'editions': {}}
    report = {'existingHizbDifferences': [], 'crossEditionDifferences': [], 'multiplePageStarts': []}
    for edition, refs, filename in [('hafs', hafs_refs, 'HafsLists.ts'), ('warsh', warsh_refs, 'WarshLists.ts')]:
        source = (SNAPSHOT / filename).read_text(encoding='utf-8')
        # Verify that global verse IDs in the source use the same surah counts as app data.
        surahs = re.findall(r'^\s*\[(\d+),\s*(\d+),\s*\d+,\s*\d+,\s*"[^"\n]+"', source, re.M)
        assert len(surahs) == 114, f'{edition}: unexpected surah table'
        for s, (start, count) in enumerate(surahs, 1):
            chapter_refs = [r for r in refs if r[0] == s]
            assert refs[int(start)-1] == (s, 1)
            assert len(chapter_refs) == int(count)
        boundaries = array(source, 'HizbQuarterList')
        assert len(boundaries) == 242 and boundaries[0] == 0 and boundaries[1] == 1
        assert boundaries[-1] == len(refs) + 1
        assert all(a < b for a, b in zip(boundaries, boundaries[1:]))
        entries = []
        for number, verse_id in enumerate(boundaries[1:-1], 1):
            s, a = refs[verse_id - 1]
            page_candidates = pages[edition].get((s, a), [])
            assert page_candidates and all(1 <= p <= 604 for p in page_candidates)
            canonical = bridge[str(s)][a-1] if edition == 'warsh' else [a]
            assert all((s, h) in pages['hafs'] for h in canonical)
            entry = {'id': number, 'hizb': (number-1)//4+1, 'quarter': (number-1)%4+1,
                     'surah': s, 'ayah': a, 'page': page_candidates[0],
                     'pageCandidates': page_candidates, 'appAyahs': canonical}
            entries.append(entry)
            if len(page_candidates) > 1:
                report['multiplePageStarts'].append({'edition': edition, **entry})
            if entry['quarter'] == 1 and old_hizb[entry['hizb']] not in [(s, h) for h in canonical]:
                report['existingHizbDifferences'].append({'edition': edition, 'hizb': entry['hizb'],
                    'existing': old_hizb[entry['hizb']], 'sourcePrinted': [s, a], 'sourceAppAyahs': canonical})
        assert len(entries) == 240
        output['editions'][edition] = entries
    for h, w in zip(output['editions']['hafs'], output['editions']['warsh']):
        if h['surah'] != w['surah'] or h['ayah'] not in w['appAyahs']:
            report['crossEditionDifferences'].append({'id': h['id'], 'hafs': [h['surah'], h['ayah']],
                'warsh': [w['surah'], w['ayah']], 'warshAppAyahs': w['appAyahs']})
    # Alternative candidates, not silent corrections. Shared textual boundaries may
    # fall within a printed Warsh verse; retain all candidates for manual review.
    report['hafsAlignedWarshCandidates'] = []
    for h in output['editions']['hafs']:
        s, a = h['surah'], h['ayah']
        candidates = [{'ayah': w, 'appAyahs': linked, 'pages': pages['warsh'][(s, w)]}
                      for w, linked in enumerate(bridge[str(s)], 1) if a in linked]
        assert candidates, f'No Warsh candidate for Hafs {s}:{a}'
        report['hafsAlignedWarshCandidates'].append({'id': h['id'], 'surah': s,
            'hafsAyah': a, 'candidates': candidates, 'approved': False})
    # Stable anchors in source numbering. A changed upstream source cannot silently shift these.
    assert [(r['surah'], r['ayah']) for r in output['editions']['hafs'][:4]] == [(1,1), (2,26), (2,44), (2,60)]
    assert output['editions']['hafs'][-1]['surah'] == 100
    return output, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.fetch:
        SNAPSHOT.mkdir(parents=True, exist_ok=True)
        for name, path in FILES.items():
            with urllib.request.urlopen(BASE + path, timeout=30) as response:
                (SNAPSHOT / name).write_bytes(response.read())
    data, report = build()
    target = ASSETS / 'rub_starts.json'
    serialized = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    license_text = 'quran-meta snapshot ' + REVISION + '\n' + BASE + '\n\n' + (SNAPSHOT / 'LICENSE').read_text(encoding='utf-8')
    if args.check:
        assert target.read_text(encoding='utf-8') == serialized, 'Asset is stale or modified'
        assert (ASSETS / 'rub_starts.LICENSE.txt').read_text(encoding='utf-8') == license_text
    else:
        target.write_text(serialized, encoding='utf-8')
        (ASSETS / 'rub_starts.LICENSE.txt').write_text(license_text, encoding='utf-8')
    destination = ROOT / 'build/rub-starts-audit'
    destination.mkdir(parents=True, exist_ok=True)
    (destination / 'comparison.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    review_file = SNAPSHOT / 'review.json'
    review_text = json.dumps(report, indent=2) + '\n'
    if args.check:
        assert review_file.read_text(encoding='utf-8') == review_text
    else:
        review_file.write_text(review_text, encoding='utf-8')
    print('PASS: 240 Hafs + 240 Warsh starts, ordered, in app database and actual page geometry.')
    print('Hafs existing hizb differences:', sum(r['edition'] == 'hafs' for r in report['existingHizbDifferences']))
    print('Warsh source conflicts:', len(report['crossEditionDifferences']), '- QUARANTINED, not approved for navigation.')
    print('Existing Warsh hizb differences:', sum(r['edition'] == 'warsh' for r in report['existingHizbDifferences']))
    print('Hafs-aligned Warsh candidate sets:', len(report['hafsAlignedWarshCandidates']))
    print('Report:', review_file)


if __name__ == '__main__':
    main()
