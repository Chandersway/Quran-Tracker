import React, { useState } from 'react';
import { View } from 'react-native';
import { chapterById, chapters } from '../../../content/quran';
import {
  switchNoteScope,
  targetHizbNumber,
  targetQuarter,
  type NoteScope,
  type QuranNoteTarget,
} from '../../../domain/quran';
import { normalizePlanNumber } from '../../../domain/readingPlan';
import { useI18n } from '../../../i18n';
import { Button, Card, Field, Row, Segments, Sheet, T } from '../../../shared/components';
import { NoteTargetSummary } from './NoteTargetSummary';

export function NoteTargetControl({
  target,
  onChange,
}: {
  target: QuranNoteTarget | null;
  onChange: (target: QuranNoteTarget) => void;
}) {
  const { t, locale, format } = useI18n();
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState('');
  const current = target ?? { scope: 'surah' as const, number: 1 };
  const title = (value: QuranNoteTarget): string =>
    value.scope === 'surah' || value.scope === 'ayah'
      ? `${locale === 'ar' ? chapterById(value.number).nameAr : chapterById(value.number).name}${value.scope === 'ayah' ? ` ${value.number}:${value.ayah ?? ''}` : ''}`
      : value.scope === 'rub'
        ? `${t('notes.scope.rub')} ${targetQuarter(value)} · ${format('common.hizbNumber', targetHizbNumber(value) ?? 1)}`
        : format(`common.${value.scope}Number`, value.number);
  const count =
    current.scope === 'juz' ? 30 : current.scope === 'hizb' || current.scope === 'rub' ? 60 : 114;
  const choices = Array.from({ length: count }, (_, index) => index + 1).filter(
    (number) =>
      !query.trim() ||
      String(number).includes(normalizePlanNumber(query.trim())) ||
      (['surah', 'ayah'].includes(current.scope) &&
        `${chapters[number - 1]?.name} ${chapters[number - 1]?.nameAr}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())),
  );
  return (
    <Card style={{ gap: 10 }}>
      <T bold>{t('inline.NoteTargetComponents.8d66b02789')}</T>
      <Segments
        value={current.scope}
        options={(['juz', 'hizb', 'rub', 'surah', 'ayah'] as const).map((scope) => ({
          value: scope,
          label: t(`notes.scope.${scope}`),
        }))}
        onChange={(scope) => onChange(switchNoteScope(current, scope))}
      />
      <Button
        title={
          target
            ? current.scope === 'rub'
              ? format('common.hizbNumber', targetHizbNumber(current) ?? 1)
              : title(current)
            : t('inline.NoteTargetComponents.e0f37798c3')
        }
        variant="secondary"
        onPress={() => {
          setQuery('');
          setPicker(true);
        }}
      />
      {target && current.scope === 'ayah' && (
        <Field
          label={format('irab.ayah', chapterById(current.number).verseCount)}
          value={current.ayah ? String(current.ayah) : ''}
          onChangeText={(value) =>
            onChange({ ...current, ayah: Number(normalizePlanNumber(value)) || 0 })
          }
          keyboardType="number-pad"
        />
      )}
      {target && ['hizb', 'rub'].includes(current.scope) && (
        <>
          <T muted size={12}>
            {t('inline.NoteTargetComponents.1709305c9f')}
          </T>
          <Segments
            value={current.scope === 'hizb' ? 'whole' : String(targetQuarter(current))}
            options={[
              { value: 'whole', label: t('inline.NoteTargetComponents.d64a972638') },
              ...[1, 2, 3, 4].map((quarter) => ({
                value: String(quarter),
                label: `${t('notes.scope.rub')} ${quarter}`,
              })),
            ]}
            onChange={(value) =>
              onChange(
                value === 'whole'
                  ? { scope: 'hizb', number: targetHizbNumber(current)! }
                  : { scope: 'rub', number: (targetHizbNumber(current)! - 1) * 4 + Number(value) },
              )
            }
          />
        </>
      )}
      {target?.scope === 'juz' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[target.number * 2 - 1, target.number * 2].map((number) => (
            <Button
              key={number}
              title={format('common.hizbNumber', number)}
              variant="quiet"
              onPress={() => onChange({ scope: 'hizb', number })}
            />
          ))}
        </View>
      )}
      {target && <NoteTargetSummary target={target} />}
      <Sheet
        visible={picker}
        title="inline.NoteTargetComponents.e0f37798c3"
        onClose={() => setPicker(false)}
      >
        <Field
          label="inline.NoteTargetComponents.7deaa4fc1e"
          value={query}
          onChangeText={setQuery}
        />
        {choices.map((number) => {
          const choice: QuranNoteTarget =
            current.scope === 'rub'
              ? { scope: 'rub', number: (number - 1) * 4 + (targetQuarter(current) ?? 1) }
              : current.scope === 'ayah'
                ? { scope: 'ayah', number, ayah: 1 }
                : { scope: current.scope as NoteScope, number };
          return (
            <Row
              key={number}
              title={current.scope === 'rub' ? format('common.hizbNumber', number) : title(choice)}
              translateTitle={false}
              onPress={() => {
                onChange(choice);
                setPicker(false);
              }}
            />
          );
        })}
      </Sheet>
    </Card>
  );
}
