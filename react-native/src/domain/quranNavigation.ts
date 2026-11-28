import warshStarts from '../content/generated/warsh_rub_starts.json';
import { chapters, divisions, getAyahs, normalizeSearch } from '../content/quran';
import { hafsReferences, pageSegments } from '../content/mushafGeometry';
import type { Ayah, Division } from '../content/types';
import type { MushafEdition } from '../state/models';
import type { ReadingContext } from './readingContext';

export type RubStart = { surah: number; ayah: number; page: number; printedAyah: number };

/** Rub, hizb and juz navigation use the separately verified Warsh boundaries. */
export function resolveRubStart(edition: MushafEdition, hizb: number, quarter: number): RubStart {
  if (
    !Number.isInteger(hizb) ||
    hizb < 1 ||
    hizb > 60 ||
    !Number.isInteger(quarter) ||
    quarter < 1 ||
    quarter > 4
  )
    throw new RangeError('Invalid rub');
  const id = (hizb - 1) * 4 + quarter;
  if (edition !== 'warsh_maknoon') {
    const start = divisions[id - 1]!;
    return { surah: start.surah, ayah: start.ayah, page: start.page, printedAyah: start.ayah };
  }
  const start = warshStarts.starts[id - 1];
  if (
    warshStarts.schemaVersion !== 1 ||
    warshStarts.edition !== edition ||
    warshStarts.status !== 'printed_boundaries_validated' ||
    warshStarts.starts.length !== 240 ||
    !start ||
    start.id !== id ||
    start.hizb !== hizb ||
    start.quarter !== quarter ||
    !pageSegments(edition, start.page).some(
      (row) => row.surah === start.surah && row.ayah === start.printedAyah,
    ) ||
    !hafsReferences(edition, start.surah, start.printedAyah).includes(start.ayah)
  )
    throw new Error('Unverified Warsh rub boundary');
  return { surah: start.surah, ayah: start.ayah, page: start.page, printedAyah: start.printedAyah };
}

/** Division rows as the chosen mushaf starts them; Warsh rows use the verified Warsh starts. */
let warshDivisions: Division[] | undefined;
export function editionDivisions(edition: MushafEdition): Division[] {
  if (edition !== 'warsh_maknoon') return divisions;
  warshDivisions ??= divisions.map((division) => {
    const start = resolveRubStart(edition, division.hizb, division.quarter);
    return { ...division, surah: start.surah, ayah: start.ayah, page: start.page };
  });
  return warshDivisions;
}

function warshTargetStart(
  target: NonNullable<ReadingContext['readingTarget']>,
): { hizb: number; quarter: number } | null {
  if (target.kind === 'rub') return { hizb: target.number, quarter: target.subId ?? 1 };
  if (target.kind === 'hizb') return { hizb: target.number, quarter: 1 };
  if (target.kind === 'juz') return { hizb: (target.number - 1) * 2 + 1, quarter: 1 };
  return null;
}

export function resolveReaderEntry<T extends ReadingContext>(
  context: T,
  edition: MushafEdition,
  positions: Readonly<Record<string, number>> = {},
): T & Pick<ReadingContext, 'ayah' | 'page'> {
  // A saved page, selection return or text/book handoff is already an exact location.
  if (context.page !== undefined || context.selectionOrigin || context.bookView) return context;
  const target = context.readingTarget;
  const warshStart = target && edition === 'warsh_maknoon' ? warshTargetStart(target) : null;
  if (warshStart) {
    // Warsh opens some hizbs (2, 7, 10, 12) at a different ayah than Hafs.
    const start = resolveRubStart(edition, warshStart.hizb, warshStart.quarter);
    // Preserve canonical range ends: the partition's reading registration remains independent.
    return { ...context, surah: start.surah, ayah: start.ayah, page: start.page };
  }
  if (context.ayah !== undefined || context.endSurah !== undefined || target) return context;
  const saved = positions[String(context.surah)];
  return Number.isInteger(saved) &&
    saved! >= 1 &&
    saved! <= (chapters[context.surah - 1]?.verseCount ?? 0)
    ? { ...context, ayah: saved }
    : context;
}

export type QuranSearchResult = Ayah & { surah: number; matched: 'ar' | 'nl' | 'en' };
let searchIndex:
  | Array<{ verse: Ayah; surah: number; ar: string; nl: string; en: string }>
  | undefined;

/** One local index covers the preserved Arabic and both translations, independent of the open surah. */
export function searchQuran(query: string, limit = 40): QuranSearchResult[] {
  const term = normalizeSearch(query.trim());
  if (!term || !Number.isInteger(limit) || limit < 1) return [];
  searchIndex ??= chapters.flatMap((chapter) =>
    getAyahs(chapter.id).map((verse) => ({
      verse,
      surah: chapter.id,
      ar: normalizeSearch(verse.text),
      nl: normalizeSearch(verse.nl),
      en: normalizeSearch(verse.en),
    })),
  );
  const results: QuranSearchResult[] = [];
  for (const row of searchIndex) {
    const matched = (['ar', 'nl', 'en'] as const).find((language) => row[language].includes(term));
    if (matched) results.push({ ...row.verse, surah: row.surah, matched });
    if (results.length >= limit) break;
  }
  return results;
}
