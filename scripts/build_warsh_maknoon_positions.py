"""Extract page-space ayah geometry from the actual Maknoon Warsh SVGs.

Requires fonttools. Input files are the downloaded, unmodified 001..604.svgz
pages. Never reuse Hafs coordinates for these pages.
"""
import argparse
import gzip
import json
import re
import sys
from concurrent.futures import ProcessPoolExecutor
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.artifacts/mushaf-tools'))
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.basePen import BasePen
from fontTools.svgLib.path import parse_path


def read_page(path):
    raw = path.read_bytes()
    if raw[:2] == b'\x1f\x8b':
        raw = gzip.decompress(raw)
    return ET.fromstring(raw)


def bounds(path):
    pen = BoundsPen(None)
    parse_path(path, pen)
    return pen.bounds


def paths_with_fill(root, fill='black'):
    fill = root.get('fill', fill)
    if root.tag.endswith('path'):
        yield root, fill
    for child in root:
        yield from paths_with_fill(child, fill)


class ContourBoundsPen(BasePen):
    def __init__(self):
        super().__init__(None)
        self.boxes = []
        self.pen = None

    def finish(self):
        if self.pen is not None and self.pen.bounds:
            self.boxes.append(self.pen.bounds)
        self.pen = None

    def _moveTo(self, point):
        self.finish()
        self.pen = BoundsPen(None)
        self.pen.moveTo(point)

    def _lineTo(self, point):
        self.pen.lineTo(point)

    def _curveToOne(self, a, b, c):
        self.pen.curveTo(a, b, c)

    def _qCurveToOne(self, a, b):
        self.pen.qCurveTo(a, b)

    def _closePath(self):
        self.pen.closePath()
        self.finish()

    def _endPath(self):
        self.finish()


def inspect_page(path):
    root = read_page(path)
    viewbox = list(map(float, root.attrib['viewBox'].split()))
    markers = []
    headings = []
    for element, fill in paths_with_fill(root):
        if fill.lower() == '#d0aaca' and 'd' in element.attrib:
            box = bounds(element.attrib['d'])
            if box and 5 < box[2] - box[0] < 18 and 10 < box[3] - box[1] < 26:
                markers.append(list(box))
            elif box:
                pen = ContourBoundsPen()
                parse_path(element.attrib['d'], pen)
                pen.finish()
                headings.extend(b for b in pen.boxes if b[2] - b[0] > 200 and 20 < b[3] - b[1] < 40)
    markers.sort(key=lambda b: ((b[1] + b[3]) / 2, -(b[0] + b[2]) / 2))
    # Same-line coordinates vary slightly: read a whole line right-to-left.
    lines = []
    for box in markers:
        cy = (box[1] + box[3]) / 2
        if not lines or cy - lines[-1][0] > 8:
            lines.append([cy, []])
        lines[-1][1].append(box)
    markers = [b for _, group in lines for b in sorted(group, key=lambda b: -b[0])]
    text_path = max((e.get('d', '') for e, fill in paths_with_fill(root) if fill in ('black', '#000', '#000000')), key=len)
    pen = ContourBoundsPen()
    parse_path(text_path, pen)
    pen.finish()
    # Fit the line slots to actual letter outlines, not equal-height screen
    # strips. Maknoon has 15 slots (including headings); opening pages have 7.
    import numpy as np
    profile = np.zeros(int(viewbox[3] * 4) + 1)
    for left, top, right, bottom in pen.boxes:
        if right - left > .1 and bottom - top > .1:
            profile[max(0, int(top * 4)):int(bottom * 4) + 1] += right - left
    opening = int(path.stem) <= 2
    if opening:
        profile[:145 * 4] = 0
    ink = np.where(profile > 5)[0] / 4
    count = 7 if opening else 15
    pitch = (ink[-1] - ink[0]) / count
    centers = np.linspace(ink[0] + pitch / 2, ink[-1] - pitch / 2, count)
    ys = np.arange(len(profile)) / 4
    for _ in range(25):
        assigned = np.abs(ys[:, None] - centers).argmin(axis=1)
        centers = np.array([np.average(ys[(assigned == i) & (profile > 0)], weights=profile[(assigned == i) & (profile > 0)]) for i in range(count)])
    borders = [ink[0] - 2, *((centers[:-1] + centers[1:]) / 2), ink[-1] + 2]
    rows = []
    for i, center in enumerate(centers):
        row_boxes = [b for b in pen.boxes if borders[i] <= (b[1] + b[3]) / 2 < borders[i + 1]]
        row_markers = [b for b in markers if i == int(np.abs(centers - (b[1] + b[3]) / 2).argmin())]
        row_boxes += row_markers
        if not row_boxes:
            raise ValueError(f'{path}: empty line {i}')
        rows.append({
            'left': min(b[0] for b in row_boxes) - .5,
            'right': max(b[2] for b in row_boxes) + .5,
            'top': max(borders[i], min(b[1] for b in row_boxes) - 1),
            'bottom': min(borders[i + 1], max(b[3] for b in row_boxes) + 1),
            'markers': sorted(row_markers, key=lambda b: -b[0]),
            'heading': any(b[1] <= center <= b[3] for b in headings),
            'openingBasmala': opening and i == 0
        })
        for b in row_markers:
            if abs((b[1] + b[3]) / 2 - center) > 10:
                raise ValueError(f'{path}: marker does not align with line {i}: {b}')
    return {'page': int(path.stem), 'viewBox': viewbox, 'markers': markers, 'rows': rows}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--qa', type=Path)
    args = parser.parse_args()
    with ProcessPoolExecutor(max_workers=4) as pool:
        pages = list(pool.map(inspect_page, sorted(args.source.glob('*.svgz'))))
    print('pages', len(pages), 'markers', sum(len(p['markers']) for p in pages))
    root = Path(__file__).resolve().parents[1]
    source = (root / 'app/src/main/assets/coordinate_muhammadi.js').read_text()
    reference = json.loads(source[source.index('['):source.rindex(']') + 1])
    counts = {}
    for page in reference:
        for surah, ayah, *_ in page:
            counts[surah] = max(counts.get(surah, 0), ayah)
    order = [(surah, ayah) for surah in range(1, 115) for ayah in range(1, counts[surah] + 1)]
    assert len(pages) == 604
    assert sum(len(p['markers']) for p in pages) == len(order) == 6214
    current = 0
    output = {}
    heading_count = 0
    for page in pages:
        _, _, width, height = page['viewBox']
        segments = []
        skip_basmala = False
        for row in page['rows']:
            if row['heading']:
                assert not row['markers']
                assert order[current][1] == 1, (page['page'], 'heading not at verse 1', order[current])
                heading_count += 1
                skip_basmala = current < len(order) and order[current][0] != 9
                continue
            if row['openingBasmala'] or skip_basmala:
                assert not row['markers']
                skip_basmala = False
                continue
            right = row['right']
            def add(left, right):
                if right - left > 1 and current < len(order):
                    surah, ayah = order[current]
                    segments.append([surah, ayah, left / width, row['top'] / height,
                                     (right - left) / width, (row['bottom'] - row['top']) / height])
            for marker in row['markers']:
                add(marker[0], right)
                right = marker[0]
                current += 1
            # Blank space after a final marker is not the next ayah.
            if right - row['left'] > 4:
                add(row['left'], right)
        output[str(page['page'])] = {'width': width, 'height': height,
                                    'segments': [[*s[:2], *[round(v, 7) for v in s[2:]]] for s in segments]}
        if args.qa and page['page'] in (1, 2, 3, 50, 187, 293, 595, 604):
            args.qa.mkdir(parents=True, exist_ok=True)
            svg = read_page(args.source / f"{page['page']:03}.svgz")
            for surah, ayah, left, top, w, h in segments:
                color = ['#2e86de', '#27ae60', '#e67e22', '#9b59b6'][(surah + ayah) % 4]
                ET.SubElement(svg, '{http://www.w3.org/2000/svg}rect', {
                    'x': str(left * width), 'y': str(top * height), 'width': str(w * width),
                    'height': str(h * height), 'fill': color, 'fill-opacity': '.20', 'stroke': color, 'stroke-width': '.2'})
            ET.ElementTree(svg).write(args.qa / f"warsh-{page['page']:03}.svg", encoding='utf-8')
    assert current == len(order)
    assert heading_count == 112, heading_count
    if args.output:
        args.output.write_text(json.dumps(output, separators=(',', ':')), encoding='utf-8')
    print('Validated 604 pages, 6214 verse endings; segments:', sum(len(p['segments']) for p in output.values()))


if __name__ == '__main__':
    main()
