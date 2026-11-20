#!/usr/bin/env python3
"""Verify the checked-in KFGQPC page counts without modifying app data."""

import argparse
import bisect
import hashlib
import json
from pathlib import Path
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = 'https://text.quran.ws/files/mushaf/hafs.json'
SOURCE_SHA256 = '9b9eb07ff5cff144bf964400924e593d97115e4b937db3c61783f782a5168075'
TABLE = ROOT / 'src/content/generated/hafs-kfqc-page-counts.json'


def verify(raw: bytes) -> None:
    digest = hashlib.sha256(raw).hexdigest()
    if digest != SOURCE_SHA256:
        raise ValueError(f'Source SHA-256 mismatch: expected {SOURCE_SHA256}, received {digest}.')
    source = json.loads(raw)
    table = json.loads(TABLE.read_text(encoding='utf-8'))
    if table.get('source') != SOURCE_URL or table.get('sha256') != SOURCE_SHA256:
        raise ValueError('Checked-in source provenance does not match the pinned URL and digest.')
    page_starts = source['page_starts']
    ayah_starts = source['ayah_starts']
    words = source['words']
    if len(page_starts) != 604 or len(ayah_starts) != 6236:
        raise ValueError('Source does not contain the expected 604 page and 6,236 ayah starts.')
    if (page_starts[0] != 0 or ayah_starts[0] != 0 or
            any(a >= b for a, b in zip(page_starts, page_starts[1:])) or
            any(a >= b for a, b in zip(ayah_starts, ayah_starts[1:])) or
            page_starts[-1] >= len(words) or ayah_starts[-1] >= len(words)):
        raise ValueError('Source page or ayah starts are not ordered valid word offsets.')
    if not set(page_starts).issubset(ayah_starts):
        raise ValueError('A page starts inside an ayah; the count derivation requires review.')
    ends = page_starts[1:] + [len(words)]
    counts = [bisect.bisect_left(ayah_starts, end) - bisect.bisect_left(ayah_starts, start)
              for start, end in zip(page_starts, ends)]
    if table.get('pageCount') != 604 or table.get('ayahCount') != 6236:
        raise ValueError('Checked-in page or ayah count is incorrect.')
    if counts != table.get('counts'):
        raise ValueError('Derived page counts differ from the checked-in table.')
    print(f'Verified {len(counts)} pages and {sum(counts)} ayahs; SHA-256 {digest}.')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, help='Use a previously downloaded copy instead of fetching the pinned URL.')
    args = parser.parse_args()
    try:
        if args.source:
            raw = args.source.read_bytes()
        else:
            request = urllib.request.Request(SOURCE_URL, headers={'User-Agent': 'QuranTracker-page-metrics-verifier/1.0'})
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read()
        verify(raw)
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError, urllib.error.URLError) as error:
        print(f'Verification failed: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
