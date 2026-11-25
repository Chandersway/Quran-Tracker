import React, { useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { chapterById } from '../../../content/quran';
import type { Ayah } from '../../../content/types';
import { getAyahTranslation } from '../../../content/translations';
import { useAppStore } from '../../../state/store';
import { useAppNavigation } from '../../../app/navigation/types';
import { Button, Sheet, T, type IconName } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { TranslationControl } from './ReadingModeSwitch';
import { selectionQuote, selectionVerses } from '../../../domain/ayahSelection';
import { hasAsbab } from '../../../domain/asbabDiscovery';
import {
  loadAsbabAvailability,
  type AsbabAvailability,
} from '../../../services/study/studyProviders';

export type SelectedAyah = Ayah & { surah: number };
type Action = { key: string; icon: IconName; run: () => void };
export function AyahActionsSheet({
  ayah,
  onClose,
  onRepeat,
  onPlay,
  onError,
  relatedAyahs,
  onReadText,
  sourceReference,
}: {
  ayah: SelectedAyah | null;
  onClose: () => void;
  onRepeat?: (surah: number, ayah: number, endAyah?: number) => void;
  onPlay?: (surah: number) => void;
  relatedAyahs?: SelectedAyah[];
  sourceReference?: { surah: number; ayah: number; edition: 'warsh' };
  onReadText?: (surah: number, ayah: number) => void;
  onError: (error: string) => void;
}) {
  const { state, dispatch } = useAppStore();
  const nav = useAppNavigation();
  const { t, format } = useI18n();
  const [asbabIndex, setAsbabIndex] = useState<AsbabAvailability | null>(null);
  useEffect(() => {
    if (!ayah) return;
    let active = true;
    void loadAsbabAvailability()
      .then((index) => {
        if (active) setAsbabIndex(index);
      })
      .catch(() => {
        if (active) setAsbabIndex(null);
      });
    return () => {
      active = false;
    };
  }, [ayah?.surah, ayah?.number]);
  if (!ayah) return null;
  const chapter = chapterById(ayah.surah);
  const verses = selectionVerses(ayah, relatedAyahs);
  // Preserve the source copy/share contract: Arabic text followed by its citation.
  const quote = selectionQuote(verses);
  const closeAnd = (action: () => void) => {
    onClose();
    action();
  };
  const saved = state.bookmarks.some(
    (item) => item.surah === ayah.surah && item.ayah === ayah.number,
  );
  const fixedReferences = verses.map((item) => ({
    surah: item.surah,
    ayah: item.number,
  }));
  const openSource = (kind: 'irab' | 'asbab') =>
    closeAnd(() =>
      nav.navigate('StudySources', {
        surah: ayah.surah,
        ayah: ayah.number,
        kind,
        autoLoad: true,
        fixedReferences,
        ...(sourceReference
          ? { warshReference: { surah: sourceReference.surah, ayah: sourceReference.ayah } }
          : {}),
      }),
    );
  const actions: Action[] = [
    ...(onReadText
      ? [
          {
            key: 'reader.readText',
            icon: 'book-open' as const,
            run: () => closeAnd(() => onReadText(ayah.surah, ayah.number)),
          },
        ]
      : []),
    {
      key: 'inline.QuranReaderScreen.1bac400788',
      icon: saved ? 'check-circle' : 'bookmark',
      run: () =>
        dispatch({ type: 'bookmark', surah: ayah.surah, ayah: ayah.number, now: Date.now() }),
    },
    {
      key: 'inline.QuranReaderScreen.e21f935f11',
      icon: 'copy',
      run: () => {
        void Clipboard.setStringAsync(quote)
          .then(onClose)
          .catch(() => onError(t('checklist.error')));
      },
    },
    {
      key: 'inline.QuranReaderScreen.29887a5ff9',
      icon: 'share-2',
      run: () => {
        void Share.share({ message: quote }).catch(() => onError(t('checklist.error')));
      },
    },
    {
      key: 'inline.QuranReaderScreen.d8da2c49df',
      icon: 'edit-3',
      run: () => closeAnd(() => nav.navigate('Notes', { surah: ayah.surah, ayah: ayah.number })),
    },
    {
      key: 'inline.QuranReaderScreen.0a8be89a52',
      icon: 'layers',
      run: () =>
        closeAnd(() =>
          nav.navigate('Study', {
            surah: ayah.surah,
            ayah: ayah.number,
            mode: 'words',
            ...(fixedReferences.length > 1 ? { fixedReferences } : {}),
          }),
        ),
    },
    {
      key: 'inline.QuranReaderScreen.b6b7a00658',
      icon: 'repeat',
      run: () =>
        closeAnd(() =>
          onRepeat?.(
            ayah.surah,
            ayah.number,
            Math.max(
              ayah.number,
              ...fixedReferences.filter((ref) => ref.surah === ayah.surah).map((ref) => ref.ayah),
            ),
          ),
        ),
    },
    {
      key: 'irab.title',
      icon: 'type',
      run: () => openSource('irab'),
    },
    {
      key: 'asbab.title',
      icon: 'sun',
      run: () => openSource('asbab'),
    },
    {
      key: 'inline.QuranReaderScreen.436e61016e',
      icon: 'play',
      run: () => closeAnd(() => onPlay?.(ayah.surah)),
    },
  ];
  return (
    <Sheet
      visible
      title={`${chapter.nameAr} · ${format('app.quranAudioCurrentAyah', ayah.number)}`}
      onClose={onClose}
    >
      <TranslationControl />
      {verses.map((item) => (
        <View key={`${item.surah}:${item.number}`} style={{ marginBottom: 18 }}>
          <T arabic translate={false} selectable size={25}>
            {item.text}
          </T>
          {state.preferences.translation !== 'off' && (
            <T translate={false} selectable style={{ marginTop: 10 }}>
              {getAyahTranslation(item, state.preferences.translation)}
            </T>
          )}
        </View>
      ))}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {actions
          .filter(
            (action) =>
              (action.icon !== 'repeat' || onRepeat) &&
              (action.icon !== 'play' || onPlay) &&
              (action.key !== 'asbab.title' ||
                (!!asbabIndex && hasAsbab(asbabIndex, fixedReferences))),
          )
          .map((action) => (
            <Button
              key={action.key}
              title={t(action.key)}
              icon={action.icon}
              variant={action.icon === 'play' ? 'primary' : 'secondary'}
              onPress={action.run}
              style={{ width: '48%', flexGrow: 1 }}
            />
          ))}
      </View>
    </Sheet>
  );
}
