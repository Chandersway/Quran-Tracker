import { LexiconScreen } from '../../features/lexicon/screens/LexiconScreen';
import { LexiconSearchScreen } from '../../features/lexicon/screens/LexiconSearchScreen';
import { navigationCopy } from './navigationCopy';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthLinkHandler } from '../../features/account/components/AuthLinkHandler';
import { PushNotificationHandler } from '../../features/account/components/PushNotificationHandler';
import { AccountScreen } from '../../features/account/screens/AccountScreen';
import { NotificationsScreen } from '../../features/account/screens/NotificationsScreen';
import { SettingsScreen } from '../../features/account/screens/SettingsScreen';
import { MiniPlayer } from '../../features/audio/providers/AudioProvider';
import { PlayerScreen } from '../../features/audio/screens/PlayerScreen';
import { audioCopy } from '../../features/audio/model/audioCopy';
import { GroupJoinLinkHandler } from '../../features/groups/components/GroupJoinLinkHandler';
import { GroupScreen } from '../../features/groups/screens/GroupScreen';
import { GroupChatScreen } from '../../features/groups/screens/GroupChatScreen';
import { chatText } from '../../features/groups/chatCopy';
import { GroupsScreen } from '../../features/groups/screens/GroupsScreen';
import { NotesScreen } from '../../features/notes/screens/NotesScreen';
import { BookmarksScreen } from '../../features/bookmarks/screens/BookmarksScreen';
import { OnboardingScreen } from '../../features/onboarding/screens/OnboardingScreen';
import {
  LocalReminderFailureNotice,
  PlanningReminderCoordinator,
} from '../../features/planning/components/PlanningReminderCoordinator';
import { HomeWidgetSync } from '../../features/homeWidget/components/HomeWidgetSync';
import { ReadingPlanScreen } from '../../features/planning/screens/ReadingPlanScreen';
import { FocusFloatingTimer } from '../../features/practice/providers/FocusProvider';
import { ChecklistScreen } from '../../features/practice/screens/ChecklistScreen';
import { FocusScreen } from '../../features/practice/screens/FocusScreen';
import { GoalsScreen } from '../../features/practice/screens/GoalsScreen';
import { StatsScreen } from '../../features/practice/screens/StatsScreen';
import { MushafDownloadProgress } from '../../features/quran/components/MushafDownloadProgress';
import { MushafLibraryScreen } from '../../features/quran/screens/MushafLibraryScreen';
import { MushafScreen } from '../../features/quran/screens/MushafScreen';
import { ReaderScreen } from '../../features/quran/screens/ReaderScreen';
import { BooksScreen } from '../../features/study/screens/BooksScreen';
import { BookReaderScreen } from '../../features/study/screens/BookReaderScreen';
import { MutashabihatScreen } from '../../features/study/screens/MutashabihatScreen';
import { StudyScreen } from '../../features/study/screens/StudyScreen';
import { StudySourcesScreen } from '../../features/study/screens/StudySourcesScreen';
import { useI18n } from '../../i18n';
import { Notice, T } from '../../shared/components';
import { fonts, isDarkPalette, usePalette } from '../../shared/theme';
import { layoutDirection } from '../../domain/layoutDirection';
import { useAppStore } from '../../state/store';
import { AppChromeContext } from '../providers/AppChromeContext';
import { createReaderChromeOwners } from '../providers/readerChromeOwners';
import { MainTabs } from './MainTabs';
import { linking } from './linking';
import type { RootStack } from './types';
const Stack = createNativeStackNavigator<RootStack>();
export function AppNavigator() {
  const navigation = useNavigationContainerRef<RootStack>();
  const [immersiveReader, setImmersiveReader] = useState(false);
  const [routeName, setRouteName] = useState<string | undefined>();
  const chromeOwners = useRef(createReaderChromeOwners());
  const setReaderChrome = useCallback((owner: symbol, immersive: boolean) => {
    setImmersiveReader(chromeOwners.current(owner, immersive));
  }, []);
  const { ready, storageError, retryStorage, state } = useAppStore();
  const p = usePalette();
  const { t, locale } = useI18n();
  if (!ready)
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: p.background, justifyContent: 'center', padding: 28 }}
      >
        <T size={30} bold>
          {t('app.quranTracker')}
        </T>
        {storageError ? (
          <Notice error message={storageError} onRetry={retryStorage} />
        ) : (
          <ActivityIndicator color={p.primary} style={{ marginTop: 24 }} />
        )}
      </SafeAreaView>
    );
  const dark = isDarkPalette(p);
  const direction = layoutDirection(locale);
  return (
    <>
      <AuthLinkHandler />
      <PushNotificationHandler />
      <GroupJoinLinkHandler />
      <PlanningReminderCoordinator />
      <HomeWidgetSync />
      <StatusBar style={dark ? 'light' : 'dark'} />
      {!state.preferences.onboardingComplete ? (
        <OnboardingScreen />
      ) : (
        <NavigationContainer
          ref={navigation}
          onStateChange={() => setRouteName(navigation.getCurrentRoute()?.name)}
          direction={direction}
          linking={linking}
          theme={{
            ...(dark ? DarkTheme : DefaultTheme),
            colors: {
              ...(dark ? DarkTheme.colors : DefaultTheme.colors),
              primary: p.primary,
              background: p.background,
              card: p.background,
              text: p.ink,
              border: p.line,
            },
          }}
        >
          <AppChromeContext.Provider value={setReaderChrome}>
            <SafeAreaView
              edges={immersiveReader ? ['left', 'right'] : ['top', 'left', 'right']}
              style={{ flex: 1, backgroundColor: p.background, direction }}
            >
              {!immersiveReader && (
                <MushafDownloadProgress
                  onOpen={() => {
                    if (navigation.isReady())
                      navigation.navigate('MushafLibrary', { focusDownload: Date.now() });
                  }}
                />
              )}
              {!immersiveReader && storageError && (
                <Notice error message={storageError} onRetry={retryStorage} />
              )}
              {!immersiveReader && <LocalReminderFailureNotice />}
              <View style={{ flex: 1 }}>
                <Stack.Navigator
                  screenOptions={{
                    headerStyle: { backgroundColor: p.background },
                    headerTintColor: p.ink,
                    headerTitleStyle: { fontFamily: fonts.bold },
                    headerShadowVisible: false,
                    // The enclosing SafeAreaView already consumes the status-bar inset.
                    unstable_headerInsets: { top: false },
                    contentStyle: { backgroundColor: p.background, direction },
                  }}
                >
                  <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
                  <Stack.Screen
                    name="Reader"
                    component={ReaderScreen}
                    options={{ title: t('Your reading') }}
                  />
                  <Stack.Screen
                    name="Mushaf"
                    component={MushafScreen}
                    options={{ title: t('Your Mushaf') }}
                  />
                  <Stack.Screen
                    name="MushafLibrary"
                    component={MushafLibraryScreen}
                    options={{ title: t('app.mushaf') }}
                  />
                  <Stack.Screen
                    name="Notes"
                    component={NotesScreen}
                    options={{ title: t('Reflections') }}
                  />
                  <Stack.Screen
                    name="Bookmarks"
                    component={BookmarksScreen}
                    options={{ title: t('app.bookmarks') }}
                  />
                  <Stack.Screen
                    name="Study"
                    component={StudyScreen}
                    options={{ title: t('Look a little closer') }}
                  />
                  <Stack.Screen
                    name="Mutashabihat"
                    component={MutashabihatScreen}
                    options={{ title: t('mutashabihat.title') }}
                  />
                  <Stack.Screen
                    name="LexiconSearch"
                    component={LexiconSearchScreen}
                    options={{ title: navigationCopy[locale].lexicon }}
                  />
                  <Stack.Screen
                    name="Lexicon"
                    component={LexiconScreen}
                    options={{ title: navigationCopy[locale].lexicon }}
                  />
                  <Stack.Screen
                    name="StudySources"
                    component={StudySourcesScreen}
                    options={{ title: t('Sources for your study') }}
                  />
                  <Stack.Screen
                    name="Books"
                    component={BooksScreen}
                    options={{ title: t('The library') }}
                  />
                  <Stack.Screen
                    name="BookReader"
                    component={BookReaderScreen}
                    options={({ route }) => ({ title: route.params.title })}
                  />
                  <Stack.Screen
                    name="Player"
                    component={PlayerScreen}
                    options={{ title: audioCopy(locale, 'playerTitle') }}
                  />
                  <Stack.Screen
                    name="Stats"
                    component={StatsScreen}
                    options={{ title: t('Your practice') }}
                  />
                  <Stack.Screen
                    name="Goals"
                    component={GoalsScreen}
                    options={{ title: t('Your daily intentions') }}
                  />
                  <Stack.Screen
                    name="ReadingPlan"
                    component={ReadingPlanScreen}
                    options={{ title: t('readingPlan.Mijn leesplan') }}
                  />
                  <Stack.Screen
                    name="Notifications"
                    component={NotificationsScreen}
                    options={{ title: t('Gentle reminders') }}
                  />
                  <Stack.Screen
                    name="Focus"
                    component={FocusScreen}
                    options={{ title: t('A moment of focus') }}
                  />
                  <Stack.Screen
                    name="Checklist"
                    component={ChecklistScreen}
                    options={{ title: t('Reading checklist') }}
                  />
                  <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: t('Make it yours') }}
                  />
                  <Stack.Screen
                    name="Account"
                    component={AccountScreen}
                    options={{ title: t('Your account') }}
                  />
                  <Stack.Screen
                    name="Groups"
                    component={GroupsScreen}
                    options={{ title: t('Your circle') }}
                  />
                  <Stack.Screen
                    name="Group"
                    component={GroupScreen}
                    options={{ title: t('Your circle') }}
                  />
                  <Stack.Screen
                    name="GroupChat"
                    component={GroupChatScreen}
                    options={{ title: chatText('title', locale) }}
                  />
                </Stack.Navigator>
              </View>
              {!immersiveReader && routeName !== 'Player' && (
                <MiniPlayer
                  onOpen={() => {
                    if (navigation.isReady()) navigation.navigate('Player');
                  }}
                />
              )}
              <FocusFloatingTimer
                onBook={immersiveReader && navigation.getCurrentRoute()?.name === 'Mushaf'}
              />
            </SafeAreaView>
          </AppChromeContext.Provider>
        </NavigationContainer>
      )}
    </>
  );
}
