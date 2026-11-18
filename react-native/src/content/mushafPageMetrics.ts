import type { MushafEdition } from '../state/models';
import hafs from './generated/hafs-positions.json';
import warsh from './generated/warsh_maknoon_positions.json';
import muhammadi from './generated/muhammadi-positions.json';
import kfqc from './generated/hafs-kfqc-page-counts.json';

type Profile = {
  counts: readonly number[];
  prefix: readonly number[];
  minimum: number;
  maximum: number;
};
const profiles = new Map<MushafEdition, Profile | undefined>();

/** Geometry can split one printed ayah across several lines. Count it once. */
function countAyahs(rows: readonly (readonly number[])[]): number {
  return new Set(
    rows.filter((row) => row[0]! > 0 && row[1]! > 0).map((row) => `${row[0]}:${row[1]}`),
  ).size;
}

function profileFor(edition: MushafEdition): Profile | undefined {
  if (profiles.has(edition)) return profiles.get(edition);
  let counts: number[] | undefined;
  switch (edition) {
    case 'hafs':
      counts = Array.from({ length: 604 }, (_, page) =>
        countAyahs((hafs as Record<string, number[][]>)[String(page + 1)] ?? []),
      );
      break;
    case 'warsh_maknoon':
      counts = Array.from({ length: 604 }, (_, page) =>
        countAyahs(
          (warsh as Record<string, { segments: number[][] }>)[String(page + 1)]?.segments ?? [],
        ),
      );
      break;
    case 'muhammadi':
      // This source has an empty sentinel at index zero, not a cover page.
      counts = muhammadi.slice(1).map(countAyahs);
      break;
    case 'hafs_maknoon':
      counts = kfqc.counts;
      break;
    case 'hafs_madina_pdf':
      // The complete publisher PDF contains a cover, then 604 printed pages.
      // Its native page index must not be confused with a printed page number.
      counts = [0, ...kfqc.counts];
      break;
    default:
      // A different publisher/PDF is not evidence of the same pagination.
      // Leave its ticks neutral until its own page map has been verified.
      profiles.set(edition, undefined);
      return undefined;
  }
  const prefix = [0];
  for (const count of counts) prefix.push(prefix[prefix.length - 1]! + count);
  const profile = {
    counts,
    prefix,
    minimum: Math.min(...counts),
    maximum: Math.max(...counts),
  };
  profiles.set(edition, profile);
  return profile;
}

export function mushafPageAyahCount(edition: MushafEdition, page: number): number | undefined {
  if (!Number.isInteger(page) || page < 1) return undefined;
  return profileFor(edition)?.counts[page - 1];
}

/**
 * A phone-width overview groups pages into ticks. Use the mean ayah count of
 * each inclusive range, normalized against this exact edition's page extrema.
 * `pageCount` must match: a PDF cover or a different edition must not shift data.
 */
export function mushafPageDensity(
  edition: MushafEdition,
  pageCount: number,
  firstPage: number,
  lastPage: number,
): number | undefined {
  const profile = profileFor(edition);
  if (
    !profile ||
    pageCount !== profile.counts.length ||
    !Number.isInteger(firstPage) ||
    !Number.isInteger(lastPage) ||
    firstPage < 1 ||
    lastPage > pageCount ||
    firstPage > lastPage
  )
    return undefined;
  const mean =
    (profile.prefix[lastPage]! - profile.prefix[firstPage - 1]!) / (lastPage - firstPage + 1);
  if (profile.minimum === profile.maximum) return 0.5;
  return (mean - profile.minimum) / (profile.maximum - profile.minimum);
}
