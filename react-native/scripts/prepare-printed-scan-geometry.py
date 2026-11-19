"""Regenerate original-print hit regions from the shipped scans and Maknoon Hafs PNGs.

Requires Pillow, NumPy and OpenCV. Pass a directory containing the publisher's numbered
1.png through 604.png files. Reads the original pixels and writes geometry only.
"""
import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets' / 'mushaf'
OUT = ROOT / 'src' / 'content' / 'generated'
COUNTS = json.loads((OUT / 'hafs-kfqc-page-counts.json').read_text(encoding='utf8'))['counts']
CHAPTERS = json.loads((OUT / 'chapters.json').read_text(encoding='utf8'))
HAFS = [(c['id'], a) for c in CHAPTERS for a in range(1, c['verseCount'] + 1)]
WARSH = json.loads((OUT / 'muhammadi-positions.json').read_text(encoding='utf8'))

# Each listed leaf has visible Quran text after its final labeled medallion.
# Reviewed from source-pixel contact sheets of all 507 positive leaves. Without
# this check, black ornament on the first two leaves looks like another ayah.
def continuation_pages():
    ranges = '''3-9 11-12 14-17 19-59 62-63 66-74 76-77 79-92 94-98 100-110
    112 115-117 119-121 123-126 128-141 144-150 152-159 161-164 168-169
    171-172 174-178 182-185 187-189 191-194 197-200 203-216 218-220 222-223
    226 228-229 231-233 235-242 245-246 248 250-256 258-260 262-269 271-281
    283-289 291-295 297-300 302 304-305 307-309 312-315 317-319 321-323
    325-328 331-333 335-372 374-375 377 379-380 384-388 390-395 397 399
    401-402 404-410 412-419 421-429 431-434 437-443 445-459 461 463 465-470
    472-479 481-483 485-486 488-491 493-499 502-503 505-506 508-524 526
    528-530 532-533 536 538-539 541-542 544-545 547-548 550-551 555 557-560
    562-564 566-569 571-578 580-591 593-602 605-606 608-611 613-618 624 626
    629-630 633-634'''
    pages = set()
    for value in ranges.split():
        ends = [int(n) for n in value.split('-')]
        pages.update(range(ends[0], ends[-1] + 1))
    assert len(pages) == 507
    return pages


def image(path):
    with Image.open(path) as source:
        return np.array(source.convert('RGBA'))


def intervals(values, max_gap):
    groups = []
    for value in values:
        if not groups or value - groups[-1][-1] > max_gap:
            groups.append([])
        groups[-1].append(int(value))
    return [(g[0], g[-1]) for g in groups]


def order(markers, tolerance):
    # Right-to-left within each physical text line. Diacritics can displace two
    # markers on the same baseline by a few source pixels.
    groups = []
    for m in sorted(markers, key=lambda point: point[1]):
        if not groups or m[1] - groups[-1][0][1] > tolerance:
            groups.append([])
        groups[-1].append(m)
    return [m for group in groups for m in sorted(group, key=lambda point: -point[0])]


def medina_markers(alpha, page, template):
    if page <= 2:
        left, top, right, bottom = 169, 385, 452, 648
        dx, dy, radius = 14, 16, 11
    else:
        left, top, right, bottom = 55, 50, 568, 864
        dx, dy, radius = 16, 20, 14
    scores = cv2.matchTemplate(alpha[top:bottom, left:right], template, cv2.TM_CCOEFF_NORMED)
    peaks = cv2.dilate(scores, np.ones((15, 15), np.uint8))
    ys, xs = np.where((scores >= 0.63) & (scores == peaks))
    markers = []
    for y, x in zip(ys, xs):
        center = (int(x) + left + dx, int(y) + top + dy, radius)
        if not any(abs(center[0] - a) <= 8 and abs(center[1] - b) <= 8 for a, b, _ in markers):
            markers.append(center)
    return order(markers, 16)


def colored_markers(mask, box):
    # The publisher's colored medallion is a connected component independent
    # of the black numeral inside it.
    _, _, stats, centers = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    return [(round(cx), round(cy), (int(w) + 1) // 2)
            for (x, y, w, h, area), (cx, cy) in zip(stats, centers)
            if box(w, h, area)]


def tight_region(ink, left, top, right, bottom):
    if right <= left or bottom <= top:
        return None
    ys, xs = np.nonzero(ink[top:bottom, left:right])
    if len(xs) < 20 or int(xs.max()) - int(xs.min()) < 4:
        return None
    return (left + int(xs.min()), top + int(ys.min()),
            left + int(xs.max()) + 1, top + int(ys.max()) + 1)


def measured_rows(ink, markers, references, bands, x_bounds, excluded, continuation=None):
    regions = []
    cursor = 0
    for line, (top, bottom) in enumerate(bands):
        ends = [m for m in markers if top <= m[1] < bottom]
        if line in excluded:
            assert not ends, (line, ends)
            continue
        left, right = x_bounds[line] if isinstance(x_bounds, list) else x_bounds
        for x, _, radius in ends:
            boundary = max(left, x - radius)
            region = tight_region(ink, boundary, top, right, bottom)
            assert region and cursor < len(references), (line, cursor, references)
            regions.append([*references[cursor], *region])
            right = boundary
            cursor += 1
        next_ref = references[cursor] if cursor < len(references) else continuation
        if next_ref:
            region = tight_region(ink, left, top, right, bottom)
            if region and (cursor < len(references) or
                           (region[2] - region[0] > 25 and region[3] - region[1] > 12)):
                regions.append([*next_ref, *region])
    assert cursor == len(references)
    return regions


def split_rows(ink, width_range, top, bottom, centers, search):
    # Choose the trough of actual ink between two printed baselines.
    left, right = width_range
    projection = ink[:, left:right].sum(axis=1)
    boundaries = [top]
    for before, after in zip(centers, centers[1:]):
        middle = round((before + after) / 2)
        candidates = range(max(boundaries[-1] + 1, middle - search), min(bottom, middle + search + 1))
        boundaries.append(min(candidates, key=lambda y: (projection[y], abs(y - middle))))
    boundaries.append(bottom)
    return list(zip(boundaries, boundaries[1:]))


def hafs_layouts(maknoon):
    templates = [image(ASSETS / 'hafs_madina_page_001.png')[392:426, 232:259, 3].copy(),
                 image(ASSETS / 'hafs_madina_page_050.png')[177:216, 493:525, 3].copy()]
    medina_result, maknoon_result = [], []
    next_surah, next_mak_surah, offset = 3, 3, 0
    skip_first, skip_mak_first = False, False
    for page, count in enumerate(COUNTS, 1):
        rgba = image(ASSETS / f'hafs_madina_page_{page:03}.png')
        alpha = rgba[:, :, 3].copy()
        ink = alpha > 0
        markers = medina_markers(alpha, page, templates[0 if page <= 2 else 1])
        assert len(markers) == count, ('Medina', page, len(markers), count)
        source = image(maknoon / f'{page}.png')[:, :, :3].astype(np.int16)
        red, green, blue = source.transpose(2, 0, 1)
        green_ink = (green > red + 6) & (green > blue + 5)
        small = page <= 2
        mak_markers = order(colored_markers(green_ink,
            lambda w, h, area: (30 <= w <= 38 and 40 <= h <= 50 and 850 <= area <= 1300)
            if small else (37 <= w <= 49 and 49 <= h <= 62 and 1300 <= area <= 2000)), 22)
        assert len(mak_markers) == count, ('Maknoon', page, len(mak_markers), count)
        # Only black printed text and the identified medallions contribute to a
        # touch target. The green frame is deliberately outside the text mask.
        mak_ink = source.max(axis=2) < 145
        for x, y, radius in mak_markers:
            mak_ink[y-32:y+32, x-radius:x+radius+1] |= green_ink[y-32:y+32, x-radius:x+radius+1]
        refs = HAFS[offset:offset + count]
        offset += count
        if small:
            # The illuminated initial leaves have a contoured writing area.
            # These row extents describe that white panel in the original PNGs.
            bounds = [(233,395),(204,423),(174,450),(172,452),(179,444),(205,418),(249,381)]
            if page == 2:
                bounds = [(247,391),(203,421),(174,449),(171,452),(176,441),(205,417),(248,378)]
            centers = [408 + i * 36.1 for i in range(7)]
            bands = split_rows(ink, (239,388), 389, 644, centers, 5)
            mak_centers = [(316 if page == 1 else 320) + i * 68.2 for i in range(7)]
            mak_bands = split_rows(mak_ink, (110,660), 276, 766, mak_centers, 8)
            mak_bounds = (95,680)
            excluded = {0} if page == 2 else set()
            mak_excluded = excluded
        else:
            bounds = (58, 565)
            centers = [87 + i * 53.55 for i in range(15)]
            bands = split_rows(ink, bounds, 50, 866, centers, 7)
            guards = intervals(np.flatnonzero(ink[50:866,75:546].sum(axis=1) > 448) + 50, 68)
            excluded = {0} if skip_first else set()
            skip_first = False
            for start, end in guards:
                assert 55 <= end-start <= 62
                row = round(((start + end) / 2 - 87) / 53.55)
                excluded.add(row)
                if next_surah != 9:
                    if row == 14:
                        skip_first = True
                    else:
                        excluded.add(row + 1)
                next_surah += 1
            mak_centers = [188 + i * 86.1 for i in range(15)]
            mak_bounds = (65, source.shape[1]-60)
            mak_bands = split_rows(mak_ink, mak_bounds, 131, source.shape[0]-107, mak_centers, 12)
            inner = green_ink[132:source.shape[0]-114,100:source.shape[1]-100]
            mak_headers = intervals(np.flatnonzero(inner.sum(axis=1) > inner.shape[1]*0.52) + 132, 85)
            mak_excluded = {0} if skip_mak_first else set()
            skip_mak_first = False
            for start, end in mak_headers:
                row = round(((start + end) / 2 - 188) / 86.1)
                mak_excluded.add(row)
                if next_mak_surah != 9:
                    if row == 14:
                        skip_mak_first = True
                    else:
                        mak_excluded.add(row+1)
                next_mak_surah += 1
        medina_result.append([622, 917, measured_rows(ink, markers, refs, bands, bounds, excluded)])
        maknoon_result.append([source.shape[1], source.shape[0],
                               measured_rows(mak_ink, mak_markers, refs, mak_bands, mak_bounds, mak_excluded)])
    assert offset == 6236 and next_surah == next_mak_surah == 115
    return medina_result, maknoon_result
def muhammadi_layouts():
    result = []
    continuations = continuation_pages()
    for page in range(1, 639):
        art = image(ASSETS / f'warsh_page_{page:03}.png')[:, :, :3].astype(np.int16)
        height, width, _ = art.shape
        red, green, blue = art.transpose(2, 0, 1)
        orange = (red > 145) & (green > 80) & (green > blue + 70) & (red >= green)
        printed = colored_markers(orange, lambda w,h,a: 16 <= w <= 60 and 18 <= h <= 75 and a > 200)
        assert printed, (page, 'no orange markers', int(orange.sum()))
        markers, refs = [], []
        for surah, ayah, raw_x, raw_y in WARSH[page]:
            expected_x, expected_y = raw_x / 456 * width, raw_y / 1025 * height
            best = min(printed, key=lambda m: ((m[0] - expected_x)/width)**2 + ((m[1] - expected_y)/height)**2)
            # Original JS gives a labeled center for each colored marker.
            # Use the corresponding printed pixels at this particular scan size.
            assert abs(best[0] - expected_x) < 8 and abs(best[1] - expected_y) < 57, (page, surah, ayah, best, expected_x, expected_y)
            assert not any(m[:2] == best[:2] for m in markers), (page, best)
            markers.append((best[0], best[1], best[2] + 8))
            refs.append((surah, ayah))
        assert order(markers, 31) == markers, (page,'marker order')
        # A physical ayah occupies the lines between two labeled medallions.
        # Headers are detected from their horizontal turquoise/red ornament.
        # The first two illuminated leaves need their own writing-area windows.
        dark = art.max(axis=2) < 125
        if page <= 2:
            # The first two leaves contain exactly Fatiha 1–7 and Baqara
            # 1–4 in this numbering. Their scalloped surrounds contain black
            # ornament at verse height. Measure inside each writing line.
            bounds = ([(254,565),(195,650),(163,689),(153,693),(172,675),(209,649),(277,595)]
                      if page == 1 else
                      [(258,570),(205,650),(175,663),(159,689),(188,672),(216,648),(266,596)])
            centers = [410,470,545,609,680,750,812] if page == 1 else [416,478,540,612,677,743,811]
            ink = dark.copy()
            for x, y, radius in markers:
                ink[y-21:y+22,x-radius:x+radius+1] |= orange[y-21:y+22,x-radius:x+radius+1]
            rows = split_rows(ink, (266,565), 365, 858, centers, 9)
            result.append([width,height,measured_rows(ink, markers, refs, rows, bounds, {0} if page == 2 else set())])
            continue
        else:
            content = (6, 1, width-6, height-1)
            colorful = (art.max(axis=2)-art.min(axis=2)>100)
            lines = np.flatnonzero(colorful.sum(axis=1) > width*.6)
            titles = intervals(lines, 95)
            bands = []
            start=content[1]
            for y1, y2 in titles:
                if y2-y1 < 40:
                    continue
                if y1-start>25:
                    bands.append((start, y1))
                start=y2+1
            if content[3]-start>23:
                bands.append((start, content[3]))
        ink = dark.copy()
        for x,y,radius in markers:
            ink[y-21:y+22,x-radius:x+radius+1] |= orange[y-21:y+22,x-radius:x+radius+1]
        regions=[]
        ci=0
        for top,bottom in bands:
            in_band = [m for m in markers if top<=m[1]<bottom]
            following = refs[ci+len(in_band)] if ci+len(in_band)<len(refs) else (
                WARSH[page+1][0][:2] if page in continuations else None)
            if not in_band:
                if following:
                    area=tight_region(ink,content[0],top,content[2],bottom)
                    if area: regions.append([*following,*area])
                continue
            grouped = []
            for m in in_band:
                if not grouped or abs(m[1]-grouped[-1][0][1]) > 31:
                    grouped.append([])
                grouped[-1].append(m)
            centers = [sum(m[1] for m in group)/len(group) for group in grouped]
            # Physical line spacing on regular Muhammadi leaves is roughly a
            # fifteenth of their height. Interpolate additional unnumbered lines
            # between consecutive printed markers, keeping each center anchored.
            spacing = 68 if page <= 2 else height/15
            expanded=[]
            for c in centers:
                if expanded:
                    prev=expanded[-1]
                    number=max(1,round((c-prev)/spacing))
                    expanded.extend(prev+(c-prev)*i/number for i in range(1,number))
                expanded.append(c)
            while expanded[0]-top>spacing*1.05:
                expanded.insert(0,expanded[0]-spacing)
            while bottom-expanded[-1]>spacing*1.1:
                expanded.append(expanded[-1]+spacing)
            rows=split_rows(ink, (content[0],content[2]),top,bottom,expanded,round(spacing*.19))
            # Only incomplete leading/trailing verses may cross a page; source
            # marker labels remain authoritative within every physical leaf.
            page_refs=refs[ci:ci+len(in_band)]
            regions.extend(measured_rows(ink, in_band, page_refs, rows, (content[0],content[2]), set(), following))
            ci+=len(in_band)
        assert ci==len(refs), (page,'unassigned markers',ci,len(refs))
        if page in continuations:
            assert any(row[:2] == WARSH[page+1][0][:2] for row in regions), (page,'missing continuation')
        result.append([width,height,regions])
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--maknoon', type=Path, required=True,
                        help='Directory with the 604 unmodified publisher PNG files')
    args = parser.parse_args()
    medina, maknoon = hafs_layouts(args.maknoon)
    for name, data in [('medina', medina), ('hafs-maknoon', maknoon),
                       ('muhammadi', muhammadi_layouts())]:
        path = OUT / f'printed-{name}-strips.json'
        path.write_text(json.dumps(data, separators=(',', ':')) + '\n', encoding='utf8', newline='\n')
        print(f'{name}: {len(data)} pages, sha256 {hashlib.sha256(path.read_bytes()).hexdigest()}')


if __name__ == '__main__':
    main()



