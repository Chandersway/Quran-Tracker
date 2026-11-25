import type { BookPresentation, MushafEdition } from '../state/models';

/** Transient image viewport, never a global reader preference or imported source value. */
export type BookView = { zoom: number; horizontalOffset: number; verticalAnchor: number };
export type BookSelectionOrigin = {
  routeKey?: string;
  edition: MushafEdition;
  originalEdition: MushafEdition;
  bookPresentation: BookPresentation;
  page: number;
  surah: number;
  ayah?: number;
  fullscreen?: boolean;
  bookView?: BookView;
};

/** Reading intent shared by the text/book policy and navigation. No router dependency. */
export type ReadingContext = {
  surah: number;
  ayah?: number;
  endSurah?: number;
  endAyah?: number;
  edition?: MushafEdition;
  page?: number;
  selectablePage?: boolean;
  fullscreen?: boolean;
  bookPresentation?: BookPresentation;
  originalEdition?: MushafEdition;
  bookView?: BookView;
  selectionOrigin?: BookSelectionOrigin;
  planId?: string;
  readingTarget?: {
    kind: 'surah' | 'juz' | 'hizb' | 'rub';
    number: number;
    subId?: number;
    amount?: number;
    name: string;
  };
};

export type MushafReadingContext = ReadingContext & {
  selectionMode?: boolean;
};
