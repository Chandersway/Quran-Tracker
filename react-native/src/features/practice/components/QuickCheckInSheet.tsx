import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { chapterById, divisions, getAyahs } from '../../../content/quran';
import { quickCheckTargets, type QuickCheckDraft } from '../../../domain/quickCheckIn';
import { localDate } from '../../../domain/localDate';
import { newId } from '../../../state/reducer';
import { usePracticeSave } from '../hooks/usePracticeSave';
import { useAppStore } from '../../../state/store';
import { useI18n } from '../../../i18n';
import { Button, Field, Icon, Notice, Segments, Sheet, T, s } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';

const initial: QuickCheckDraft = {
  kind: 'surah',
  number: 1,
  quarter: 1,
  multiple: false,
  selected: [],
};
export function QuickCheckInSheet({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { t, locale, format } = useI18n();
  const { commit, ownerId } = useAppStore();
  const p = usePalette();
  const [draft, setDraft] = useState<QuickCheckDraft>(initial);
  const [choosing, setChoosing] = useState(false);
  const [input, setInput] = useState('1');
  const submission = usePracticeSave(commit, () => {
    onSaved?.();
    onClose();
  });
  const resetSubmission = submission.reset;
  useEffect(() => {
    if (visible) {
      setDraft(initial);
      setInput('1');
      setChoosing(false);
      resetSubmission();
    }
  }, [visible, resetSubmission]);
  const max = draft.kind === 'surah' ? 114 : draft.kind === 'juz' ? 30 : 60;
  const number = Number(input);
  const safe = Number.isInteger(number) && number >= 1 && number <= max;
  const candidate = { ...draft, number };
  let valid = true;
  try {
    quickCheckTargets(candidate);
  } catch {
    valid = false;
  }
  const division =
    safe && (draft.kind === 'hizb' || draft.kind === 'rub')
      ? divisions[(number - 1) * 4]
      : undefined;
  const chapter =
    safe && draft.kind === 'surah'
      ? chapterById(number)
      : division
        ? chapterById(division.surah)
        : undefined;
  const arabic =
    draft.kind === 'surah'
      ? chapter?.nameAr
      : division
        ? getAyahs(division.surah)[division.ayah - 1]?.text
        : undefined;
  async function save() {
    if (ownerId === null) return;
    await submission.save(() => {
      const targets = quickCheckTargets(candidate);
      const session = newId();
      const now = Date.now();
      const date = localDate(new Date(now));
      return {
        type: 'checkIn/batch',
        entries: targets.map((target) => ({
          type: 'checkIn',
          ...target,
          name:
            target.kind === 'surah'
              ? chapterById(target.number).name
              : target.kind === 'juz'
                ? format('common.juzNumber', target.number)
                : format('common.hizbNumber', target.number),
          requestId: `${session}:${target.kind}:${target.number}:${target.subId ?? 0}`,
          now,
          date,
          ...(ownerId != null ? { ownerId } : {}),
        })),
      };
    });
  }
  return (
    <Sheet
      visible={visible}
      title={t(choosing ? 'hizbOverview.selector' : 'quickCheck.title')}
      onClose={() => {
        if (submission.isSaving()) return;
        if (choosing) setChoosing(false);
        else onClose();
      }}
      footer={
        choosing ? (
          <Button title={t('hizbOverview.done')} onPress={() => setChoosing(false)} />
        ) : undefined
      }
    >
      {choosing ? (
        <>
          <T
            muted
          >{`${draft.selected.length.toLocaleString(locale)} ${t('hizbOverview.selected')}`}</T>
          {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => (
            <Pressable
              key={n}
              accessibilityRole="checkbox"
              accessibilityLabel={`${t('unit.hizb')} ${n.toLocaleString(locale)}`}
              accessibilityState={{ checked: draft.selected.includes(n) }}
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  selected: current.selected.includes(n)
                    ? current.selected.filter((x) => x !== n)
                    : [...current.selected, n],
                }))
              }
              style={[s.row, { minHeight: 48 }]}
            >
              <Icon
                name={draft.selected.includes(n) ? 'check-circle' : 'circle'}
                color={p.primary}
              />
              <T translate={false}>{`${t('unit.hizb')} ${n.toLocaleString(locale)}`}</T>
            </Pressable>
          ))}
        </>
      ) : (
        <>
          <View
            pointerEvents={submission.draftLocked ? 'none' : 'auto'}
            accessibilityElementsHidden={submission.draftLocked}
            importantForAccessibility={submission.draftLocked ? 'no-hide-descendants' : 'auto'}
          >
            <Segments
              value={draft.kind}
              onChange={(kind) => {
                setDraft((current) => ({
                  ...current,
                  kind,
                  number: Math.min(
                    current.number,
                    kind === 'surah' ? 114 : kind === 'juz' ? 30 : 60,
                  ),
                  multiple: false,
                  selected: [],
                }));
                setInput(
                  String(Math.min(number || 1, kind === 'surah' ? 114 : kind === 'juz' ? 30 : 60)),
                );
              }}
              options={(['surah', 'juz', 'hizb', 'rub'] as const).map((value) => ({
                value,
                label: t(`unit.${value}`),
              }))}
            />
            <Field
              label={t(
                draft.kind === 'juz'
                  ? 'unit.juz'
                  : draft.kind === 'surah'
                    ? 'unit.surah'
                    : 'unit.hizb',
              )}
              value={input}
              keyboardType="number-pad"
              onChangeText={(value) => {
                setInput(value);
                const parsed = Number(value);
                if (Number.isInteger(parsed) && parsed >= 1 && parsed <= max)
                  setDraft((current) => ({
                    ...current,
                    number: parsed,
                    multiple: false,
                    selected: [],
                  }));
              }}
            />
            {draft.kind === 'hizb' && (
              <Button
                title={`${t('hizbOverview.chooseMultiple')}${draft.multiple ? ` · ${draft.selected.length.toLocaleString(locale)} ${t('hizbOverview.selected')}` : ''}`}
                variant="secondary"
                onPress={() => {
                  setDraft((current) => ({
                    ...current,
                    multiple: true,
                    selected: current.multiple ? current.selected : [current.number],
                  }));
                  setChoosing(true);
                }}
              />
            )}
            {!draft.multiple && chapter && (
              <View style={{ marginVertical: 14 }}>
                <T translate={false} bold>
                  {draft.kind === 'surah'
                    ? `${number}. ${locale === 'ar' ? chapter.nameAr : chapter.name}`
                    : `${t('unit.hizb')} ${number} · ${chapter.nameAr} ${division?.surah}:${division?.ayah}`}
                </T>
                {arabic && (
                  <T arabic size={22}>
                    {arabic}
                  </T>
                )}
              </View>
            )}
            {draft.kind === 'rub' && (
              <>
                <T bold>{t('unit.rub')}</T>
                <Segments
                  value={String(draft.quarter)}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, quarter: Number(value) }))
                  }
                  options={[1, 2, 3, 4].map((n) => ({
                    value: String(n),
                    label: n.toLocaleString(locale),
                  }))}
                />
              </>
            )}
          </View>
          {submission.failed && (
            <Notice error message={t('readingPlan.Opslaan mislukt. Probeer opnieuw.')} />
          )}
          <Button
            title={t(submission.failed ? 'common.retry' : 'quickCheck.saveAsRead')}
            disabled={!valid || submission.saving || ownerId === null}
            loading={submission.saving}
            onPress={save}
            style={{ marginTop: 18 }}
          />
          <Button
            title={t('common.cancel')}
            variant="quiet"
            disabled={submission.saving}
            onPress={() => {
              if (!submission.isSaving()) onClose();
            }}
          />
        </>
      )}
    </Sheet>
  );
}
