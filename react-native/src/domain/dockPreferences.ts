export const dockDestinationIds = [
  'stats',
  'mushaf',
  'groups',
  'surah',
  'hizb',
  'juz',
  'mutashabihat',
  'notes',
  'focus',
  'checklist',
  'library',
  'agenda',
  'lexicon',
  'study',
  'books',
] as const;
export type DockDestinationId = (typeof dockDestinationIds)[number];
export const defaultDockDestinations: DockDestinationId[] = ['stats', 'mushaf', 'groups'];
export const maxDockDestinations = 3;

/** Common reading indexes stay one tap away; custom pins and their saved limit are preserved. */
export function visibleDockDestinations(pinned: DockDestinationId[]): DockDestinationId[] {
  return [...new Set<DockDestinationId>([...pinned, 'surah', 'hizb', 'juz'])];
}

/** Missing or malformed preferences use defaults; an explicitly empty selection is valid. */
export function normalizeDockDestinations(value: unknown): DockDestinationId[] {
  if (!Array.isArray(value)) return [...defaultDockDestinations];
  const result: DockDestinationId[] = [];
  for (const item of value) {
    const mapped = item === 'quran' ? 'mushaf' : item;
    if (typeof mapped === 'string' && (dockDestinationIds as readonly string[]).includes(mapped)) {
      const id = mapped as DockDestinationId;
      if (!result.includes(id)) result.push(id);
      if (result.length === maxDockDestinations) break;
    }
  }
  return value.length > 0 && result.length === 0 ? [...defaultDockDestinations] : result;
}
