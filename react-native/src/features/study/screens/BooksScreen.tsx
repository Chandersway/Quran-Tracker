import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useAppNavigation } from '../../../app/navigation/types';
import { Empty, Icon, IconButton, Screen, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';
import { books, strings } from '../model/bookCatalog';

export function BooksScreen() {
  const p = usePalette();
  const navigation = useAppNavigation();
  const { state } = useAppStore();
  const language = state.preferences.language;
  const text = strings(language);
  const [query, setQuery] = useState('');
  const visibleBooks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return books.filter(
      (book) =>
        !needle ||
        [book.titleEn, book.titleAr, book.author, book.summary[language]].some((value) =>
          value.toLowerCase().includes(needle),
        ),
    );
  }, [query, language]);
  return (
    <Screen style={{ gap: 12 }}>
      <View style={{ gap: 3 }}>
        <T size={29} bold>
          {text.title}
        </T>
        <T muted>{text.subtitle}</T>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: p.line,
          backgroundColor: p.surface,
          borderRadius: 12,
          paddingHorizontal: 13,
          minHeight: 52,
          gap: 10,
        }}
      >
        <Icon name="search" color={p.muted} size={18} />
        <TextInput
          accessibilityLabel={text.searchBooks}
          placeholder={text.searchBooks}
          placeholderTextColor={p.muted}
          value={query}
          onChangeText={setQuery}
          style={{ flex: 1, color: p.ink, fontSize: 16, minHeight: 48 }}
        />
        {!!query && (
          <IconButton
            name="x"
            label="inline.AyahNotesScreen.3b7ea51793"
            onPress={() => setQuery('')}
          />
        )}
      </View>
      {visibleBooks.length === 0 ? (
        <Empty title={text.noResults} message={text.searchBooks} icon="search" />
      ) : (
        <View>
          {visibleBooks.map((book) => (
            <Pressable
              key={book.id}
              accessibilityRole="button"
              accessibilityLabel={`${book.titleEn}, ${book.author}`}
              onPress={() =>
                navigation.navigate('BookReader', { bookId: book.id, title: book.titleEn })
              }
              style={({ pressed }) => ({
                paddingVertical: 17,
                borderBottomWidth: 1,
                borderBottomColor: p.line,
                opacity: pressed ? 0.7 : 1,
                gap: 4,
              })}
            >
              <T size={23} arabic style={{ textAlign: 'right' }}>
                {book.titleAr}
              </T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <T size={17} bold>
                    {book.titleEn}
                  </T>
                  <T size={13} muted>
                    {book.author}
                  </T>
                  <T size={13} muted numberOfLines={2}>
                    {book.summary[language]}
                  </T>
                </View>
                <Icon name="chevron-right" mirrorInRtl size={18} color={p.primary} />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
