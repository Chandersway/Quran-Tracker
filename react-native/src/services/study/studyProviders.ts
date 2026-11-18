import { gunzipSync, strFromU8 } from 'fflate';
import { chapters } from '../../content/quran';

export const tafsirProviders = [
  {
    name: 'Tafsir al-Tabari',
    slug: 'ar-tafsir-al-tabari',
    subtitle: '\u0627\u0644\u0637\u0628\u0631\u064a',
  },
  {
    name: 'Tafsir Ibn Kathir',
    slug: 'ar-tafsir-ibn-kathir',
    subtitle: '\u0627\u0628\u0646 \u0643\u062b\u064a\u0631',
  },
  {
    name: "Tafsir as-Sa'di",
    slug: 'ar-tafseer-al-saddi',
    subtitle: '\u0627\u0644\u0633\u0639\u062f\u064a',
  },
  {
    name: 'Tafsir al-Baghawi',
    slug: 'ar-tafsir-al-baghawi',
    subtitle: '\u0627\u0644\u0628\u063a\u0648\u064a',
  },
  {
    name: 'Tafsir al-Qurtubi',
    slug: 'ar-tafseer-al-qurtubi',
    subtitle: '\u0627\u0644\u0642\u0631\u0637\u0628\u064a',
  },
  {
    name: 'Tafsir al-Muyassar',
    slug: 'ar-tafsir-muyassar',
    subtitle: '\u0627\u0644\u0645\u064a\u0633\u0631',
  },
  {
    name: 'Tafsir al-Wasit',
    slug: 'ar-tafsir-al-wasit',
    subtitle: '\u0627\u0644\u0648\u0633\u064a\u0637',
  },
  {
    name: 'Tanwir al-Miqbas',
    slug: 'ar-tafseer-tanwir-al-miqbas',
    subtitle: '\u062a\u0646\u0648\u064a\u0631 \u0627\u0644\u0645\u0642\u0628\u0627\u0633',
  },
] as const;

export const translationProviders = [
  { id: 'en.sahih', name: 'Saheeh International', language: 'English', assetFile: 'en_sahih.json' },
  {
    id: 'nl.siregar',
    name: 'Sofian S. Siregar',
    language: 'Nederlands',
    assetFile: 'nl_siregar.json',
  },
] as const;

export const irabBooks = [
  { id: 316, name: '\u0627\u0644\u062f\u0639\u0627\u0633' },
  { id: 309, name: '\u0627\u0644\u0639\u0643\u0628\u0631\u064a' },
] as const;
export const asbabBooks = [
  { id: 2919, name: '\u0627\u0644\u0648\u0627\u062d\u062f\u064a' },
  {
    id: 460,
    name: '\u0627\u0644\u0645\u062d\u0631\u0631 \u2014 \u0627\u0644\u0645\u0632\u064a\u0646\u064a',
  },
] as const;

export type AsbabAvailability = ReadonlyMap<number, ReadonlyMap<number, readonly number[]>>;
export type IrabFragment = { html: string; part: string; page: string };
export type IrabResult = { id: number; name: string; author: string; fragments: IrabFragment[] };
export type Fetcher = typeof fetch;

export function isValidAyah(surah: number, ayah: number): boolean {
  const chapter = chapters[surah - 1];
  return (
    Number.isInteger(surah) &&
    Number.isInteger(ayah) &&
    !!chapter &&
    ayah >= 1 &&
    ayah <= chapter.verseCount
  );
}

export function parseAsbabIndex(payload: unknown): AsbabAvailability {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as { data?: unknown }).data)
  ) {
    throw new Error('Invalid asbab availability payload');
  }
  const data = (payload as { data: unknown[] }).data;
  const entries = new Map<number, Map<number, Set<number>>>();
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const row = item as { surah?: unknown; ayah?: unknown; asbab?: unknown };
    const surah = Number(row.surah);
    const ayah = Number(row.ayah);
    if (!isValidAyah(surah, ayah) || !Array.isArray(row.asbab)) continue;
    for (const rawBook of row.asbab) {
      if (!rawBook || typeof rawBook !== 'object') continue;
      const book = Number((rawBook as { id?: unknown }).id);
      if (book !== 2919 && book !== 460) continue;
      const chaptersForBook = entries.get(book) ?? new Map<number, Set<number>>();
      const ayahs = chaptersForBook.get(surah) ?? new Set<number>();
      ayahs.add(ayah);
      chaptersForBook.set(surah, ayahs);
      entries.set(book, chaptersForBook);
    }
  }
  return new Map(
    [...entries].map(([book, bySurah]) => [
      book,
      new Map([...bySurah].map(([surah, ayahs]) => [surah, [...ayahs].sort((a, b) => a - b)])),
    ]),
  );
}

export function parseIrabResponse(payload: unknown, expectedBook: number): IrabResult {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid i\u02bfrab response');
  const root = payload as {
    book?: { id?: unknown; short_name?: unknown; name?: unknown; author?: { ar_name?: unknown } };
    content?: unknown;
  };
  const metadata = root.book;
  if (!metadata || Number(metadata.id) !== expectedBook || !Array.isArray(root.content))
    throw new Error('Unexpected i\u02bfrab response');
  const fragments = root.content.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as { text?: unknown; part?: unknown; page?: unknown; volume?: unknown };
    const label = (value: unknown) =>
      typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    if (typeof item.text !== 'string' || !item.text.trim()) return [];
    return [
      {
        html: item.text,
        part: label(item.part ?? item.volume),
        page: label(item.page),
      },
    ];
  });
  return {
    id: expectedBook,
    name:
      typeof metadata.name === 'string' && metadata.name.trim()
        ? metadata.name
        : String(metadata.short_name ?? ''),
    author: typeof metadata.author?.ar_name === 'string' ? metadata.author.ar_name : '',
    fragments,
  };
}

export function plainHtmlText(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(x[\da-f]+|\d+);/gi, (entity, value: string) => {
      const codepoint =
        value[0]?.toLowerCase() === 'x' ? Number.parseInt(value.slice(1), 16) : Number(value);
      return codepoint > 0 && codepoint <= 0x10ffff && !(codepoint >= 0xd800 && codepoint <= 0xdfff)
        ? String.fromCodePoint(codepoint)
        : entity;
    })
    .trim();
}

async function requireOk(response: Response): Promise<void> {
  if (response.status === 429) throw new Error('RATE_LIMIT');
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
}

async function timedRead<T>(
  fetcher: Fetcher,
  url: string,
  timeoutMs: number,
  read: (response: Response) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, timeoutMs);
  try {
    controller.signal.throwIfAborted();
    const response = await fetcher(url, { method: 'GET', signal: controller.signal });
    await requireOk(response);
    const value = await read(response);
    controller.signal.throwIfAborted();
    return value;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export async function loadTafsir(
  surah: number,
  ayah: number,
  slug: string,
  fetcher: Fetcher = fetch,
  signal?: AbortSignal,
): Promise<string> {
  if (!isValidAyah(surah, ayah) || !tafsirProviders.some((provider) => provider.slug === slug))
    throw new RangeError('Invalid tafsir reference/provider');
  const payload = await timedRead(
    fetcher,
    `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/${slug}/${surah}/${ayah}.json`,
    12_000,
    (response) => response.json() as Promise<{ text?: unknown }>,
    signal,
  );
  const text = typeof payload.text === 'string' ? payload.text.trim() : '';
  if (!text) throw new Error('EMPTY_TAFSIR');
  return text;
}

export async function loadIrab(
  surah: number,
  ayah: number,
  book: number,
  fetcher: Fetcher = fetch,
  signal?: AbortSignal,
): Promise<IrabResult> {
  if (!isValidAyah(surah, ayah) || ![316, 309, 2919, 460].includes(book))
    throw new RangeError('Invalid i\u02bfrab reference/provider');
  return timedRead(
    fetcher,
    `https://api.quranpedia.net/v1/ayah/${surah}/${ayah}/book/${book}`,
    15_000,
    async (response) => parseIrabResponse(await response.json(), book),
    signal,
  );
}

let cachedAvailability: Promise<AsbabAvailability> | null = null;
export function loadAsbabAvailability(fetcher: Fetcher = fetch): Promise<AsbabAvailability> {
  if (!cachedAvailability) {
    cachedAvailability = (async () => {
      return timedRead(
        fetcher,
        'https://api.quranpedia.net/dumps/asbab.json.gz',
        15_000,
        async (response) => {
          const bytes = new Uint8Array(await response.arrayBuffer());
          const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
          const json = isGzip ? strFromU8(gunzipSync(bytes)) : new TextDecoder().decode(bytes);
          return parseAsbabIndex(JSON.parse(json) as unknown);
        },
      );
    })();
    cachedAvailability.catch(() => {
      cachedAvailability = null;
    });
  }
  return cachedAvailability;
}

export function clearAsbabAvailabilityCache(): void {
  cachedAvailability = null;
}
