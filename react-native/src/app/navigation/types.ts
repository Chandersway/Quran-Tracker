import { useNavigation, type NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { QuranNoteTarget } from '../../domain/quran';
import type { MushafReadingContext, ReadingContext } from '../../domain/readingContext';

export type RootStack = {
  Main:
    | NavigatorScreenParams<{
        Today: undefined;
        Quran: undefined;
        Practice: undefined;
        Juz: undefined;
        Plan: { planId?: string } | undefined;
        Circle: undefined;
      }>
    | undefined;
  Reader: ReadingContext;
  Mushaf: MushafReadingContext;
  MushafLibrary: { focusDownload?: number } | undefined;
  Notes: { surah?: number; ayah?: number; noteId?: number; target?: QuranNoteTarget } | undefined;
  Focus: undefined;
  Stats: undefined;
  Goals: { date?: string; quickCheckIn?: boolean } | undefined;
  ReadingPlan: undefined;
  Notifications: undefined;
  Settings: undefined;
  Bookmarks: undefined;
  Account: undefined;
  Groups: undefined;
  Group: { code: string; postId?: string; invite?: string };
  GroupChat: { code: string };
  Study: {
    surah: number;
    ayah?: number;
    mode?: 'words' | 'irab' | 'similar';
    fixedReferences?: Array<{ surah: number; ayah: number }>;
  };
  StudySources:
    | {
        surah?: number;
        ayah?: number;
        kind?: 'tafsir' | 'irab' | 'asbab';
        autoLoad?: boolean;
        fixedReferences?: Array<{ surah: number; ayah: number }>;
        warshReference?: { surah: number; ayah: number };
      }
    | undefined;
  LexiconSearch: undefined;
  Lexicon:
    | {
        kind: 'word';
        reference: { surah: number; ayah: number; word: number };
        candidateText: string;
      }
    | { kind: 'root' | 'lemma'; id: string };
  Mutashabihat: undefined;
  Books: undefined;
  BookReader: { bookId: string; title: string };
  Checklist: undefined;
};
export const useAppNavigation = () => useNavigation<NativeStackNavigationProp<RootStack>>();
