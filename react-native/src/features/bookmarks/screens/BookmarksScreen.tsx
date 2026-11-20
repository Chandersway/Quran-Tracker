import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { chapterById } from '../../../content/quran';
import { useAppStore } from '../../../state/store';
import { useAppNavigation } from '../../../app/navigation/types';
import { Row, Screen, Segments, T } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { bookmarkCopy } from '../bookmarkCopy';
import {
  bookmarkEditionName,
  savedBookmarks,
  savedBookmarkTarget,
  type BookmarkSort,
} from '../bookmarks';

export function BookmarksScreen() {
  const { state } = useAppStore();
  const nav = useAppNavigation();
  const { locale } = useI18n();
  const copy = bookmarkCopy[locale];
  const [sort, setSort] = useState<BookmarkSort>('quran');
  const entries = savedBookmarks(state, sort);
  return (
    <Screen scroll={false}>
      <View style={{ gap: 8, marginBottom: 12 }}>
        <T translate={false} size={26} bold>
          {copy.title}
        </T>
        <T translate={false} muted>
          {copy.help}
        </T>
        <T translate={false} size={13} bold>
          {copy.order}
        </T>
        <Segments
          value={sort}
          options={[
            { value: 'quran', label: copy.quran },
            { value: 'name', label: copy.name },
            { value: 'recent', label: copy.recent },
          ]}
          onChange={setSort}
        />
        {sort === 'recent' && (
          <T translate={false} muted size={12}>
            {copy.recentHelp}
          </T>
        )}
      </View>
      <FlatList
        testID="saved-bookmarks-list"
        data={entries}
        keyExtractor={(entry) => entry.key}
        ListEmptyComponent={
          <T translate={false} muted>
            {copy.empty}
          </T>
        }
        renderItem={({ item }) => (
          <Row
            title={`${chapterById(item.surah).name} · ${item.kind === 'ayah' ? `${copy.ayah} ${item.ayah}` : `${copy.page} ${item.page}`}`}
            subtitle={
              item.kind === 'ayah' ? `${item.surah}:${item.ayah}` : bookmarkEditionName(item)
            }
            translateTitle={false}
            translateSubtitle={false}
            icon="bookmark"
            onPress={() => nav.navigate('Mushaf', savedBookmarkTarget(item))}
          />
        )}
      />
    </Screen>
  );
}
