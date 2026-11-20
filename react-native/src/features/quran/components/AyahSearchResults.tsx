import React from 'react';
import { Pressable, View } from 'react-native';
import { chapterById } from '../../../content/quran';
import type { QuranSearchResult } from '../../../domain/quranNavigation';
import { useI18n } from '../../../i18n';
import { T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';

export const quranSearchCopy = {
  nl: {
    placeholder: 'Zoek soera, Arabische tekst of NL/EN-vertaling',
    results: 'Ayaat in de hele Quran',
    empty: 'Geen ayaat gevonden. Probeer een kortere tekst.',
    limit: 'Eerste 40 resultaten. Verfijn je zoekopdracht voor meer gerichte resultaten.',
  },
  en: {
    placeholder: 'Search surahs, Arabic or NL/EN translations',
    results: 'Ayahs across the Quran',
    empty: 'No ayahs found. Try a shorter phrase.',
    limit: 'First 40 matches. Refine your search for more specific results.',
  },
  ar: {
    placeholder: 'ابحث عن سورة أو نص عربي أو ترجمة هولندية/إنجليزية',
    results: 'آيات من القرآن كله',
    empty: 'لم يتم العثور على آيات. جرّب عبارة أقصر.',
    limit: 'أول ٤٠ نتيجة. حدّد البحث للحصول على نتائج أدق.',
  },
} as const;

export function AyahSearchResults({
  results,
  onOpen,
}: {
  results: QuranSearchResult[];
  onOpen: (result: QuranSearchResult) => void;
}) {
  const p = usePalette();
  const { locale } = useI18n();
  const copy = quranSearchCopy[locale];
  return (
    <View style={{ paddingVertical: 16, gap: 8 }}>
      <T bold size={17}>
        {copy.results}
      </T>
      {!results.length && <T muted>{copy.empty}</T>}
      {results.map((result) => (
        <Pressable
          key={`${result.surah}:${result.number}`}
          accessibilityRole="button"
          onPress={() => onOpen(result)}
          style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: p.line, gap: 8 }}
        >
          <T bold color={p.primary}>
            {chapterById(result.surah).name} · {result.surah}:{result.number}
          </T>
          <T arabic translate={false} numberOfLines={3} size={22}>
            {result.text}
          </T>
          {result.matched !== 'ar' && (
            <T translate={false} numberOfLines={3} muted>
              {result[result.matched]}
            </T>
          )}
        </Pressable>
      ))}
      {results.length >= 40 && (
        <T size={12} muted>
          {copy.limit}
        </T>
      )}
    </View>
  );
}
