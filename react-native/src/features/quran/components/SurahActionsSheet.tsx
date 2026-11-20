import { HifzScoreSlider } from '../../practice/components/HifzScoreSlider';
import React, { useEffect, useState } from 'react';
import { Button, Field, Notice, Section, Sheet, T } from '../../../shared/components';
import { useAppStore } from '../../../state/store';
import { useAppNavigation } from '../../../app/navigation/types';
import { localDate } from '../../../domain/localDate';
import { newId } from '../../../state/reducer';
import { chapterById } from '../../../content/quran';
import { useI18n } from '../../../i18n';

export function SurahActionsSheet({
  surah,
  onClose,
}: {
  surah: number | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useAppStore();
  const nav = useAppNavigation();
  const { t, format, locale } = useI18n();
  const [score, setScore] = useState('0');
  const progress = surah ? state.progress[`surah_${surah}`] : undefined;
  useEffect(() => setScore(String(progress?.progress ?? 0)), [surah, progress?.progress]);
  if (!surah) return null;
  const chapter = chapterById(surah);
  const name = locale === 'ar' ? chapter.nameAr : chapter.name;
  function finish(action: () => void) {
    action();
    onClose();
  }
  return (
    <Sheet visible title={name} onClose={onClose}>
      <Button
        title={t('common.open')}
        icon="book-open"
        onPress={() => finish(() => nav.navigate('Mushaf', { surah }))}
      />
      <Button
        title={t('navigation.notes')}
        icon="edit-3"
        variant="secondary"
        onPress={() =>
          finish(() => nav.navigate('Notes', { target: { scope: 'surah', number: surah } }))
        }
      />
      <Section title={t('surah.markRead')} />
      <T muted style={{ marginBottom: 16 }}>
        {progress?.readCount
          ? format('app.surahAlreadyReadQuestion', name, progress.readCount)
          : format('app.markSurahReadQuestion', name)}
      </T>
      <Button
        title={t(progress?.isRead ? 'common.markAgain' : 'common.mark')}
        icon="check"
        onPress={() =>
          finish(() =>
            dispatch({
              type: 'checkIn',
              kind: 'surah',
              number: surah,
              name,
              requestId: newId(),
              now: Date.now(),
              date: localDate(),
            }),
          )
        }
      />
      {progress?.isRead && (
        <Button
          title={t('surah.deleteRead')}
          variant="quiet"
          onPress={() =>
            finish(() =>
              dispatch({
                type: 'read/unmark',
                kind: 'surah',
                number: surah,
                date: localDate(),
                now: Date.now(),
              }),
            )
          }
        />
      )}
      <Section title={t('app.memorized')} />
      <T muted style={{ marginBottom: 16 }}>
        {format(
          progress?.isMemorized
            ? 'app.surahAlreadyMemorizedQuestion'
            : 'app.markSurahMemorizedQuestion',
          name,
        )}
      </T>
      <Button
        title={t(progress?.isMemorized ? 'common.remove' : 'common.mark')}
        variant="secondary"
        onPress={() =>
          finish(() =>
            dispatch({
              type: 'surah/memorized',
              number: surah,
              name,
              marked: !progress?.isMemorized,
              requestId: newId(),
              now: Date.now(),
              date: localDate(),
            }),
          )
        }
      />
      <Section title={t('app.hifzScoreLabel')} />
      <T muted size={13} style={{ marginBottom: 16 }}>
        {t('app.hifzScoreQuestion')}
      </T>
      <HifzScoreSlider value={Number(score) || 0} onChange={(n) => setScore(String(n))} />
      <Field
        label={t('app.hifzScore')}
        value={score}
        onChangeText={setScore}
        keyboardType="number-pad"
        maxLength={3}
      />
      <Button
        title={t('hifz.clear')}
        variant="quiet"
        onPress={() =>
          finish(() =>
            dispatch({ type: 'hifz', kind: 'surah', number: surah, score: 0, now: Date.now() }),
          )
        }
      />
      <Button title={t('common.cancel')} variant="quiet" onPress={onClose} />
      <Button
        title={t('common.save')}
        disabled={!/^\d{1,3}$/.test(score) || Number(score) > 100}
        onPress={() =>
          finish(() =>
            dispatch({
              type: 'hifz',
              kind: 'surah',
              number: surah,
              score: Number(score),
              now: Date.now(),
            }),
          )
        }
      />
      <Notice message={t('hifz.independent')} />
    </Sheet>
  );
}
