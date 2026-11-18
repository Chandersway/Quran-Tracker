import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, View } from 'react-native';
import { chapters, getAyahs } from '../../../content/quran';
import { useAppNavigation } from '../../../app/navigation/types';
import { useI18n } from '../../../i18n';
import {
  Card,
  Field,
  Icon,
  IconButton,
  Notice,
  Screen,
  Segments,
  T,
  s,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import {
  filterMutashabihatGroups,
  MUTASHABIHAT_SOURCE_URL,
  parseMutashabihatGroups,
  similarReferenceLabel,
  similarSequenceText,
  type SimilarGroup,
  type SimilarSequence,
} from '../../../domain/mutashabihat';

let cachedGroups: Promise<SimilarGroup[]> | null = null;
function loadGroups(): Promise<SimilarGroup[]> {
  if (!cachedGroups) {
    cachedGroups = import('../../../content/generated/mutashabiha_data.json').then((data) =>
      parseMutashabihatGroups(data.default, chapters),
    );
    cachedGroups.catch(() => {
      cachedGroups = null;
    });
  }
  return cachedGroups;
}

/** Global source screen, separate from Study's single-ayah comparison. */
export function MutashabihatScreen() {
  const { t, format } = useI18n();
  const p = usePalette();
  const [selectedJuz, setSelectedJuz] = useState('0');
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<SimilarGroup[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let active = true;
    setError(false);
    loadGroups()
      .then((value) => {
        if (active) setGroups(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const filteredGroups = useMemo(
    () => filterMutashabihatGroups(groups ?? [], Number(selectedJuz), query),
    [groups, selectedJuz, query],
  );
  const count = (group: SimilarGroup) => `${group.matches.length} ${t('mutashabihat.matches')}`;
  return (
    <Screen scroll={false} style={{ paddingBottom: 0 }}>
      <FlatList
        data={filteredGroups}
        keyExtractor={(group) => group.id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        contentContainerStyle={{ gap: 12, paddingBottom: 28 }}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <View style={[s.row, { gap: 12 }]}>
              <Icon name="repeat" color={p.primary} size={26} />
              <View style={{ flex: 1 }}>
                <T size={27} bold>
                  {t('mutashabihat.title')}
                </T>
                <T muted size={13}>
                  {t('mutashabihat.intro')}
                </T>
              </View>
            </View>
            <Field
              label={t('mutashabihat.searchHint')}
              placeholder={t('mutashabihat.searchHint')}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
            <Segments
              value={selectedJuz}
              onChange={setSelectedJuz}
              options={[
                { value: '0', label: t('mutashabihat.all') },
                ...Array.from({ length: 30 }, (_, index) => ({
                  value: String(index + 1),
                  label: format('common.juzNumber', index + 1),
                })),
              ]}
            />
          </View>
        }
        ListEmptyComponent={
          error ? (
            <Notice error message="irab.error" onRetry={() => setRetry((value) => value + 1)} />
          ) : groups === null ? (
            <ActivityIndicator style={{ padding: 40 }} color={p.primary} />
          ) : (
            <T muted style={{ textAlign: 'center', paddingVertical: 40 }}>
              {t('mutashabihat.noResults')}
            </T>
          )
        }
        renderItem={({ item: group }) => (
          <Card style={{ padding: 16, gap: 8 }}>
            <View style={[s.row, { gap: 8 }]}>
              <View style={{ flex: 1 }}>
                <T bold color={p.primary}>
                  {format('common.juzNumber', group.juz)}
                  {' \u00b7 '}
                  {similarReferenceLabel(group.source, chapters)}
                </T>
                <T muted size={12}>
                  {count(group)}
                </T>
              </View>
              <IconButton
                name={expanded[group.id] ? 'chevron-up' : 'chevron-down'}
                label={count(group)}
                onPress={() =>
                  setExpanded((current) => ({ ...current, [group.id]: !current[group.id] }))
                }
              />
            </View>
            <SequenceRow sequence={group.source} prefix={t('mutashabihat.source')} />
            {group.contextAyahs > 0 && (
              <T muted size={12}>
                +{group.contextAyahs} {t('mutashabihat.context')}
              </T>
            )}
            {expanded[group.id] ? (
              group.matches.map((match, index) => (
                <View key={index} style={{ backgroundColor: p.subtle, borderRadius: 10 }}>
                  <SequenceRow sequence={match} prefix={String(index + 1)} />
                </View>
              ))
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: false }}
                onPress={() => setExpanded((current) => ({ ...current, [group.id]: true }))}
                style={[s.row, { minHeight: 44, alignSelf: 'flex-start', gap: 8 }]}
              >
                <Icon name="repeat" color={p.primary} size={15} />
                <T bold color={p.primary} size={13}>
                  {count(group)}
                </T>
              </Pressable>
            )}
          </Card>
        )}
        ListFooterComponent={
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              void Linking.openURL(MUTASHABIHAT_SOURCE_URL);
            }}
            style={{ minHeight: 48, paddingVertical: 14 }}
          >
            <T muted size={11} style={{ textAlign: 'center' }}>
              {t('mutashabihat.attribution')}
            </T>
          </Pressable>
        }
      />
    </Screen>
  );
}

function SequenceRow({ sequence, prefix }: { sequence: SimilarSequence; prefix: string }) {
  const navigation = useAppNavigation();
  const { t } = useI18n();
  const p = usePalette();
  const reference = similarReferenceLabel(sequence, chapters);
  const arabic = useMemo(
    () =>
      similarSequenceText(
        sequence,
        (surah, ayah) => getAyahs(surah).find((item) => item.number === ayah)?.text ?? '',
      ),
    [sequence],
  );
  const first = sequence.ayahs[0]!;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${prefix} \u00b7 ${reference}. ${t('mutashabihat.openAyah')}`}
      onPress={() => navigation.navigate('Mushaf', { surah: first.surah, ayah: first.ayah })}
      style={{ paddingHorizontal: 10, paddingVertical: 10, gap: 6 }}
    >
      <View style={[s.row, { gap: 8 }]}>
        <T translate={false} color={p.primary} size={13} style={{ flex: 1 }}>
          {prefix}
          {' \u00b7 '}
          {reference}
        </T>
        <Icon name="book-open" size={17} color={p.primary} />
      </View>
      {!!arabic.trim() && (
        <T arabic size={22} style={{ textAlign: 'right', lineHeight: 34 }}>
          {arabic}
        </T>
      )}
    </Pressable>
  );
}
