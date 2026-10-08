"""Compare an independent Warsh page index to printed ornaments; no approval inferred."""
import json
import urllib.request
import hashlib
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
REV='f4aa7867059ac6250a3f8aa68c64002ca1874b7d'
BASE=f'https://raw.githubusercontent.com/adelpro/open-mushaf-native/{REV}/'

def main():
    dest=ROOT/'scripts/data/warsh-divisions'
    dest.mkdir(parents=True,exist_ok=True)
    for name,path in [('thumn.json','assets/quran-metadata/mushaf-elmadina-warsh-azrak/thumn.json'),('LICENSE','LICENSE')]:
        if not (dest/name).exists():
            with urllib.request.urlopen(BASE+path,timeout=30) as response: (dest/name).write_bytes(response.read())
    source=json.loads((dest/'thumn.json').read_text())
    markers=json.loads((ROOT/'build/rub-starts-audit/printed-markers.json').read_text())
    by_page=defaultdict(list); glyphs=defaultdict(list)
    for r in source: by_page[r['startingPage']].append(r)
    for r in markers: glyphs[r['page']].append(r)
    mismatches=[]; matches=[]
    for page,rows in by_page.items():
        pts=sorted(glyphs[page],key=lambda r:(round(r['y']/8),-r['x']))
        if len(rows)==len(pts):
            matches += [{'source':r,'printed':m} for r,m in zip(rows,pts)]
        else: mismatches.append({'page':page,'source':rows,'printed':pts})
    report={'sourceRevision':REV,'sourceUrl':BASE,'sourceEntries':len(source),
        'sourceSha256':hashlib.sha256((dest/'thumn.json').read_bytes()).hexdigest(),
        'status':'Not approved: page-count matching cannot prove numbering or quarter identity',
        'matchedByPageCount':matches,'unresolvedPages':mismatches}
    (ROOT/'build/rub-starts-audit/warsh-divisions-comparison.json').write_text(json.dumps(report,indent=2))
    (dest/'review.json').write_text(json.dumps(report,indent=2))
    (dest/'printed-markers.json').write_text(json.dumps(markers,indent=2))
    print('source',len(source),'page-count matches',len(matches),'unresolved pages',len(mismatches))
    print([(r['page'],len(r['source']),len(r['printed'])) for r in mismatches])

if __name__=='__main__': main()
