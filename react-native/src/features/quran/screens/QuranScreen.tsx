import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import {
  chapters,
  divisions,
  chapterById,
  divisionEnd,
  getAyahs,
  normalizeSearch,
} from '../../../content/quran';
import type { Division } from '../../../content/types';
import { Empty, Field, Icon, IconButton, Screen, Segments, T, s } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppNavigation } from '../../../app/navigation/types';
import { useAppStore } from '../../../state/store';
import { useI18n } from '../../../i18n';
import { SurahActionsSheet } from '../components/SurahActionsSheet';
import { HizbOpeningPreview, HizbTitle } from '../components/HizbOpeningPreview';
import { PartActionsSheet, type PartActionTarget } from '../components/PartActionsSheet';
import { AyahSearchResults, quranSearchCopy } from '../components/AyahSearchResults';
import { searchQuran } from '../../../domain/quranNavigation';
import { hifzCardColors } from '../../../domain/hifzPresentation';
import { NoteCountButton } from '../../notes/components/NoteCountButton';
import {
  bookmarkEditionName,
  pageBookmarkKey,
  savedBookmarkTarget,
} from '../../bookmarks/bookmarks';

const partOpenHint = {
  nl: 'Tik op een deel om het te openen en te lezen. Houd ingedrukt of tik op ··· voor meer acties.',
  en: 'Tap a part to open and read it. Long-press or tap ··· for more actions.',
  ar: 'اضغط على الجزء لفتحه وقراءته. اضغط مطولًا أو على ··· لمزيد من الإجراءات.',
} as const;

export function QuranScreen() {
  const nav = useAppNavigation();
  const p = usePalette();
  const { state } = useAppStore();
  const { t, format, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedPart, setSelectedPart] = useState<{
    target: PartActionTarget;
    division: Division;
  } | null>(null);
  const [mode, setMode] = useState<'surah' | 'juz' | 'hizb' | 'rub' | 'saved'>('surah');
  const filtered = useMemo(() => {
    const q = normalizeSearch(query.trim());
    return chapters.filter(
      (c) => !q || normalizeSearch(`${c.id} ${c.name} ${c.nameAr}`).includes(q),
    );
  }, [query]);
  const ayahResults = useMemo(() => (query.trim().length >= 2 ? searchQuran(query) : []), [query]);
  const parts =
    mode === 'juz'
      ? divisions.filter((d) => (d.id - 1) % 8 === 0)
      : mode === 'hizb'
        ? divisions.filter((d) => d.quarter === 1)
        : divisions;
  const saved = [
    ...state.bookmarks.map((b) => ({ kind: 'ayah' as const, ...b })),
    ...state.mushafBookmarks.map((b) => ({ kind: 'page' as const, ...b })),
  ];
  function openPart(
    d: Division,
    kind: 'juz' | 'hizb' | 'rub' = mode === 'juz' ? 'juz' : mode === 'hizb' ? 'hizb' : 'rub',
  ) {
    const count = kind === 'juz' ? 8 : kind === 'hizb' ? 4 : 1;
    const end = divisionEnd(d.id + count - 1);
    const number = kind === 'juz' ? Math.ceil(d.id / 8) : d.hizb;
    nav.navigate('Mushaf', {
      surah: d.surah,
      ayah: d.ayah,
      endSurah: end.surah,
      endAyah: end.ayah,
      readingTarget: {
        kind,
        number,
        subId: kind === 'rub' ? d.quarter : 0,
        name: `${kind} ${kind === 'rub' ? d.id : number}`,
      },
    });
  }
  function partActions(d: Division) {
    const kind = mode === 'juz' ? 'juz' : mode === 'hizb' ? 'hizb' : 'rub';
    setSelectedPart({
      division: d,
      target: {
        kind,
        number: kind === 'juz' ? Math.ceil(d.id / 8) : d.hizb,
        subId: kind === 'rub' ? d.quarter : 0,
      },
    });
  }
  return (
    <Screen scroll={false} style={{ paddingBottom: 0 }}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
        <T translate={false} bold size={32} style={{ letterSpacing: -0.8 }}>
          {t('app.surah')}
        </T>
        <IconButton name="book" label="Open library" onPress={() => nav.navigate('Books')} />
      </View>
      <T translate={false} muted style={{ marginBottom: 20 }}>
        {t('app.readerSubtitle')}
      </T>
      <Field
        label={quranSearchCopy[locale].placeholder}
        placeholder={quranSearchCopy[locale].placeholder}
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          if (value.trim() && !/^\d+$/.test(value.trim())) setMode('surah');
        }}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      <Segments
        layout="wrap"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'surah', label: 'Surahs' },
          { value: 'juz', label: 'Juz' },
          { value: 'hizb', label: 'Hizb' },
          { value: 'rub', label: 'Rub' },
          { value: 'saved', label: 'Saved' },
        ]}
      />
      {mode === 'juz' || mode === 'hizb' || mode === 'rub' ? (
        <T translate={false} muted size={13} style={{ marginTop: 8 }}>
          {partOpenHint[locale]}
        </T>
      ) : null}
      {mode === 'surah' ? (
        <FlatList
          data={filtered}
          keyExtractor={(c) => String(c.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListFooterComponent={
            query.trim().length >= 2 ? (
              <AyahSearchResults
                results={ayahResults}
                onOpen={(result) =>
                  nav.navigate('Mushaf', { surah: result.surah, ayah: result.number })
                }
              />
            ) : undefined
          }
          ListEmptyComponent={
            query.trim().length >= 2 ? undefined : (
              <Empty
                title="No surah found"
                message="Try its number, Arabic name, or a shorter spelling."
              />
            )
          }
          renderItem={({ item: c }) => (
            <View
              style={[
                s.listRow,
                { borderBottomColor: p.line },
                hifzCardColors(
                  state.progress[`surah_${c.id}`],
                  state.preferences.hifzColorsEnabled,
                ),
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${format(c.verseCount === 1 ? 'surah.ayahCount.one' : 'surah.ayahCount.other', c.verseCount)}`}
                onPress={() => nav.navigate('Mushaf', { surah: c.id, ayah: 1 })}
                onLongPress={() => setSelectedSurah(c.id)}
                style={({ pressed }) => [
                  s.row,
                  { flex: 1, minHeight: 48, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: p.subtle,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T bold size={13} color={p.primary}>
                    {c.id}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T translate={false} bold size={17}>
                    {c.name}
                  </T>
                  <T translate={false} muted size={12}>
                    {format(
                      c.verseCount === 1 ? 'surah.ayahCount.one' : 'surah.ayahCount.other',
                      c.verseCount,
                    )}
                  </T>
                </View>
                <T arabic translate={false} size={24} color={p.primary} style={{ maxWidth: '40%' }}>
                  {c.nameAr}
                </T>
                {state.progress[`surah_${c.id}`]?.isRead && (
                  <Icon name="check-circle" size={15} color={p.primary} />
                )}
              </Pressable>
              <NoteCountButton target={{ scope: 'surah', number: c.id }} />
              <IconButton
                name="more-horizontal"
                label={`${t('app.actions')}: ${c.name}`}
                onPress={() => setSelectedSurah(c.id)}
              />
            </View>
          )}
        />
      ) : mode === 'saved' ? (
        <FlatList
          data={saved.reverse()}
          keyExtractor={(b) =>
            b.kind === 'ayah' ? `ayah:${b.surah}:${b.ayah}` : pageBookmarkKey(b)
          }
          ListEmptyComponent={
            <Empty icon="bookmark" title={t('app.bookmarks')} message={t('app.noBookmarks')} />
          }
          renderItem={({ item: b }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => nav.navigate('Mushaf', savedBookmarkTarget(b))}
              style={[s.listRow, { borderBottomColor: p.line }]}
            >
              <Icon name="bookmark" color={p.primary} />
              <View style={{ flex: 1 }}>
                <T translate={false} bold>
                  {chapterById(b.surah).name} ·{' '}
                  {b.kind === 'ayah'
                    ? `${t('app.groupAyah')} ${b.ayah}`
                    : `${t('app.groupPage')} ${b.page}`}
                </T>
                {b.kind === 'ayah' ? (
                  <T arabic translate={false} numberOfLines={1} size={21}>
                    {getAyahs(b.surah)[b.ayah - 1]?.text}
                  </T>
                ) : (
                  <T translate={false} muted size={13}>
                    {bookmarkEditionName(b)}
                  </T>
                )}
              </View>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={parts.filter(
            (d) =>
              !query ||
              String(
                mode === 'juz' ? Math.ceil(d.id / 8) : mode === 'hizb' ? d.hizb : d.id,
              ).includes(query),
          )}
          keyExtractor={(d) => `${mode}:${d.id}`}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item: d }) =>
            mode === 'hizb' ? (
              <View
                style={[
                  s.listRow,
                  {
                    borderBottomColor: p.line,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 0,
                  },
                ]}
              >
                <View style={s.row}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openPart(d)}
                    onLongPress={() => partActions(d)}
                    style={({ pressed }) => [
                      s.row,
                      {
                        minHeight: 48,
                        flex: 1,
                        flexDirection: 'row',
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <HizbTitle number={d.hizb} />
                      <T translate={false} muted size={12}>
                        {d.surah}:{d.ayah} · {t('app.groupPage')} {d.page}
                      </T>
                    </View>
                    <Icon name="chevron-right" mirrorInRtl size={18} color={p.primary} />
                  </Pressable>
                  <NoteCountButton target={{ scope: 'hizb', number: d.hizb }} />
                  <IconButton
                    name="more-horizontal"
                    label={t('app.actions')}
                    onPress={() => partActions(d)}
                  />
                </View>
                <HizbOpeningPreview number={d.hizb} onOpen={() => openPart(d)} />
              </View>
            ) : (
              <View
                style={[
                  s.listRow,
                  { borderBottomColor: p.line },
                  mode === 'juz'
                    ? hifzCardColors(
                        state.progress[`juz_${Math.ceil(d.id / 8)}`],
                        state.preferences.hifzColorsEnabled,
                      )
                    : undefined,
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openPart(d)}
                  onLongPress={() => partActions(d)}
                  style={[s.row, { flex: 1, minHeight: 48 }]}
                >
                  <View style={{ width: 44 }}>
                    <T bold color={p.primary}>
                      {mode === 'juz' ? Math.ceil(d.id / 8) : d.id}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T bold>
                      {mode === 'juz' ? 'Juz' : 'Rub'} {mode === 'juz' ? Math.ceil(d.id / 8) : d.id}
                    </T>
                    <T translate={false} muted size={13}>
                      {chapterById(d.surah).name} · {t('app.groupAyah')} {d.ayah} ·{' '}
                      {t('app.groupPage')} {d.page}
                    </T>
                  </View>
                  <Icon name="chevron-right" mirrorInRtl size={18} color={p.primary} />
                </Pressable>
                <NoteCountButton
                  target={{
                    scope: mode === 'juz' ? 'juz' : 'rub',
                    number: mode === 'juz' ? Math.ceil(d.id / 8) : d.id,
                  }}
                />
                <IconButton
                  name="more-horizontal"
                  label={t('app.actions')}
                  onPress={() => partActions(d)}
                />
              </View>
            )
          }
        />
      )}
      <SurahActionsSheet surah={selectedSurah} onClose={() => setSelectedSurah(null)} />
      <PartActionsSheet
        target={selectedPart?.target ?? null}
        onClose={() => setSelectedPart(null)}
        onOpen={() => {
          if (selectedPart) openPart(selectedPart.division, selectedPart.target.kind);
        }}
      />
    </Screen>
  );
}
