import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

/** Read cmap mappings only; never alter or subset publisher font bytes. */
function unicodeCmap(font: Buffer): Set<number> {
  const u16 = (at: number) => font.readUInt16BE(at);
  const u32 = (at: number) => font.readUInt32BE(at);
  const record = Array.from({ length: u16(4) }, (_, i) => 12 + 16 * i).find(
    (at) => font.toString('ascii', at, at + 4) === 'cmap',
  );
  assert.ok(record);
  const cmap = u32(record + 8);
  const points = new Set<number>();
  for (let i = 0; i < u16(cmap + 2); i++) {
    const record = cmap + 4 + i * 8;
    const platform = u16(record),
      encoding = u16(record + 2);
    if (platform !== 0 && !(platform === 3 && [1, 10].includes(encoding))) continue;
    const table = cmap + u32(record + 4);
    if (u16(table) === 4) {
      const count = u16(table + 6) / 2;
      const end = table + 14,
        start = end + count * 2 + 2;
      const delta = start + count * 2,
        range = delta + count * 2;
      for (let segment = 0; segment < count; segment++) {
        const first = u16(start + segment * 2);
        const offsetAt = range + segment * 2,
          offset = u16(offsetAt);
        for (let cp = first; cp <= u16(end + segment * 2) && cp < 65535; cp++) {
          const raw = offset ? u16(offsetAt + offset + (cp - first) * 2) : cp;
          const glyph = raw ? (raw + u16(delta + segment * 2)) % 65536 : 0;
          if (glyph) points.add(cp);
        }
      }
    } else if (u16(table) === 12) {
      for (let group = 0; group < u32(table + 12); group++) {
        const at = table + 16 + group * 12;
        for (let cp = u32(at); cp <= u32(at + 4); cp++)
          if (u32(at + 8) + cp - u32(at)) points.add(cp);
      }
    }
  }
  return points;
}

// Full 77,431-word Warsh dataset + its used mark_types + eight attached-sign page samples,
// Arabic ayah-marker digits and spaces. Generated bracket markers use Amiri,
// because the Warsh font's FD3E glyph paints a fixed 286 medallion.
// RLM U+200F is a nonprinting bidi control;
// U+06DD is also category Cf but DOES need an ayah-marker glyph and stays here.
// Dataset SHA and acquisition commit are documented in WARSH_UNICODE_SOURCE.md.
const warshSourceCodepoints = [
  32, 1569, 1570, 1571, 1572, 1573, 1574, 1575, 1576, 1577, 1578, 1579, 1580, 1581, 1582, 1583,
  1584, 1585, 1586, 1587, 1588, 1589, 1590, 1591, 1592, 1593, 1594, 1600, 1601, 1602, 1603, 1604,
  1605, 1606, 1607, 1608, 1609, 1610, 1611, 1612, 1613, 1614, 1615, 1616, 1617, 1618, 1619, 1620,
  1621, 1628, 1632, 1633, 1634, 1635, 1636, 1637, 1638, 1639, 1640, 1641, 1648, 1745, 1746, 1757,
  1758, 1762, 1765, 1766, 1769, 1772, 2160, 2162, 2163, 2164, 2166, 2168, 2169, 2183, 2184, 2249,
  2252, 2288, 2289, 2290,
];

test('the original Warsh 3.0 font retains its pinned bytes and covers the complete source alphabet', () => {
  const font = readFileSync(new URL('../assets/fonts/UthmanicWarsh-v-3.0.ttf', import.meta.url));
  assert.equal(font.length, 251428);
  assert.equal(
    createHash('sha256').update(font).digest('hex'),
    'b644f1c6665baa95c9c0ab40b01a7f3e89edc42a0f50d3b244318a843bec81a9',
  );
  const cmap = unicodeCmap(font);
  assert.deepEqual(
    warshSourceCodepoints
      .filter((cp) => !cmap.has(cp))
      .map((cp) => `U+${cp.toString(16).toUpperCase()}`),
    [],
  );
});

test('the coverage gate rejects the existing Hafs font as a Warsh substitute', () => {
  const font = readFileSync(new URL('../assets/fonts/UthmanicHafs_V22.ttf', import.meta.url));
  const cmap = unicodeCmap(font);
  assert.ok(!cmap.has(0x0874));
  assert.ok(!cmap.has(0x08f0));
  assert.ok(warshSourceCodepoints.some((cp) => !cmap.has(cp)));
});

test('generated end markers use the pinned Amiri alphabet separately from source Warsh glyphs', () => {
  const font = readFileSync(
    new URL(
      '../node_modules/@expo-google-fonts/amiri/400Regular/Amiri_400Regular.ttf',
      import.meta.url,
    ),
  );
  // This exact font was visually checked against the rejected F20 marker output.
  // Cmap alone cannot establish glyph semantics; preserve that reviewed asset.
  assert.equal(
    createHash('sha256').update(font).digest('hex'),
    'd26cd95609ed51b6419e3c7d4a066cb9fac7b73117868622f5b7f03998c68568',
  );
  const cmap = unicodeCmap(font);
  const markerCodepoints = [0xfd3e, 0xfd3f, ...Array.from({ length: 10 }, (_, i) => 0x0660 + i)];
  assert.deepEqual(
    markerCodepoints.filter((cp) => !cmap.has(cp)),
    [],
  );
});
