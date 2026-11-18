import { mushafPageRange } from '../../../domain/mushafReading';
import type { MushafEdition } from '../../../state/models';

/** A last-known cursor cannot identify the contents of an unmapped printed page. */
export function resumeReference(resume: {
  edition: MushafEdition;
  page?: number;
  surah: number;
  ayah?: number;
}): { surah: number; ayah: number } | undefined {
  const point = { surah: resume.surah, ayah: resume.ayah ?? 1 };
  if (resume.page === undefined) return point;
  const range = mushafPageRange(resume.edition, resume.page);
  if (!range) return undefined;
  const key = (value: typeof point) => value.surah * 1000 + value.ayah;
  return key(point) >= key(range.start) && key(point) <= key(range.end) ? point : range.start;
}
