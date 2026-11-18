import type { RouteProp } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import type { RootStack } from '../../../app/navigation/types';
import { useAppNavigation } from '../../../app/navigation/types';
import { useI18n } from '../../../i18n';
import { Card, Icon, IconButton, Notice, Screen, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';
import { books, strings } from '../model/bookCatalog';

type ReaderProps = NativeStackScreenProps<RootStack, 'BookReader'>;
type ReaderRoute = RouteProp<RootStack, 'BookReader'>;
type BookChapter = { title: string; firstPageIndex: number };
type BookPage = { pageNumber: number; marker: string; chapterIndex: number; pageIndex: number };
type BookContent = { chapters: BookChapter[]; pages: BookPage[] };
type SearchResult = { pageIndex: number; title: string; preview: string };
type DbError = { message: string };
export function BookReaderScreen({ route }: ReaderProps) {
  const [databaseError, setDatabaseError] = useState<DbError | null>(null);
  const [databaseReady, setDatabaseReady] = useState(false);
  const { state } = useAppStore();
  const text = strings(state.preferences.language);
  const handleError = useCallback(
    (error: Error) => setDatabaseError({ message: error.message }),
    [],
  );
  const onInit = useCallback(async () => {
    setDatabaseReady(true);
  }, []);
  if (databaseError) return <ReaderFailure message={text.error} details={databaseError.message} />;
  // Expo SQLite requires a static require for a bundled database asset.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const assetId = require('../../../../assets/books.db') as number;
  return (
    <>
      <SQLiteProvider
        databaseName="books.db"
        assetSource={{ assetId }}
        onInit={onInit}
        onError={handleError}
      >
        <BookReaderContent route={route} />
      </SQLiteProvider>
      {!databaseReady && (
        <Screen>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator />
            <T muted>{text.loadingBook}</T>
          </View>
        </Screen>
      )}
    </>
  );
}
function ReaderFailure({ message, details }: { message: string; details?: string }) {
  return (
    <Screen>
      <Notice error message={message} />
      {details && (
        <T size={12} muted>
          {details}
        </T>
      )}
    </Screen>
  );
}
function cleanBookText(text: string): string {
  return text
    .replace(/###\s*\|+\s*(.+)/g, '$1')
    .replace(/Milestone\d+/g, '')
    .replace(/###\s*\|+/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}
function searchPreview(text: string, query: string): string {
  const found = text.toLowerCase().indexOf(query.toLowerCase());
  const index = found >= 0 ? found : 0;
  return text
    .slice(Math.max(0, index - 90), Math.min(text.length, index + query.length + 140))
    .replace(/\n/g, ' ')
    .trim();
}
async function loadBook(db: SQLiteDatabase, bookId: string): Promise<BookContent> {
  const chapters = await db.getAllAsync<BookChapter>(
    'SELECT title, first_page_index AS firstPageIndex FROM chapters WHERE book_id = ? ORDER BY chapter_index',
    bookId,
  );
  const pages = await db.getAllAsync<BookPage>(
    'SELECT page_number AS pageNumber, marker, chapter_index AS chapterIndex, page_index AS pageIndex FROM pages WHERE book_id = ? ORDER BY page_index',
    bookId,
  );
  return { chapters: chapters.length ? chapters : [{ title: 'مقدمة', firstPageIndex: 0 }], pages };
}
async function loadPageText(
  db: SQLiteDatabase,
  bookId: string,
  pageIndex: number,
): Promise<string> {
  const row = await db.getFirstAsync<{ text: string }>(
    'SELECT text FROM pages WHERE book_id = ? AND page_index = ? LIMIT 1',
    bookId,
    pageIndex,
  );
  return row ? cleanBookText(row.text) : '';
}
async function searchBook(
  db: SQLiteDatabase,
  bookId: string,
  query: string,
  pageLabel: (page: number) => string,
): Promise<SearchResult[]> {
  const needle = query.trim();
  if (needle.length < 2) return [];
  const rows = await db.getAllAsync<{
    pageIndex: number;
    pageNumber: number;
    text: string;
    chapter: string | null;
  }>(
    `SELECT p.page_index AS pageIndex, p.page_number AS pageNumber, p.text, c.title AS chapter
     FROM pages p LEFT JOIN chapters c ON c.book_id = p.book_id AND c.chapter_index = p.chapter_index
     WHERE p.book_id = ? AND (p.text LIKE ? OR c.title LIKE ?) ORDER BY p.page_index LIMIT 60`,
    bookId,
    `%${needle}%`,
    `%${needle}%`,
  );
  return rows.map((row) => ({
    pageIndex: row.pageIndex,
    title: `${row.chapter || 'مقدمة'} · ${pageLabel(row.pageNumber)}`,
    preview: searchPreview(row.text, needle),
  }));
}
function BookReaderContent({ route }: { route: ReaderRoute }) {
  const p = usePalette();
  const db = useSQLiteContext();
  const { state } = useAppStore();
  const language = state.preferences.language;
  const text = strings(language);
  const { format } = useI18n();
  const navigation = useAppNavigation();
  const book = books.find((item) => item.id === route.params.bookId);
  const [content, setContent] = useState<BookContent | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageText, setPageText] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [expandedBio, setExpandedBio] = useState(false);
  const [chapterOpen, setChapterOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const currentPage = content?.pages[pageIndex];
  const currentChapter = currentPage ? content?.chapters[currentPage.chapterIndex] : undefined;

  useEffect(() => {
    setContent(null);
    setPageIndex(0);
    setQuery('');
    setLoadError(false);
  }, [route.params.bookId]);
  useEffect(() => {
    if (!book) {
      setLoadError(true);
      return;
    }
    let active = true;
    setLoadError(false);
    loadBook(db, book.id)
      .then((data) => {
        if (active) {
          setContent(data);
          if (data.pages.length === 0) setLoadError(true);
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [db, book]);
  useEffect(() => {
    if (!book || !currentPage) {
      setPageText('');
      return;
    }
    let active = true;
    loadPageText(db, book.id, currentPage.pageIndex)
      .then((value) => {
        if (active) setPageText(value);
      })
      .catch(() => {
        if (active) setPageText('');
      });
    return () => {
      active = false;
    };
  }, [db, book, currentPage]);
  useEffect(() => {
    if (!book || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      searchBook(db, book.id, query, (pageNumber) =>
        format('bookReader.pageLabel', pageNumber, '?'),
      )
        .then((next) => {
          if (active) setResults(next);
        })
        .catch(() => {
          if (active) setResults([]);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [db, book, query, language]);

  const chapterTargets = useMemo(() => content?.chapters ?? [], [content]);
  if (!book || loadError)
    return (
      <ReaderFailure
        message={text.error}
        details={!book ? `Unknown book: ${route.params.bookId}` : undefined}
      />
    );
  return (
    <Screen style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconButton
          name="arrow-left"
          mirrorInRtl
          label={text.back}
          onPress={() => navigation.goBack()}
        />
        <View style={{ flex: 1 }}>
          <T size={26} bold>
            {book.titleEn}
          </T>
          <T size={13} muted>
            {book.author}
          </T>
        </View>
      </View>
      <T arabic size={28} style={{ textAlign: 'right' }}>
        {book.titleAr}
      </T>
      <Card style={{ gap: 7, padding: 16 }}>
        <T size={14} bold>
          {text.author}
        </T>
        <T size={15} bold>
          {book.author}
        </T>
        <T size={14} muted numberOfLines={expandedBio ? undefined : 3}>
          {book.summary[language]}
        </T>
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpandedBio((value) => !value)}
          style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
        >
          <T size={13} color={p.primary} bold>
            {expandedBio ? text.collapse : text.expand}
          </T>
        </Pressable>
      </Card>
      {content ? (
        <>
          <Card style={{ gap: 12, padding: 16 }}>
            <View style={{ gap: 7 }}>
              <T size={13} muted>
                {text.book}
              </T>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: bookOpen }}
                onPress={() => setBookOpen((value) => !value)}
                style={{
                  minHeight: 44,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <T size={15} bold>
                  {book.titleEn}
                </T>
                <Icon name={bookOpen ? 'chevron-up' : 'chevron-down'} color={p.primary} />
              </Pressable>
            </View>
            {bookOpen &&
              books.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() =>
                    navigation.replace('BookReader', { bookId: item.id, title: item.titleEn })
                  }
                  style={{
                    minHeight: 44,
                    justifyContent: 'center',
                    borderTopWidth: 1,
                    borderColor: p.line,
                  }}
                >
                  <T>{item.titleEn}</T>
                </Pressable>
              ))}
            <View style={{ gap: 7 }}>
              <T size={13} muted>
                {text.contents}
              </T>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: chapterOpen }}
                onPress={() => setChapterOpen((value) => !value)}
                style={{
                  minHeight: 44,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <T size={15} bold numberOfLines={1} style={{ flex: 1 }}>
                  {currentChapter?.title ?? text.loading}
                </T>
                <Icon name={chapterOpen ? 'chevron-up' : 'chevron-down'} color={p.primary} />
              </Pressable>
            </View>
            {chapterOpen &&
              chapterTargets.map((item, index) => (
                <Pressable
                  key={`${index}-${item.firstPageIndex}`}
                  accessibilityRole="button"
                  onPress={() => {
                    setPageIndex(
                      Math.min(Math.max(item.firstPageIndex, 0), (content?.pages.length ?? 1) - 1),
                    );
                    setChapterOpen(false);
                  }}
                  style={{
                    minHeight: 44,
                    justifyContent: 'center',
                    borderTopWidth: 1,
                    borderColor: p.line,
                  }}
                >
                  <T>{item.title}</T>
                </Pressable>
              ))}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <IconButton
                name="chevron-left"
                mirrorInRtl
                label={text.previous}
                disabled={pageIndex <= 0}
                onPress={() => setPageIndex((current) => Math.max(0, current - 1))}
              />
              <T size={14} bold color={p.muted}>
                {currentPage
                  ? format('bookReader.pageLabel', currentPage.pageNumber, content.pages.length)
                  : text.loading}
              </T>
              <IconButton
                name="chevron-right"
                mirrorInRtl
                label={text.next}
                disabled={pageIndex >= content.pages.length - 1}
                onPress={() =>
                  setPageIndex((current) => Math.min(content.pages.length - 1, current + 1))
                }
              />
            </View>
          </Card>
          <View style={{ gap: 6 }}>
            <T size={14} bold>
              {text.search}
            </T>
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                alignItems: 'center',
                backgroundColor: p.surface,
                borderColor: p.line,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
              }}
            >
              <Icon name="search" color={p.muted} size={17} />
              <TextInput
                accessibilityLabel={text.search}
                placeholder={text.searchHint}
                placeholderTextColor={p.muted}
                value={query}
                onChangeText={setQuery}
                style={{ flex: 1, color: p.ink, fontSize: 15, minHeight: 50 }}
              />
              {!!query && (
                <IconButton
                  name="x"
                  label="inline.AyahNotesScreen.3b7ea51793"
                  onPress={() => setQuery('')}
                />
              )}
            </View>
          </View>
          {query.trim().length >= 2 && (
            <View style={{ gap: 8 }}>
              <T size={13} muted>
                {results.length
                  ? format('bookReader.searchResults', results.length)
                  : text.noResults}
              </T>
              {results.map((result, index) => (
                <Pressable
                  key={`${result.pageIndex}-${index}`}
                  accessibilityRole="button"
                  onPress={() => {
                    setPageIndex(result.pageIndex);
                    setQuery('');
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderColor: p.line,
                    opacity: pressed ? 0.7 : 1,
                    gap: 4,
                  })}
                >
                  <T size={14} bold color={p.primary}>
                    {result.title}
                  </T>
                  <T size={13} arabic numberOfLines={3}>
                    {result.preview}
                  </T>
                </Pressable>
              ))}
            </View>
          )}
          <Card style={{ gap: 12, padding: 20 }}>
            <T size={16} bold color={p.primary} style={{ textAlign: 'right' }}>
              {currentChapter?.title}
            </T>
            {pageText ? (
              <T selectable arabic size={21} style={{ textAlign: 'right', lineHeight: 40 }}>
                {pageText}
              </T>
            ) : (
              <View style={{ paddingVertical: 34, alignItems: 'center' }}>
                <ActivityIndicator color={p.primary} />
                <T muted>{text.loadingBook}</T>
              </View>
            )}
          </Card>
        </>
      ) : (
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <ActivityIndicator color={p.primary} />
          <T muted>{text.loadingBook}</T>
        </Card>
      )}
    </Screen>
  );
}
