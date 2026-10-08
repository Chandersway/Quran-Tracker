"""Part 1: read-only edition audit. Network checks verify files, NOT recited content.

Run with --online to inspect candidate indexes and small audio samples.
Outputs evidence under build/repeat-audio-audit; never modifies app datasets.
"""
import argparse
import concurrent.futures
import json
import re
import sqlite3
import urllib.request
from urllib.parse import urlparse
from html.parser import HTMLParser
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'app/src/main/assets'
SOURCES = {
    'hafs': 'https://everyayah.com/data/Alafasy_128kbps/',
    'warsh': 'https://everyayah.com/data/warsh/warsh_ibrahim_aldosary_128kbps/',
}


class AudioIndex(HTMLParser):
    def __init__(self):
        super().__init__()
        self.files = set()

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            href = dict(attrs).get('href', '')
            name = urlparse(href).path.rsplit('/', 1)[-1]
            if re.fullmatch(r'\d{6}\.mp3', name):
                self.files.add(name)


def read_db(name, query):
    with sqlite3.connect((ASSETS / name).as_uri() + '?mode=ro', uri=True) as db:
        return db.execute(query).fetchall()


def sample_file(url):
    try:
        request = urllib.request.Request(url, headers={'Range': 'bytes=0-4095'})
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read(4096)
            return {'url': url, 'status': response.status,
                    'content_type': response.headers.get('Content-Type'),
                    'sample_bytes': len(data),
                    'audio_header': data.startswith(b'ID3') or any(
                        data[i] == 255 and data[i+1] & 224 == 224
                        for i in range(len(data)-1)),
                    'content_verified': False}
    except Exception as error:
        return {'url': url, 'error': str(error), 'content_verified': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--online', action='store_true')
    args = parser.parse_args()
    bridge = json.loads((ASSETS / 'warsh_ayah_map.json').read_text(encoding='utf-8'))['chapters']
    geometry = json.loads((ASSETS / 'warsh_maknoon_positions.json').read_text(encoding='utf-8'))
    known = set(read_db('Quraan.db', 'SELECT SURA_num, AYA_num FROM [ALL]'))
    hafs = {}
    for page, surah, ayah in read_db('hafs_ayahinfo_1260.db',
            'SELECT DISTINCT page_number, sura_number, ayah_number FROM glyphs ORDER BY 1,2,3'):
        hafs.setdefault(page, []).append((surah, ayah))
    warsh = {int(page): sorted({tuple(s[:2]) for s in data['segments']})
             for page, data in geometry.items()}
    mapped = {page: sorted({(s, a) for s, w in refs for a in bridge[str(s)][w-1]})
              for page, refs in warsh.items()}
    drawn = {ref for refs in warsh.values() for ref in refs}
    expected_warsh = {(int(s), a) for s, verses in bridge.items() for a in range(1, len(verses)+1)}
    assert drawn == expected_warsh and len(drawn) == 6214
    assert set(hafs) == set(warsh) == set(range(1, 605))
    assert all(set(refs) <= known for refs in mapped.values())
    assert all(set(refs) <= known for refs in hafs.values())
    assert bridge['2'][0] == [1, 2] and bridge['2'][199] == [202]
    hizb_source = (ROOT / 'app/src/main/java/com/Ameender/qurantracker/data/HizbData.kt').read_text(encoding='utf-8')
    hizb = [(int(n), int(s), int(a)) for n, s, a in re.findall(
        r'HizbInfo\((\d+),\s*"[^"\n]*",\s*(\d+),\s*(\d+),', hizb_source)]
    assert [n for n, _, _ in hizb] == list(range(1, 61))
    assert all((s, a) in known for _, s, a in hizb)
    assert [(s, a) for _, s, a in hizb] == sorted((s, a) for _, s, a in hizb)
    # A whole file may cross a page boundary: flag instead of promising exact cuts.
    overlaps = {str(p): sorted(set(mapped[p]) & set(mapped[p+1]))
                for p in range(1, 604) if set(mapped[p]) & set(mapped[p+1])}
    cross = next(p for p, refs in warsh.items() if p > 2 and len({s for s, a in refs}) > 1)
    samples = sorted({1, 2, 3, 300, cross, 604})
    report = {
        'created_utc': datetime.now(timezone.utc).isoformat(),
        'scope': '604-page Hafs geometry and Maknoon Warsh only; other editions not certified',
        'warsh_verses': len(drawn), 'app_reference_verses': len(known),
        'warsh_audio_numbering': 'Hafs-reference hypothesis; listening validation REQUIRED',
        'license_status': 'Audio reuse/redistribution permission not established',
        'warsh_adjacent_pages_sharing_audio_reference': overlaps,
        'fatiha_bridge': bridge['1'],
        'samples': {str(p): {'hafs': hafs[p], 'warsh_printed': warsh[p],
                             'warsh_candidate_audio': mapped[p]} for p in samples},
        'sources': SOURCES, 'online': {},
        'units': {'hizb_starts': hizb, 'juz_starts_from_odd_hizb': hizb[::2],
                  'rub_boundaries': 'Not established: progress counters are not audio boundaries',
                  'validation': 'Reference existence/order only; printed edition boundaries still require checking'},
    }
    if args.online:
        expected = {f'{s:03}{a:03}.mp3' for s, a in known}
        for edition, base in SOURCES.items():
            try:
                with urllib.request.urlopen(base, timeout=30) as response:
                    index = response.read().decode('utf-8')
                parsed = AudioIndex()
                parsed.feed(index)
                files = parsed.files
                if not files:
                    raise ValueError('No audio filenames parsed; completeness UNKNOWN')
                refs = hafs if edition == 'hafs' else mapped
                probes = {(1, 1), (1, 7), (2, 1), (2, 2), (2, 25), (2, 75),
                          (2, 142), (2, 202), (2, 255), (2, 286), (114, 6)}
                for p in samples:
                    probes.update((refs[p][0], refs[p][-1]))
                with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
                    checks = list(pool.map(sample_file, [base + f'{s:03}{a:03}.mp3' for s, a in sorted(probes)]))
                report['online'][edition] = {'indexed_files': len(files),
                    'missing_reference_files': sorted(expected-files),
                    'extra_files': sorted(files-expected), 'samples': checks}
            except Exception as error:
                report['online'][edition] = {'error': str(error)}
    destination = ROOT / 'build/repeat-audio-audit'
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / 'audit.json'
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Validated 604 pages per edition, {len(drawn)} Warsh verses, {len(known)} app references.')
    print(f'Warsh adjacent page overlaps: {len(overlaps)}. Surah-crossing sample: {cross}.')
    print('Page 2:', report['samples']['2'])
    for edition, result in report['online'].items():
        print(edition, 'indexed:', result.get('indexed_files'),
              'missing:', len(result.get('missing_reference_files', [])),
              'error:', result.get('error'))
        checks = result.get('samples', [])
        print(f'Audio headers: {sum(bool(c.get("audio_header")) for c in checks)}/{len(checks)}')
    print(target)


if __name__ == '__main__':
    main()
