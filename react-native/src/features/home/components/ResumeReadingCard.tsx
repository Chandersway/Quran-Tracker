import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppNavigation } from '../../../app/navigation/types';
import { chapterById } from '../../../content/quran';
import { mushafResume } from '../../../domain/mushafResume';
import { useI18n } from '../../../i18n';
import { Icon, T } from '../../../shared/components';
import { useAppStore } from '../../../state/store';
import { StatisticsSurface } from '../../practice/components/StatisticsSurface';
import { resumeReference } from '../model/resumeReference';

export function ResumeReadingCard() {
  const { state } = useAppStore();
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const resume = mushafResume(state);
  const point = resumeReference(resume);
  const chapter = point ? chapterById(point.surah) : undefined;
  const caption = [
    resume.page ? `${t('app.groupPage')} ${resume.page.toLocaleString(locale)}` : '',
    point && chapter
      ? `${locale === 'ar' ? chapter.nameAr : chapter.name} ${point.surah}:${point.ayah}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <StatisticsSurface
      ornament="arabesque"
      style={{ backgroundColor: '#183B30', borderRadius: 20, overflow: 'hidden' }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('checklist.continue')}, ${caption}`}
        onPress={() => nav.navigate('Mushaf', resume)}
        style={({ pressed }) => ({
          padding: 20,
          minHeight: 96,
          flexDirection: 'row',
          gap: 16,
          alignItems: 'center',
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <T bold size={19} color="#FFF6E4">
            {t('checklist.continue')}
          </T>
          <T size={12} color="#D8D5C3">
            {caption}
          </T>
        </View>
        <View
          style={{
            height: 48,
            width: 48,
            borderRadius: 24,
            backgroundColor: '#A95E40',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={locale === 'ar' ? 'arrow-left' : 'arrow-right'} color="#FFF8EC" size={23} />
        </View>
      </Pressable>
    </StatisticsSurface>
  );
}
