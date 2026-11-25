import type { IconName } from '../../shared/components';
import type { DockSymbol } from './DockGlyph';
import type { DockDestinationId } from '../../domain/dockPreferences';

export type DockDestination = {
  id: DockDestinationId;
  label: string;
  icon: IconName;
  glyph?: DockSymbol;
  tab?: 'Today' | 'Circle' | 'Quran' | 'Practice' | 'Juz' | 'Plan';
  group: 'reading' | 'practice' | 'organize';
};

/** The same catalog drives the dock, More, and its selector. */
export const dockDestinations: DockDestination[] = [
  {
    id: 'stats',
    group: 'practice',
    label: 'app.stats',
    icon: 'pie-chart',
    glyph: 'stats',
    tab: 'Today',
  },
  { id: 'mushaf', group: 'reading', label: 'app.mushaf', icon: 'book-open', glyph: 'surah' },
  {
    id: 'groups',
    group: 'organize',
    label: 'app.groups',
    icon: 'users',
    glyph: 'groups',
    tab: 'Circle',
  },
  { id: 'surah', group: 'reading', label: 'app.surah', icon: 'book', glyph: 'surah', tab: 'Quran' },
  {
    id: 'hizb',
    group: 'reading',
    label: 'app.hizb',
    icon: 'layers',
    glyph: 'hizb',
    tab: 'Practice',
  },
  { id: 'juz', group: 'reading', label: 'app.juz', icon: 'grid', glyph: 'juz', tab: 'Juz' },
  { id: 'mutashabihat', group: 'reading', label: 'navigation.mutashabihat', icon: 'repeat' },
  { id: 'notes', group: 'organize', label: 'navigation.notes', icon: 'edit-3' },
  { id: 'focus', group: 'practice', label: 'focus.menuTitle', icon: 'clock' },
  { id: 'checklist', group: 'practice', label: 'checklist.title', icon: 'check-square' },
  { id: 'library', group: 'reading', label: 'ui.nav.library', icon: 'download' },
  { id: 'agenda', group: 'organize', label: 'app.agenda', icon: 'calendar', tab: 'Plan' },
  { id: 'lexicon', group: 'reading', label: 'lexicon', icon: 'search' },
  { id: 'study', group: 'reading', label: 'study', icon: 'book-open' },
  { id: 'books', group: 'reading', label: 'books', icon: 'book' },
];
