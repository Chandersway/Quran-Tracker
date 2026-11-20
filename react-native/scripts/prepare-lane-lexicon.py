"""Bundle unchanged Lane entries joined ONLY by primary-source canonical QAC heads.

No fuzzy matching, inferred radicals, hamza removal, or generated definitions.
Rebuild with the downloaded source artifacts in .tooling/lane (see provenance).
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import sqlite3
import xml.etree.ElementTree as ET
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / '.tooling/lane'
OUTPUT = ROOT / 'assets/lexicon'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def plain(xml):
    # Both prose and cross-reference labels come from the original XML.
    element = ET.fromstring(xml)
    for ref in element.iter('ref'):
        if not ''.join(ref.itertext()).strip() and ref.get('target'):
            ref.text = ref.get('target')
    return re.sub(r'\s+', ' ', ''.join(element.itertext())).strip()


def main():
    audit = json.loads((ROOT / 'data/lexicon/lane-root-mapping.json').read_text(encoding='utf-8'))
    catalog = json.loads((ROOT / 'data/lexicon/qac-canonical-root-heads.json').read_text(encoding='utf-8'))
    if not catalog['summary']['complete'] or len(audit['records']) != 1642:
        raise ValueError('Complete primary-source canonical heads are required')
    source_path = INPUT / 'lexicon.sqlite'
    original_hash = sha(source_path)
    if original_hash != audit['laneInputSha256']:
        raise ValueError('Lane source differs from the audited artifact')
    source = sqlite3.connect(f'file:{source_path.as_posix()}?mode=ro&immutable=1', uri=True)
    source.row_factory = sqlite3.Row
    path = OUTPUT / 'lane-qac.db'
    if path.exists():
        path.unlink()
    db = sqlite3.connect(path)
    db.executescript('''
        PRAGMA user_version=1;
        CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
        CREATE TABLE roots(id TEXT PRIMARY KEY,arabic TEXT NOT NULL,status TEXT NOT NULL,source_url TEXT NOT NULL);
        CREATE TABLE definitions(id INTEGER PRIMARY KEY,root TEXT NOT NULL,headword TEXT NOT NULL,nodeid TEXT NOT NULL,page INTEGER,file TEXT,supplement INTEGER NOT NULL,xml TEXT NOT NULL,definition TEXT NOT NULL);
        CREATE TABLE root_definitions(root_id TEXT NOT NULL,definition_id INTEGER NOT NULL,PRIMARY KEY(root_id,definition_id));
        CREATE INDEX definitions_for_root ON root_definitions(root_id);
    ''')
    entry_ids = set()
    matched = 0
    for row in audit['records']:
        available = bool(row['laneEntryIds'])
        matched += available
        db.execute('INSERT INTO roots VALUES(?,?,?,?)', (
            row['qacRootIdBW'], row['publishedCanonicalArabic'],
            'exact-canonical-heading' if available else 'unmapped',
            'https://corpus.quran.com/qurandictionary.jsp?q=' + quote(row['qacRootIdBW'], safe=''),
        ))
        for entry_id in row['laneEntryIds']:
            db.execute('INSERT INTO root_definitions VALUES(?,?)', (row['qacRootIdBW'], entry_id))
            if entry_id in entry_ids:
                continue
            entry_ids.add(entry_id)
            entry = source.execute('SELECT * FROM entry WHERE id=?', (entry_id,)).fetchone()
            db.execute('INSERT INTO definitions VALUES(?,?,?,?,?,?,?,?,?)', (
                entry['id'], entry['root'], entry['word'], entry['nodeid'], entry['page'],
                entry['file'], entry['supplement'], entry['xml'], plain(entry['xml']),
            ))
    provenance = {
        'schemaVersion': 1,
        'source': "Lane's Arabic-English Lexicon (LexiconDatabase)",
        'sourceUrl': 'https://github.com/laneslexicon/LexiconDatabase',
        'downloadUrl': 'https://github.com/laneslexicon/LexiconDatabase/raw/master/lexicon.sqlite.zip',
        'license': 'GPL-3.0',
        'licenseFile': 'LANE-LICENSE.txt',
        'sourceSha256': original_hash,
        'sourceArchiveSha256': sha(INPUT / 'lexicon.sqlite.zip'),
        'sourceMetadata': [dict(row) for row in source.execute('SELECT * FROM lexicon')],
        'mappingRule': 'NFC equality of official QAC published canonical root-menu heading and original Lane root.word; all source entries under that heading retained once. No alias or fuzzy association.',
        'textRule': 'Full entry.xml unchanged; display text is XML itertext with whitespace collapsed and empty ref labels filled ONLY from original ref.target attributes. No generated meanings or translation.',
        'roots': 1642, 'mappedRoots': matched, 'unmappedRoots': 1642 - matched,
        'definitions': len(entry_ids),
        'canonicalCatalogSha256': sha(ROOT / 'data/lexicon/qac-canonical-root-heads.json'),
        'mappingAuditSha256': sha(ROOT / 'data/lexicon/lane-root-mapping.json'),
        'canonicalSourcePages': catalog['pages'],
    }
    db.execute('INSERT INTO metadata VALUES(?,?)', ('manifest', json.dumps(provenance, ensure_ascii=False)))
    db.commit()
    db.execute('VACUUM')
    db.close()
    source.close()
    if sha(source_path) != original_hash:
        raise RuntimeError('Read-only Lane input changed')
    provenance['databaseSha256'] = sha(path)
    (OUTPUT / 'lane-provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (OUTPUT / 'qac-canonical-heads.json').write_text(json.dumps({row['qacRootIdBW']: row['publishedCanonicalArabic'] for row in audit['records']}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    shutil.copyfile(INPUT / 'LICENSE', OUTPUT / 'LANE-LICENSE.txt')
    (OUTPUT / 'lane-license.json').write_text(json.dumps({'text': (INPUT / 'LICENSE').read_text(encoding='utf-8')}) + '\n', encoding='utf-8')
    print(json.dumps({'mappedRoots': matched, 'unmappedRoots': 1642 - matched, 'definitions': len(entry_ids), 'bytes': path.stat().st_size}))


if __name__ == '__main__':
    main()
