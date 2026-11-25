import type {
  SelectableMushafLine,
  SelectableMushafPageData,
  SelectableMushafToken,
} from './selectableMushaf';
import printedWarshPositions from '../content/generated/warsh_maknoon_positions.json';
import manifest from '../content/generated/warsh-page-manifest.json';

const printedPages: Record<string, { segments: number[][] }> = printedWarshPositions;
export function printedWarshPageAyahs(page: number): { surah: number; ayah: number }[] {
  return (printedPages[String(page)]?.segments ?? []).map((row) => ({
    surah: row[0]!,
    ayah: row[1]!,
  }));
}

/** Text is unnormalised Warsh v3; line reconstruction is not printed word geometry. */
export const SELECTABLE_WARSH = {
  id: 'warsh_unicode',
  publisher: 'Quran.ws / King Fahd Quran Printing Complex',
  sourceUrl: 'https://text.quran.ws/',
  textPackage: 'UthmanicWarsh-v-3.0.zip',
  numbering: 'madani-last',
  pageCount: 604,
  // The publisher's shared word numbering explicitly omits these in Warsh.
  missingWordNumbers: manifest.missingWordNumbers,
} as const;

const ayahEnds = new Set(manifest.ayahEndNumbers);
function sourceReference(number: number) {
  if (number <= manifest.openingWords) return { surah: 1, ayah: 0, position: 0 };
  let low = 0,
    high = manifest.ayahEndNumbers.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (manifest.ayahEndNumbers[middle]! < number) low = middle + 1;
    else high = middle;
  }
  let localAyah = low + 1,
    surah = 1;
  while (localAyah > manifest.surahAyahCounts[surah - 1]!) {
    localAyah -= manifest.surahAyahCounts[surah - 1]!;
    surah++;
  }
  const priorEnd = low ? manifest.ayahEndNumbers[low - 1]! : manifest.openingWords;
  const skipped = manifest.missingWordNumbers.filter(
    (value) => value > priorEnd && value < number,
  ).length;
  return { surah, ayah: localAyah, position: number - priorEnd - skipped };
}

export type WarshSourceWord = {
  surah: number;
  ayah: number;
  position: number;
  number: number;
  page: number;
  line: number | null;
  text: string;
};
const integer = (value: unknown, min: number, max: number): value is number =>
  Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
const referenceKey = (value: { surah: number; ayah: number }) => `${value.surah}:${value.ayah}`;

/** Validate the whole response against this printed edition; never filter away mismatched ayahs. */
export function parseWarshMushafResponse(
  value: unknown,
  page: number,
  expectedAyahs: readonly { surah: number; ayah: number }[],
): WarshSourceWord[] {
  if (!integer(page, 1, 604)) throw new RangeError('Invalid Warsh page');
  const raw = value && typeof value === 'object' ? (value as { words?: unknown }).words : null;
  if (!Array.isArray(raw) || !raw.length || raw.length > 1000)
    throw new TypeError('Missing Warsh page words');
  const words = raw.map((item): WarshSourceWord => {
    if (!item || typeof item !== 'object') throw new TypeError('Invalid Warsh word');
    const word = item as Record<string, unknown>;
    if (
      !integer(word.surah, 1, 114) ||
      !integer(word.ayah, 0, 300) ||
      !integer(word.position, 0, 1000) ||
      !integer(word.number, 1, 77434) ||
      word.page !== page ||
      typeof word.text !== 'string' ||
      !word.text.trim() ||
      word.text.length > 500 ||
      /[\u0000-\u001f\u007f\uE000-\uF8FF\uD800-\uDFFF]/u.test(word.text)
    )
      throw new TypeError('Invalid Warsh Unicode word or page');
    return {
      surah: word.surah,
      ayah: word.ayah,
      position: word.position,
      number: word.number,
      page,
      line: integer(word.line, 1, 100) ? word.line : null,
      text: word.text,
    };
  });
  const extent = manifest.pages[page - 1]!;
  if (
    words.length !== extent[2] ||
    words[0]!.number !== extent[0] ||
    words.at(-1)!.number !== extent[1]
  )
    throw new TypeError('Incomplete Warsh page extent');
  const ayahs = new Set<string>();
  let previous: WarshSourceWord | undefined;
  for (const word of words) {
    const expectedWord = sourceReference(word.number);
    if (
      manifest.missingWordNumbers.includes(word.number) ||
      word.surah !== expectedWord.surah ||
      word.ayah !== expectedWord.ayah ||
      word.position !== expectedWord.position
    )
      throw new TypeError('Warsh word does not match the normative printed reference');
    if (word.ayah === 0) {
      if (page !== 1 || word.surah !== 1 || word.position !== 0 || word.number > 4)
        throw new TypeError('Unexpected Warsh basmallah');
    } else {
      if (word.position < 1) throw new TypeError('Invalid Warsh word position');
      ayahs.add(referenceKey(word));
    }
    if (previous) {
      let nextNumber = previous.number + 1;
      while ((SELECTABLE_WARSH.missingWordNumbers as readonly number[]).includes(nextNumber))
        nextNumber++;
      if (word.number !== nextNumber)
        throw new TypeError('Missing, duplicate or out-of-order Warsh word');
      const sameAyah = referenceKey(word) === referenceKey(previous);
      if (
        word.surah < previous.surah ||
        (word.surah === previous.surah && word.ayah < previous.ayah) ||
        (word.ayah > 0 && word.position !== (sameAyah ? previous.position + 1 : 1))
      )
        throw new TypeError('Invalid Warsh word sequence');
    }
    previous = word;
  }
  const expected = new Set(expectedAyahs.filter((ayah) => ayah.ayah > 0).map(referenceKey));
  if (
    !expected.size ||
    expected.size !== ayahs.size ||
    [...expected].some((key) => !ayahs.has(key))
  )
    throw new TypeError('Warsh page does not match the printed edition');
  const first = words.find((word) => word.ayah > 0)!;
  if (
    first.position !== 1 &&
    !printedWarshPageAyahs(page - 1).some((ayah) => referenceKey(ayah) === referenceKey(first))
  )
    throw new TypeError('Missing first Warsh word');
  if (
    page === 1 &&
    (words.filter((word) => word.ayah === 0).length !== 4 || words[0]!.number !== 1)
  )
    throw new TypeError('Incomplete Warsh opening basmallah');
  return words;
}

export function warshBasmallah(words: readonly WarshSourceWord[]): string | undefined {
  const opening = words.filter((word) => word.surah === 1 && word.ayah === 0);
  return opening.length === 4 ? opening.map((word) => word.text).join(' ') : undefined;
}

export function warshNeedsBasmallah(words: readonly WarshSourceWord[]): boolean {
  return words.some((word) => word.ayah === 1 && word.position === 1 && word.surah !== 9);
}

/** All text survives unknown line metadata; that fallback groups by ayah, not guessed print lines. */
export function buildSelectableWarshPage(
  page: number,
  words: readonly WarshSourceWord[],
  basmallah = warshBasmallah(words),
): SelectableMushafPageData {
  if (!words.length) throw new TypeError('Missing Warsh page words');
  const reconstructed = words.every(
    (word, index) => word.line !== null && (!index || word.line >= (words[index - 1]!.line ?? 0)),
  );
  const lines: SelectableMushafLine[] = [];
  let current: SelectableMushafLine | undefined;
  let previous: WarshSourceWord | undefined;
  const addLine = (kind: SelectableMushafLine['kind'], text = '', surah?: number) => {
    const line: SelectableMushafLine = {
      number: lines.length + 1,
      kind,
      centered: kind !== 'ayah' || page <= 2,
      ...(surah ? { surah } : {}),
      text,
      tokens: [],
    };
    lines.push(line);
    return line;
  };
  const addToken = (
    line: SelectableMushafLine,
    token: Omit<SelectableMushafToken, 'start' | 'end' | 'line'>,
  ) => {
    const start = line.text.length + (line.tokens.length ? 1 : 0);
    line.text += (line.tokens.length ? ' ' : '') + token.text;
    line.tokens.push({ ...token, line: line.number, start, end: line.text.length });
  };
  for (let index = 0; index < words.length; index++) {
    const word = words[index]!;
    const opening = word.ayah <= 1 && word.position <= 1 && previous?.surah !== word.surah;
    if (opening) {
      addLine('surah_name', '', word.surah);
      current = undefined;
      if (word.ayah !== 0 && word.surah !== 9) {
        if (!basmallah) throw new TypeError('Missing source Warsh basmallah');
        addLine('basmallah', basmallah);
      }
    }
    const sameGroup =
      previous &&
      (reconstructed ? previous.line === word.line : referenceKey(previous) === referenceKey(word));
    if (!current || !sameGroup || (previous?.ayah === 0) !== (word.ayah === 0))
      current = addLine(word.ayah === 0 ? 'basmallah' : 'ayah');
    addToken(current, {
      id: word.number,
      candidate: { surah: word.surah, ayah: word.ayah, word: word.position },
      text: word.text,
      sourceText: word.text,
      kind: 'word',
      alignment: { status: 'unavailable', reason: 'warsh-unverified' },
    });
    const next = words[index + 1];
    if (
      word.ayah > 0 &&
      ayahEnds.has(word.number) &&
      (!next || referenceKey(next) !== referenceKey(word))
    ) {
      const number = String(word.ayah).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]!);
      addToken(current, {
        id: -word.number,
        candidate: { surah: word.surah, ayah: word.ayah, word: 0 },
        text: `﴿${number}﴾`,
        sourceText: '',
        kind: 'end',
        alignment: { status: 'unavailable', reason: 'end-marker' },
      });
    }
    previous = word;
  }
  return {
    edition: 'warsh_unicode',
    sourceMushafId: null,
    page,
    lines,
    layout: reconstructed ? 'reconstructed' : 'flowing',
    sourceUrl: SELECTABLE_WARSH.sourceUrl,
  };
}
