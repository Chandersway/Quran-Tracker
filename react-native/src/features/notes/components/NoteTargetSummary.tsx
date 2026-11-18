import React from 'react';
import { View } from 'react-native';
import { getAyahs } from '../../../content/quran';
import { checklistRange, versePoint } from '../../../domain/checklist';
import { targetHizbNumber, validateNoteTarget, type QuranNoteTarget } from '../../../domain/quran';
import { useI18n } from '../../../i18n';
import { useNotesCopy } from '../../../i18n/notes';
import { T } from '../../../shared/components';
import { targetTitle } from '../editor/noteEditor';

/** The same reference preview remains visible while choosing, browsing, or reading a note. */
export function NoteTargetSummary({ target }: { target: QuranNoteTarget }) {
  const { t, locale, format } = useI18n();
  const copy = useNotesCopy(locale);
  let start: { surah: number; ayah: number };
  try {
    validateNoteTarget(target);
    start =
      target.scope === 'ayah'
        ? { surah: target.number, ayah: target.ayah! }
        : versePoint(checklistRange(target)[0]);
  } catch {
    return <T>{t('inline.NoteTargetComponents.1365d4f9e2')}</T>;
  }
  const hierarchy =
    target.scope === 'juz'
      ? `${t('notes.scope.hizb')} ${target.number * 2 - 1}–${target.number * 2}`
      : target.scope === 'hizb' || target.scope === 'rub'
        ? format('common.juzNumber', Math.ceil(targetHizbNumber(target)! / 2))
        : '';
  return (
    <View style={{ gap: 6 }}>
      {!!hierarchy && (
        <T translate={false} muted size={12}>
          {hierarchy}
        </T>
      )}
      {target.scope !== 'ayah' && (
        <T translate={false} size={12}>
          {t('inline.NoteTargetComponents.7649296e09')}
          {targetTitle({ scope: 'ayah', number: start.surah, ayah: start.ayah }, locale, copy)}
        </T>
      )}
      <T arabic size={18} numberOfLines={2}>
        {getAyahs(start.surah).find((row) => row.number === start.ayah)?.text ?? ''}
      </T>
    </View>
  );
}
