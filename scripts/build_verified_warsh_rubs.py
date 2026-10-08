"""Build Maknoon-specific rub starts from printed ornaments and surah anchors.

The independent index establishes order; its known transcription errors are
explicitly checked against visually reviewed original SVG excerpts.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'scripts/data/warsh-divisions'
ASSETS = ROOT / 'app/src/main/assets'
# Eighth ordinal -> printed Warsh reference, reviewed in review-1..5.png.
REVIEWED = {2:(2,16),7:(2,59),10:(2,84),26:(2,211),28:(2,226),42:(3,23),
    78:(4,123),81:(4,147),99:(5,99),112:(6,104),118:(6,146),140:(7,200),
    188:(11,117),202:(13,31),203:(13,36),235:(18,17),266:(22,11),302:(27,17),
    331:(32,11),359:(37,83),370:(39,40),410:(48,26),418:(51,56),
    453:(69,1),454:(69,18),455:(70,40)}

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def build():
    source = read(DATA / 'thumn.json')
    markers = read(DATA / 'printed-markers.json')
    geometry = read(ASSETS / 'warsh_maknoon_positions.json')
    bridge = read(ASSETS / 'warsh_ayah_map.json')['chapters']
    assert len(source) == 480 and len(markers) == 435
    boundaries = []
    for m in markers:
        assert len(m['refs']) == 1
        s, a = m['refs'][0]
        g = geometry[str(m['page'])]
        assert any(v[0:2] == [s,a] and v[2]*g['width']-1 <= m['x'] <= (v[2]+v[4])*g['width']+1
            and v[3]*g['height']-1 <= m['y'] <= (v[3]+v[5])*g['height']+1 for v in g['segments'])
        boundaries.append((s,a,m['page']))
    anchors = [r for r in source if r['starting_aya'] == 1]
    assert len(anchors) == 45
    for r in anchors:
        s = r['sura_number']
        page = min(int(p) for p,g in geometry.items() if any(v[0:2] == [s,1] for v in g['segments']))
        boundaries.append((s,1,page))
    boundaries.sort()
    assert len(boundaries) == len(set((s,a) for s,a,p in boundaries)) == 480
    corrections = {}
    starts = []
    for i, ((s,a,p),r) in enumerate(zip(boundaries,source)):
        assert (r['hizb_number'],r['thumn']) == (i//8+1,i%8+1)
        refs = bridge[str(s)][a-1]
        if r['sura_number'] != s or (r['starting_aya'] != a and r['starting_aya'] not in refs):
            corrections[i+1] = (s,a)
        if i%2 == 0:
            # Existing reader uses canonical ayahs. Reject ambiguous earlier matches.
            assert next(n+1 for n,values in enumerate(bridge[str(s)]) if refs[0] in values) == a
            first_page = min(int(pg) for pg,g in geometry.items() if any(v[0:2] == [s,a] for v in g['segments']))
            assert first_page == p
            starts.append(dict(id=i//2+1,hizb=i//8+1,quarter=(i%8)//2+1,
                surah=s,ayah=refs[0],printedAyah=a,page=p))
    assert corrections == REVIEWED, 'Unreviewed source discrepancy'
    hashes = {str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest()
        for p in [DATA/'thumn.json',DATA/'printed-markers.json',ASSETS/'warsh_ayah_map.json',ASSETS/'warsh_maknoon_positions.json']}
    return dict(schemaVersion=1,edition='warsh_maknoon',status='printed_boundaries_validated',
        sourceRevision='f4aa7867059ac6250a3f8aa68c64002ca1874b7d',inputSha256=hashes,
        reviewedSourceCorrections={str(k):list(v) for k,v in corrections.items()},starts=starts)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check',action='store_true')
    args = parser.parse_args()
    output = json.dumps(build(),ensure_ascii=False,indent=2)+'\n'
    target = ASSETS/'warsh_rub_starts.json'
    if args.check:
        assert target.read_text(encoding='utf-8') == output
    else:
        target.write_text(output,encoding='utf-8')
    print('Verified 480 ordered boundaries and 240 Warsh rub destinations.')
