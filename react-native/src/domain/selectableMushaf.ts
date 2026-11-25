/** QPC Hafs Unicode with publisher-provided QCF V1 page/line layout, never image geometry. */
export const SELECTABLE_MUSHAF = {
  id: 'qpc_hafs_unicode',
  publisher: 'Quran Foundation / King Fahd Quran Printing Complex',
  mushafId: 2,
  layout: 'qcf_v1',
  pageCount: 604,
  linesPerPage: 15,
  textField: 'text_qpc_hafs',
} as const;

export type CanonicalMushafWord = { surah: number; ayah: number; word: number };
export type SelectableMushafEdition = 'hafs' | 'warsh_maknoon';
export type MushafWordAlignment =
  | { status: 'verified'; reference: CanonicalMushafWord }
  | {
      status: 'unavailable';
      reason: 'end-marker' | 'source-mismatch' | 'unverified' | 'warsh-unverified';
    };
export type SelectableMushafToken = {
  id: number;
  /** Source-local numbering; only a verified alignment may become a Hafs lexical reference. */
  candidate: CanonicalMushafWord;
  text: string;
  sourceText: string;
  kind: 'word' | 'end';
  line: number;
  start: number;
  end: number;
  alignment: MushafWordAlignment;
};
export type SelectableMushafLine = {
  number: number;
  kind: 'ayah' | 'surah_name' | 'basmallah' | 'blank';
  centered: boolean;
  surah?: number;
  text: string;
  tokens: SelectableMushafToken[];
};
export type SelectableMushafPageData = {
  page: number;
  lines: SelectableMushafLine[];
} & (
  | {
      edition: typeof SELECTABLE_MUSHAF.id;
      sourceMushafId: typeof SELECTABLE_MUSHAF.mushafId;
      layout?: 'prescribed';
    }
  | {
      edition: 'warsh_unicode';
      sourceMushafId: null;
      layout: 'reconstructed' | 'flowing';
      sourceUrl: string;
    }
);
type SourceWord = {
  id: number;
  position: number;
  /** Normalized from explicit v1_page, never the legacy API's generic page_number. */
  page_number: number;
  line_number: number;
  char_type_name: 'word' | 'end';
  text_qpc_hafs: string;
  text_uthmani: string;
};
export type SourceMushafVerse = { verse_key: string; words: SourceWord[] };

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Invalid Mushaf response');
  return value as Record<string, unknown>;
}
function integer(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
}
function unicodeText(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !/[\uE000-\uF8FF\uD800-\uDFFF]/u.test(value) &&
    !/[\r\n]/.test(value)
  );
}

/** Reject malformed text/coordinates instead of rendering a convincing incorrect page. */
export function parseMushafResponse(value: unknown): {
  verses: SourceMushafVerse[];
  nextPage: number | null;
} {
  const root = record(value);
  if (!Array.isArray(root.verses) || !root.verses.length)
    throw new TypeError('Missing Mushaf verses');
  const verses = root.verses.map((raw): SourceMushafVerse => {
    const verse = record(raw);
    if (typeof verse.verse_key !== 'string' || !/^\d{1,3}:\d{1,3}$/.test(verse.verse_key))
      throw new TypeError('Invalid verse reference');
    const [surah, ayah] = verse.verse_key.split(':').map(Number);
    if (!integer(surah, 1, 114) || !integer(ayah, 1, 286) || !Array.isArray(verse.words))
      throw new TypeError('Invalid verse reference');
    const words = verse.words.map((rawWord): SourceWord => {
      const word = record(rawWord);
      // The legacy endpoint's generic page_number can describe V2 even when
      // by_page and line_number use V1. Mixing them silently omits whole ayahs.
      if (!integer(word.v1_page, 1, 604))
        throw new TypeError('Missing or invalid QCF V1 page metadata');
      if (
        !integer(word.id, 1, 1_000_000) ||
        !integer(word.position, 1, 1_000) ||
        !integer(word.line_number, 1, 15) ||
        (word.char_type_name !== 'word' && word.char_type_name !== 'end') ||
        !unicodeText(word.text_qpc_hafs) ||
        !unicodeText(word.text_uthmani)
      )
        throw new TypeError('Invalid Unicode Mushaf word');
      return {
        id: word.id,
        position: word.position,
        page_number: word.v1_page,
        line_number: word.line_number,
        char_type_name: word.char_type_name,
        text_qpc_hafs: word.text_qpc_hafs,
        text_uthmani: word.text_uthmani,
      };
    });
    return { verse_key: verse.verse_key, words };
  });
  const pagination = record(root.pagination);
  const nextPage = pagination.next_page;
  if (nextPage !== null && !integer(nextPage, 2, 100))
    throw new TypeError('Invalid Mushaf pagination');
  return { verses, nextPage };
}

export function buildSelectableMushafPage(
  page: number,
  verses: SourceMushafVerse[],
  resolve: (reference: CanonicalMushafWord, sourceText: string) => MushafWordAlignment = () => ({
    status: 'unavailable',
    reason: 'unverified',
  }),
): SelectableMushafPageData {
  if (!integer(page, 1, 604)) throw new RangeError('Mushaf page must be between 1 and 604');
  const lines: SelectableMushafLine[] = Array.from({ length: 15 }, (_, index) => ({
    number: index + 1,
    kind: 'blank',
    centered: page <= 2,
    text: '',
    tokens: [],
  }));
  const ids = new Set<number>();
  const references = new Set<string>();
  let previousLine = 0;
  let previousReference = 0;
  for (const verse of verses) {
    const [surah, ayah] = verse.verse_key.split(':').map(Number) as [number, number];
    for (const word of verse.words) {
      // The API can include the complete verse when it crosses a page boundary.
      if (word.page_number !== page) continue;
      const key = `${surah}:${ayah}:${word.position}`;
      const order = surah * 1_000_000 + ayah * 1_000 + word.position;
      if (
        ids.has(word.id) ||
        references.has(key) ||
        word.line_number < previousLine ||
        order <= previousReference
      )
        throw new TypeError('Duplicate or out-of-order Mushaf word');
      ids.add(word.id);
      references.add(key);
      previousLine = word.line_number;
      previousReference = order;
      const line = lines[word.line_number - 1]!;
      line.kind = 'ayah';
      const start = line.text.length + (line.tokens.length ? 1 : 0);
      line.text += (line.tokens.length ? ' ' : '') + word.text_qpc_hafs;
      const candidate = { surah, ayah, word: word.position };
      line.tokens.push({
        id: word.id,
        candidate,
        text: word.text_qpc_hafs,
        sourceText: word.text_uthmani,
        kind: word.char_type_name,
        line: word.line_number,
        start,
        end: line.text.length,
        alignment:
          word.char_type_name === 'end'
            ? { status: 'unavailable', reason: 'end-marker' }
            : resolve(candidate, word.text_uthmani),
      });
    }
  }
  if (!ids.size) throw new TypeError('No words on requested Mushaf page');
  // The official API guide reserves empty line slots immediately before a surah's
  // first word for its heading/basmallah. Do not fill other empty slots by guessing.
  for (const line of lines) {
    const first = line.tokens[0];
    if (!first || first.candidate.ayah !== 1 || first.candidate.word !== 1) continue;
    const surah = first.candidate.surah;
    const count = surah === 1 || surah === 9 ? 1 : 2;
    const slots = lines.slice(line.number - 1 - count, line.number - 1);
    if (
      line.number <= count ||
      slots.length !== count ||
      slots.some((slot) => slot.kind !== 'blank')
    )
      throw new TypeError('Missing source heading slots');
    slots[0]!.kind = 'surah_name';
    slots[0]!.surah = surah;
    slots[0]!.centered = true;
    if (count === 2) {
      slots[1]!.kind = 'basmallah';
      slots[1]!.centered = true;
    }
  }
  return { edition: SELECTABLE_MUSHAF.id, sourceMushafId: SELECTABLE_MUSHAF.mushafId, page, lines };
}

/** Exact original-script comparison is required before a candidate becomes a lexical reference. */
export function verifyMushafWord(
  reference: CanonicalMushafWord,
  sourceText: string,
  originalWord: { position: number; arabic: string } | undefined,
): MushafWordAlignment {
  return originalWord?.position === reference.word && originalWord.arabic === sourceText
    ? { status: 'verified', reference }
    : { status: 'unavailable', reason: 'source-mismatch' };
}
