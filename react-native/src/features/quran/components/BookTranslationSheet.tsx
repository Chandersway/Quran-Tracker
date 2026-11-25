import React, { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { chapterById } from '../../../content/quran';
import { availableTranslations, getAyahTranslation } from '../../../content/translations';
import { bookTranslationVerses } from '../../../domain/bookTranslation';
import { useI18n } from '../../../i18n';
import type { BookPresentation, MushafEdition } from '../../../state/models';
import { useAppStore } from '../../../state/store';
import { Button, Segments, Sheet, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { isShortLandscape } from '../layout/readingLayout';

/** Local curated translations remain readable even when the online book layer is unavailable. */
export function BookTranslationSheet({
  visible,
  edition,
  pages,
  bookPresentation,
  onClose,
  onReadText,
}: {
  visible: boolean;
  edition: MushafEdition;
  pages: number[];
  bookPresentation?: BookPresentation;
  onClose: () => void;
  onReadText: (surah: number, ayah: number) => void;
}) {
  const { state, dispatch } = useAppStore();
  const { t, format, locale } = useI18n();
  const p = usePalette();
  const window = useWindowDimensions();
  const shortLandscape = isShortLandscape(window.width, window.height);
  const language =
    state.preferences.translation === 'off'
      ? locale === 'nl'
        ? 'nl'
        : 'en'
      : state.preferences.translation;
  const verses = useMemo(
    () => (visible ? bookTranslationVerses(edition, pages, bookPresentation) : []),
    [visible, edition, pages, bookPresentation],
  );
  return (
    <Sheet visible={visible} title={t('navigation.translation')} onClose={onClose}>
      <Segments
        value={language}
        options={availableTranslations.map((item) => ({
          value: item.id,
          label: t(item.labelKey),
        }))}
        onChange={(translation) => dispatch({ type: 'preferences', patch: { translation } })}
      />
      {!shortLandscape && (
        <T muted size={13} style={{ marginTop: 8, marginBottom: 12 }}>
          {t('ui.bookTranslation.explanation')}
        </T>
      )}
      {!verses.length ? (
        <T>{t('ui.bookTranslation.unmapped')}</T>
      ) : (
        verses.map(({ key, surah, ayah }) => (
          <View
            key={key}
            style={{
              paddingVertical: shortLandscape ? 12 : 18,
              gap: 12,
              borderTopWidth: 1,
              borderTopColor: p.line,
            }}
          >
            <T translate={false} bold size={14}>
              {`${chapterById(surah).name} · ${surah}:${ayah.number}`}
            </T>
            <T
              selectable
              translate={false}
              size={19}
              style={{ lineHeight: 31, textAlign: 'left', writingDirection: 'ltr' }}
            >
              {getAyahTranslation(ayah, language)}
            </T>
            <Button
              title={format('ui.bookTranslation.continueAt', `${surah}:${ayah.number}`)}
              icon="book-open"
              variant="quiet"
              style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
              onPress={() => onReadText(surah, ayah.number)}
            />
          </View>
        ))
      )}
    </Sheet>
  );
}
