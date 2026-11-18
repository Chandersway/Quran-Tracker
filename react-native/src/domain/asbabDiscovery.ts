/** Provider-independent coverage index, supplied by the study service. */
type AsbabAvailability = ReadonlyMap<number, ReadonlyMap<number, readonly number[]>>;

export type StudyReference = { surah: number; ayah: number };
export function hasAsbab(
  index: AsbabAvailability,
  references: readonly StudyReference[],
  book?: number,
): boolean {
  const books = book === undefined ? [...index.keys()] : [book];
  return books.some((id) =>
    references.some((ref) => index.get(id)?.get(ref.surah)?.includes(ref.ayah)),
  );
}
export function availableAsbabBooks(
  index: AsbabAvailability,
  references?: readonly StudyReference[],
): number[] {
  return [...index.keys()].filter((book) =>
    references
      ? hasAsbab(index, references, book)
      : [...(index.get(book)?.values() ?? [])].some((ayahs) => ayahs.length > 0),
  );
}
export function availableAsbabSurahs(index: AsbabAvailability, book: number): number[] {
  return [...(index.get(book)?.entries() ?? [])]
    .filter(([, ayahs]) => ayahs.length > 0)
    .map(([surah]) => surah)
    .sort((a, b) => a - b);
}
export function availableAsbabAyahs(
  index: AsbabAvailability,
  book: number,
  surah: number,
): readonly number[] {
  return index.get(book)?.get(surah) ?? [];
}
