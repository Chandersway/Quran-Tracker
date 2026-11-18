import { HifzScoreSlider } from '../components/HifzScoreSlider';
import { usePracticeSave } from '../hooks/usePracticeSave';
import { usePracticeListAnchor } from '../hooks/usePracticeListAnchor';
import React, { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { divisions, chapterById, divisionEnd, getAyahs } from '../../../content/quran';
import type { QuranProgressKind } from '../../../domain/quran';
import { useAppStore } from '../../../state/store';
import { localDate } from '../../../domain/localDate';
import { newId, progressKey } from '../../../state/reducer';
import {
  Button,
  Empty,
  Field,
  Icon,
  IconButton,
  Notice,
  Screen,
  Segments,
  Sheet,
  T,
  s,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppNavigation } from '../../../app/navigation/types';
import { useI18n } from '../../../i18n';
import { getHizbOpening } from '../../../content/hizb';
import { HizbOpeningPreview, HizbTitle } from '../../quran/components/HizbOpeningPreview';
import { PartActionsSheet, type PartActionTarget } from '../../quran/components/PartActionsSheet';
import { hifzCardColors } from '../../../domain/hifzPresentation';
import { firstUnreadPartition, partitionReadStatus } from '../../../domain/progressActions';
import { NoteCountButton } from '../../notes/components/NoteCountButton';

export function ProgressScreen({ initialMode = 'hizb' }: { initialMode?: QuranProgressKind } = {}) {
  const p = usePalette();
  const nav = useAppNavigation();
  const { state, dispatch, commit, ownerId } = useAppStore();
  const { t, format, locale } = useI18n();
  const [mode, setMode] = useState<QuranProgressKind>(initialMode);
  const [selected, setSelected] = useState<number[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [score, setScore] = useState('');
  const [message, setMessage] = useState('');
  const [partAction, setPartAction] = useState<PartActionTarget | null>(null);
  const submission = usePracticeSave(commit, () => {
    setMessage(t('quickCheck.saved'));
    setSelected([]);
  });
  const count = mode === 'juz' ? 30 : mode === 'hizb' ? 60 : mode === 'rub' ? 240 : 114;
  const rows = Array.from({ length: count }, (_, i) => i + 1);
  const firstUnread =
    mode === 'juz' || mode === 'hizb' ? firstUnreadPartition(state.progress, mode) : 1;
  const anchor = usePracticeListAnchor(firstUnread - 1, `${mode}:${firstUnread}`);
  const reference = (n: number) =>
    mode === 'rub'
      ? { number: Math.ceil(n / 4), subId: ((n - 1) % 4) + 1 }
      : { number: n, subId: 0 };
  const label = (n: number) =>
    mode === 'surah'
      ? locale === 'ar'
        ? chapterById(n).nameAr
        : chapterById(n).name
      : mode === 'rub'
        ? format('tracker.hizbRubTitle', Math.ceil(n / 4), ['¼', '½', '¾', '1'][(n - 1) % 4]!)
        : format(`common.${mode}Number`, n);
  function open(n: number) {
    if (mode === 'surah') return nav.navigate('Mushaf', { surah: n });
    const startId = mode === 'juz' ? (n - 1) * 8 + 1 : mode === 'hizb' ? (n - 1) * 4 + 1 : n;
    const d = divisions[startId - 1]!;
    const end = divisionEnd(startId + (mode === 'juz' ? 7 : mode === 'hizb' ? 3 : 0));
    nav.navigate('Mushaf', {
      surah: d.surah,
      ayah: d.ayah,
      endSurah: end.surah,
      endAyah: end.ayah,
      readingTarget: { kind: mode, ...reference(n), name: label(n) },
    });
  }
  async function checkIn() {
    if (ownerId === null) return;
    await submission.save(() => {
      const session = newId();
      const now = Date.now();
      const date = localDate(new Date(now));
      return {
        type: 'checkIn/batch',
        entries: selected.map((n) => ({
          type: 'checkIn',
          kind: mode,
          ...reference(n),
          name: label(n),
          requestId: `${session}:${mode}:${n}`,
          now,
          date,
          ...(ownerId != null ? { ownerId } : {}),
        })),
      };
    });
  }
  function editScore(number: number) {
    if (mode === 'rub') return;
    setEditing(number);
    setScore(String(state.progress[progressKey(mode, number)]?.progress ?? 0));
  }
  function toggleSelection(number: number) {
    if (submission.isSaving() || submission.draftLocked) return;
    submission.reset();
    setMessage('');
    setSelected((previous) =>
      previous.includes(number) ? previous.filter((n) => n !== number) : [...previous, number],
    );
  }
  return (
    <Screen scroll={false} style={{ paddingBottom: 0 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <T size={32} bold style={{ flex: 1 }}>
          {t(
            mode === 'juz'
              ? 'tracker.juzTitle'
              : mode === 'surah'
                ? 'app.surah'
                : 'tracker.hizbTitleArabic',
          )}
        </T>
        <IconButton
          name="bar-chart-2"
          label={t('app.stats')}
          onPress={() => nav.navigate('Stats')}
        />
      </View>
      <T muted style={{ marginTop: 8, marginBottom: 16 }}>
        {t(mode === 'juz' ? 'hifz.independent' : 'tracker.hizbSubtitle')}
      </T>
      <Segments
        value={mode}
        onChange={(m) => {
          if (submission.isSaving() || submission.draftLocked) return;
          submission.reset();
          setMode(m);
          setSelected([]);
          setMessage('');
        }}
        options={(['hizb', 'juz', 'rub', 'surah'] as const).map((value) => ({
          value,
          label: t(`unit.${value}`),
        }))}
      />
      {message ? <Notice message={message} /> : null}
      {submission.failed && (
        <Notice error message={t('readingPlan.Opslaan mislukt. Probeer opnieuw.')} />
      )}
      <T size={13} muted style={{ marginVertical: 12 }}>
        {t('hifz.independent')}
      </T>
      <FlatList
        {...anchor.listProps}
        key={mode}
        data={rows}
        keyExtractor={String}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item: n }) => {
          const r = reference(n);
          const stored = state.progress[progressKey(mode, r.number, r.subId)];
          const partition =
            mode === 'hizb' || mode === 'juz' ? partitionReadStatus(state.progress, mode, n) : null;
          const progress = partition ? { ...stored, readCount: partition.readCount } : stored;
          const juzStart = mode === 'juz' ? divisions[(n - 1) * 8]! : null;
          const isSelected = selected.includes(n);
          const opening = mode === 'hizb' ? getHizbOpening(n) : null;
          const tint = hifzCardColors(stored, state.preferences.hifzColorsEnabled);
          return (
            <View
              style={[
                s.listRow,
                {
                  ...tint,
                  borderBottomColor: tint?.borderColor ?? p.line,
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 0,
                },
              ]}
            >
              <View style={[s.row, { flexDirection: 'row' }]}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={label(n)}
                  accessibilityState={{ checked: isSelected }}
                  disabled={submission.draftLocked}
                  onPress={() => toggleSelection(n)}
                  style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon
                    name={isSelected ? 'check-circle' : 'circle'}
                    color={isSelected ? p.primary : p.muted}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => open(n)}
                  onLongPress={mode !== 'rub' ? () => editScore(n) : undefined}
                  style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}
                >
                  {mode === 'hizb' ? <HizbTitle number={n} /> : <T bold>{label(n)}</T>}
                  {partition && (
                    <T muted size={12} testID={`partition-completion-${mode}-${n}`}>
                      {partition.isRead ? '✓ ' : ''}
                      {format(
                        mode === 'juz' ? 'tracker.juzRubCount' : 'tracker.hizbCompletedRub',
                        partition.completed,
                      )}
                    </T>
                  )}
                  {opening && (
                    <T translate={false} muted size={12}>
                      {opening.start.surah}:{opening.start.ayah}
                    </T>
                  )}
                  <T size={12} muted>
                    {progress?.readCount ? format('app.timesRead', progress.readCount) : '—'}
                    {progress?.hasHifzScore
                      ? ` · ${format('tracker.hizbScoreValue', progress.progress ?? 0)}`
                      : ''}
                    {progress?.isMemorized ? ` · ${t('app.memorized')}` : ''}
                  </T>
                </Pressable>
                {(mode === 'juz' || mode === 'rub') && (
                  <IconButton
                    name="check-circle"
                    label={t(progress?.readCount ? 'common.markAgain' : 'common.mark')}
                    onPress={() => setPartAction({ kind: mode, ...r })}
                  />
                )}
                <NoteCountButton target={{ scope: mode, number: n }} />
                {mode !== 'rub' && (
                  <IconButton
                    name="bar-chart"
                    label={format('tracker.hifzScoreTitle', label(n))}
                    onPress={() => editScore(n)}
                  />
                )}
              </View>
              {mode === 'hizb' && <HizbOpeningPreview number={n} />}
              {juzStart && (
                <View style={{ gap: 4, paddingTop: 6 }}>
                  <T translate={false} muted size={12}>
                    {chapterById(juzStart.surah).nameAr} {juzStart.surah}:{juzStart.ayah}
                  </T>
                  <T arabic size={18} numberOfLines={2}>
                    {getAyahs(juzStart.surah).find((row) => row.number === juzStart.ayah)?.text}
                  </T>
                </View>
              )}
              {mode === 'hizb' && (
                <View style={[s.row, { justifyContent: 'space-between', paddingTop: 8 }]}>
                  {[1, 2, 3, 4].map((quarter) => {
                    const count = state.progress[progressKey('rub', n, quarter)]?.readCount ?? 0;
                    return (
                      <Pressable
                        key={quarter}
                        accessibilityRole="button"
                        accessibilityLabel={`${label(n)} · ${t('unit.rub')} ${quarter} · ${format('app.timesRead', count)}`}
                        style={{
                          flex: 1,
                          minHeight: 48,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: p.line,
                          backgroundColor: count ? p.subtle : 'transparent',
                        }}
                        onPress={() => setPartAction({ kind: 'rub', number: n, subId: quarter })}
                      >
                        <T
                          size={13}
                        >{`${['¼', '½', '¾', '1'][quarter - 1]} · ${count.toLocaleString(locale)}`}</T>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Empty title="Start where you are" message="Your reading history will appear here." />
        }
      />
      {selected.length > 0 && (
        <View style={{ paddingVertical: 12, backgroundColor: p.background, gap: 8 }}>
          <Button
            title={
              submission.failed ? t('common.retry') : `${t('common.mark')} (${selected.length})`
            }
            icon="check"
            loading={submission.saving}
            disabled={submission.saving || ownerId === null}
            onPress={checkIn}
          />
          <View style={s.row}>
            <Button
              title={t('common.remove')}
              variant="quiet"
              disabled={submission.draftLocked}
              onPress={() => {
                selected.forEach((n) => {
                  if (mode === 'hizb')
                    [1, 2, 3, 4].forEach((subId) =>
                      dispatch({
                        type: 'read/unmark',
                        kind: 'rub',
                        number: n,
                        subId,
                        date: localDate(),
                        now: Date.now(),
                      }),
                    );
                  else
                    dispatch({
                      type: 'read/unmark',
                      kind: mode,
                      ...reference(n),
                      date: localDate(),
                      now: Date.now(),
                    });
                });
                setSelected([]);
              }}
            />
            {mode === 'surah' && (
              <Button
                title={t('app.memorized')}
                variant="secondary"
                disabled={submission.draftLocked}
                onPress={() => {
                  const marked = !selected.every(
                    (n) => state.progress[progressKey('surah', n)]?.isMemorized,
                  );
                  selected.forEach((n) =>
                    dispatch({
                      type: 'surah/memorized',
                      number: n,
                      name: label(n),
                      marked,
                      requestId: newId(),
                      now: Date.now(),
                      date: localDate(),
                    }),
                  );
                  setSelected([]);
                }}
              />
            )}
            <Button
              title={t('common.cancel')}
              variant="quiet"
              disabled={submission.saving}
              onPress={() => {
                if (submission.isSaving()) return;
                submission.reset();
                setSelected([]);
              }}
            />
          </View>
        </View>
      )}
      <PartActionsSheet target={partAction} onClose={() => setPartAction(null)} />
      <Sheet
        visible={editing !== null}
        title={format('tracker.hifzScoreTitle', editing ? label(editing) : '')}
        onClose={() => setEditing(null)}
      >
        <T muted style={{ marginBottom: 20 }}>
          {t(
            mode === 'surah'
              ? 'app.hifzScoreQuestion'
              : mode === 'juz'
                ? 'tracker.juzScoreQuestion'
                : 'tracker.hizbScoreQuestion',
          )}
        </T>
        <T muted style={{ marginBottom: 12 }}>
          {t('hifz.independent')}
        </T>
        <HifzScoreSlider value={Number(score) || 0} onChange={(n) => setScore(String(n))} />
        <Field
          label={t('app.hifzScore')}
          keyboardType="number-pad"
          value={score}
          onChangeText={setScore}
        />
        <View style={[s.row, { marginBottom: 20, flexWrap: 'wrap' }]}>
          {[0, 25, 50, 75, 100].map((n) => (
            <Button
              key={n}
              title={`${n}%`}
              variant={score === String(n) ? 'primary' : 'secondary'}
              onPress={() => setScore(String(n))}
            />
          ))}
        </View>
        <Button
          title={t('hifz.clear')}
          variant="quiet"
          onPress={() => {
            if (editing === null) return;
            dispatch({
              type: 'hifz',
              kind: mode,
              ...reference(editing),
              score: 0,
              now: Date.now(),
            });
            setEditing(null);
          }}
        />
        <Button title={t('common.cancel')} variant="quiet" onPress={() => setEditing(null)} />
        <Button
          title={t('common.save')}
          disabled={!/^\d{1,3}$/.test(score) || Number(score) > 100}
          onPress={() => {
            if (editing === null) return;
            dispatch({
              type: 'hifz',
              kind: mode,
              ...reference(editing),
              score: Number(score),
              now: Date.now(),
            });
            setEditing(null);
          }}
        />
      </Sheet>
    </Screen>
  );
}
