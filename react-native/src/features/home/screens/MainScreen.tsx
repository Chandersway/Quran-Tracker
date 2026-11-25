import React from 'react';
import { Image, Pressable, View } from 'react-native';
import {
  CardOrnament,
  Icon,
  IconButton,
  Row,
  Screen,
  Section,
  T,
  s,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';
import { chapterById, getAyahs } from '../../../content/quran';
import { useAppNavigation } from '../../../app/navigation/types';
import { useI18n } from '../../../i18n';
import { ReadingStatisticsOverview } from '../../practice/components/ReadingStatisticsOverview';
import { PracticeOverview } from '../components/PracticeOverview';
import { StatisticsSurface } from '../../practice/components/StatisticsSurface';
import { HizbOverviewCard } from '../components/HizbOverviewCard';
import { ReadingPlanHomeCard } from '../../planning/components/ReadingPlanHomeCard';
import { RevealBlock } from '../../../shared/components/RevealBlock';
import { TodayReadingCard } from '../components/TodayReadingCard';
import { ResumeReadingCard } from '../components/ResumeReadingCard';
import { StatsShortcutCard } from '../components/StatsShortcutCard';

// Metro resolves bundled image assets through a static require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appSymbol = require('../../../../assets/quran-tracker-symbol.png');

/** The start screen composes reading, statistics and planning; each block owns its behavior. */
export function MainScreen() {
  const p = usePalette();
  const nav = useAppNavigation();
  const { state } = useAppStore();
  const { t, locale } = useI18n();
  const verse = getAyahs(73)[3]!;
  return (
    // Home scrolls plainly: cards such as Recente geschiedenis must not slide up while scrolling.
    <Screen style={{ paddingTop: 8 }} reveal={false}>
      <View style={[s.row, { flexDirection: 'row', gap: 10, marginBottom: 18 }]}>
        <Image
          source={appSymbol}
          accessible={false}
          style={{ width: 36, height: 36 }}
          resizeMode="contain"
        />
        <View style={{ flex: 1, gap: 2 }}>
          <T size={25} bold>
            {t('app.quranTracker')}
          </T>
          <T muted size={12}>
            {new Date().toLocaleDateString(locale, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </T>
        </View>
        <IconButton
          name="sliders"
          label={t('settings.title')}
          onPress={() => nav.navigate('Settings')}
        />
      </View>
      <View style={{ gap: 16 }}>
        <StatsShortcutCard />
        <TodayReadingCard />
        <ResumeReadingCard />
        <ReadingStatisticsOverview home beforeHistory={<HizbOverviewCard />} />
      </View>
      <StatisticsSurface ornament={false} style={{ marginTop: 24 }}>
        <PracticeOverview />
      </StatisticsSurface>
      <View style={{ gap: 20, marginTop: 24 }}>
        <RevealBlock>
          <ReadingPlanHomeCard />
        </RevealBlock>
      </View>
      <Section title={t('app.quran')} />
      <View style={[s.row, { gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => nav.navigate('Focus')}
          style={{
            flex: 1,
            minWidth: 140,
            backgroundColor: p.peach,
            padding: 18,
            borderRadius: 14,
            minHeight: 136,
          }}
        >
          <CardOrnament surface={p.peach} radius={14} variant="lattice" />
          <Icon name="sun" size={25} color={p.clay} />
          <T translate={false} size={18} bold style={{ marginTop: 14 }}>
            {t('focus.menuTitle')}
          </T>
          <T translate={false} size={12} color={p.clay} style={{ marginTop: 4 }}>
            {t('focus.menuSubtitle')}
          </T>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => nav.navigate('Notes', undefined)}
          style={{
            flex: 1,
            minWidth: 140,
            backgroundColor: p.blueWash,
            padding: 18,
            borderRadius: 14,
            minHeight: 136,
          }}
        >
          <CardOrnament surface={p.blueWash} radius={14} variant="zellij" />
          <Icon name="edit-3" size={25} color={p.blue} />
          <T translate={false} size={18} bold style={{ marginTop: 14 }}>
            {t('navigation.notes')}
          </T>
          <T translate={false} size={12} color={p.blue} style={{ marginTop: 4 }}>
            {t('menu.notes.subtitle')}
          </T>
        </Pressable>
      </View>
      {state.bookmarks.length > 0 && (
        <>
          <Section title={t('app.bookmarks')} />
          {state.bookmarks
            .slice(-3)
            .reverse()
            .map((b) => (
              <Row
                key={`${b.surah}:${b.ayah}`}
                title={chapterById(b.surah).name}
                translateTitle={false}
                subtitle={`${t('app.groupAyah')} ${b.ayah}`}
                icon="bookmark"
                onPress={() => nav.navigate('Reader', { surah: b.surah, ayah: b.ayah })}
              />
            ))}
        </>
      )}
      <View
        style={{
          marginTop: 32,
          paddingVertical: 22,
          borderTopWidth: 1,
          borderTopColor: p.line,
          alignItems: 'center',
          gap: 6,
        }}
      >
        <T arabic size={24} color={p.primary}>
          وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
        </T>
        <T translate={false} size={13} muted>
          {state.preferences.language === 'ar'
            ? '73:4'
            : `${state.preferences.language === 'nl' ? verse.nl : verse.en} · 73:4`}
        </T>
      </View>
    </Screen>
  );
}
