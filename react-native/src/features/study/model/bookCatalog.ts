import bookMetadata from '../../../i18n/book-metadata.json';
import { restoreSourceCopy, screenSourceKeys } from '../../../i18n';
export type Language = 'en' | 'nl' | 'ar' | 'fr';
export type Book = {
  id: string;
  assetFile: string;
  titleAr: string;
  titleEn: string;
  author: string;
  summary: Record<Language, string>;
};
export type Strings = {
  title: string;
  subtitle: string;
  searchBooks: string;
  details: string;
  author: string;
  contents: string;
  book: string;
  page: string;
  loading: string;
  loadingBook: string;
  search: string;
  searchHint: string;
  results: string;
  noResults: string;
  open: string;
  previous: string;
  next: string;
  expand: string;
  collapse: string;
  back: string;
  error: string;
};
export const books: Book[] = bookMetadata;
export const copy: Record<Language, Strings> = {
  en: {
    title: 'Books',
    subtitle: 'Read fiqh texts by madhhab',
    searchBooks: 'Search books or authors',
    details: 'About this book',
    author: 'Author',
    contents: 'Contents',
    book: 'Book',
    page: 'Page {page} / {total}',
    loading: 'Loading...',
    loadingBook: 'Loading book...',
    search: 'Search in book',
    searchHint: 'Type Arabic text',
    results: '{count} results',
    noResults: 'No results found',
    open: 'Open book',
    previous: 'Previous page',
    next: 'Next page',
    expand: 'Show short biography',
    collapse: 'Show less',
    back: 'Back to books',
    error: 'Book content could not be loaded.',
  },
  nl: {
    title: 'Boeken',
    subtitle: 'Lees fiqhboeken per wetschool',
    searchBooks: 'Zoek boeken of auteurs',
    details: 'Over dit boek',
    author: 'Auteur',
    contents: 'Inhoudsopgave',
    book: 'Boek',
    page: 'Pagina {page} / {total}',
    loading: 'Laden...',
    loadingBook: 'Boek laden...',
    search: 'Zoek in boek',
    searchHint: 'Typ Arabische tekst',
    results: '{count} resultaten',
    noResults: 'Geen resultaten gevonden',
    open: 'Open boek',
    previous: 'Vorige pagina',
    next: 'Volgende pagina',
    expand: 'Korte biografie tonen',
    collapse: 'Minder tonen',
    back: 'Terug naar boeken',
    error: 'De boekinhoud kon niet worden geladen.',
  },
  ar: {
    title: '\u0627\u0644\u0643\u062a\u0628',
    subtitle:
      '\u0627\u0642\u0631\u0623 \u0643\u062a\u0628 \u0627\u0644\u0641\u0642\u0647 \u062d\u0633\u0628 \u0627\u0644\u0645\u0630\u0647\u0628',
    searchBooks:
      '\u0627\u0628\u062d\u062b \u0639\u0646 \u0643\u062a\u0627\u0628 \u0623\u0648 \u0645\u0624\u0644\u0641',
    details: '\u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0643\u062a\u0627\u0628',
    author: '\u0627\u0644\u0645\u0624\u0644\u0641',
    contents: '\u0627\u0644\u0641\u0647\u0631\u0633',
    book: '\u0627\u0644\u0643\u062a\u0627\u0628',
    page: '\u0635\u0641\u062d\u0629 {page} / {total}',
    loading: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
    loadingBook:
      '\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0643\u062a\u0627\u0628...',
    search: '\u0627\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0643\u062a\u0627\u0628',
    searchHint: '\u0627\u0643\u062a\u0628 \u0646\u0635\u0627 \u0639\u0631\u0628\u064a\u0627',
    results: '{count} \u0646\u062a\u064a\u062c\u0629',
    noResults: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c',
    open: '\u0627\u0641\u062a\u062d \u0627\u0644\u0643\u062a\u0627\u0628',
    previous: '\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629',
    next: '\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629',
    expand:
      '\u0625\u0638\u0647\u0627\u0631 \u0646\u0628\u0630\u0629 \u0645\u062e\u062a\u0635\u0631\u0629',
    collapse: '\u0639\u0631\u0636 \u0623\u0642\u0644',
    back: '\u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u0643\u062a\u0628',
    error:
      '\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0643\u062a\u0627\u0628.',
  },
  fr: {
    title: 'Livres',
    subtitle: 'Lire des textes de fiqh par ecole',
    searchBooks: 'Rechercher livres ou auteurs',
    details: 'A propos du livre',
    author: 'Auteur',
    contents: 'Table des matieres',
    book: 'Livre',
    page: 'Page {page} / {total}',
    loading: 'Chargement...',
    loadingBook: 'Chargement du livre...',
    search: 'Rechercher dans le livre',
    searchHint: 'Tape du texte arabe',
    results: '{count} resultats',
    noResults: 'Aucun resultat',
    open: 'Ouvrir le livre',
    previous: 'Page precedente',
    next: 'Page suivante',
    expand: 'Afficher une courte biographie',
    collapse: 'Afficher moins',
    back: 'Retour aux livres',
    error: 'Le contenu du livre est indisponible.',
  },
};
export function strings(language: string): Strings {
  const locale = language in copy ? (language as Language) : 'en';
  return restoreSourceCopy(locale, copy[locale], copy.en, screenSourceKeys.books);
}
