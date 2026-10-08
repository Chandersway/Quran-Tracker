"""Locate the eight-petal rub ornament from actual Maknoon SVG outlines.
Read-only source inspection; writes an audit, not approved navigation data.
"""
import json
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from build_warsh_maknoon_positions import read_page, paths_with_fill, ContourBoundsPen, parse_path

ROOT = Path(__file__).resolve().parents[1]
# Eight contour bounds of the ornament preceding printed Warsh 2:25 on page 5.
TEMPLATE = [(53.77408,142.08,55.17,143.3115),(53.42622,140.83313,55.01,141.67394),
 (55.96,139.52532,56.96378,141.04),(54.45362,139.516,55.45,141.02),
 (55.3,142.43,56.12,144.01),(56.42,140.84313,57.99378,141.67090),
 (56.23,142.08,57.626,143.2915),(55.25,141.22,56.17,142.14)]

def inspect(page):
    root = read_page(ROOT / f'.artifacts/warsh-maknoon/{page:03}.svgz')
    pen=ContourBoundsPen()
    for element,fill in paths_with_fill(root):
        if fill in ('black','#000','#000000'):
            parse_path(element.get('d',''),pen); pen.finish()
    small=[b for b in pen.boxes if b[2]-b[0]<6 and b[3]-b[1]<6]
    found=[]
    for b in small:
        if abs(b[2]-b[0]-1.39592)>.12 or abs(b[3]-b[1]-1.2315)>.12: continue
        dx,dy=b[0]-TEMPLATE[0][0],b[1]-TEMPLATE[0][1]
        near=[c for c in small if abs(c[0]-b[0])<5 and abs(c[1]-b[1])<5]
        if all(any(max(abs(c[i]-(t[i]+(dx if i%2==0 else dy))) for i in range(4))<.25 for c in near) for t in TEMPLATE):
            found.append([55.71+dx,141.76+dy])
    return page,found

def main():
    geometry=json.loads((ROOT/'app/src/main/assets/warsh_maknoon_positions.json').read_text())
    results=[]
    with ProcessPoolExecutor(max_workers=4) as pool:
        for n,(page,points) in enumerate(pool.map(inspect,range(1,605)),1):
            data=geometry[str(page)]
            for x,y in points:
                hits=sorted({(s,a) for s,a,l,t,w,h in data['segments']
                    if l*data['width']-1<=x<=(l+w)*data['width']+1 and t*data['height']-1<=y<=(t+h)*data['height']+1})
                results.append({'page':page,'x':x,'y':y,'refs':hits})
            if n%50==0: print(f'{n}/604 pages; {len(results)} markers',flush=True)
    target=ROOT/'build/rub-starts-audit/printed-markers.json'
    target.write_text(json.dumps(results,indent=2))
    print('Markers:',len(results),'unique matches:',sum(len(r['refs'])==1 for r in results),flush=True)

if __name__=='__main__': main()
