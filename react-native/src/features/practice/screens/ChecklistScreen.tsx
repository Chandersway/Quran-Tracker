import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chapters, chapterById } from '../../../content/quran';
import type { NoteScope, QuranNoteTarget } from '../../../domain/quran';
import {
  checklistAnchor,
  checklistChildren,
  checklistRange,
  clearChecklistCoverage,
  clearChecklistPosition,
  decodeChecklistState,
  totalVerses,
  toggleCoverage,
  versePoint,
  type ChecklistState,
} from '../../../domain/checklist';
import { Button, Icon, Notice, Screen, Segments, Sheet, T, s } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppNavigation } from '../../../app/navigation/types';
import { useI18n } from '../../../i18n';
import { usePracticeListAnchor } from '../hooks/usePracticeListAnchor';

const KEY = 'wirdna:checklist:v1';
let saveQueue: Promise<void> = Promise.resolve();
const loadErrorCopy = {
  en: 'Your saved checklist could not be opened. Existing data has been kept.',
  nl: 'Je opgeslagen checklist kan niet worden geopend. De bestaande gegevens zijn bewaard.',
  ar: 'تعذّر فتح قائمة المتابعة المحفوظة. تم الاحتفاظ بالبيانات الموجودة.',
};
export function ChecklistScreen() {
  const p = usePalette();
  const nav = useAppNavigation();
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<Exclude<NoteScope, 'ayah'>>('hizb');
  const [expanded, setExpanded] = useState(0);
  const [data, setData] = useState<ChecklistState>({ coverage: [], position: null });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<'load' | 'save' | null>(null);
  const [clearing, setClearing] = useState<'position' | 'checklist' | null>(null);
  const live = useRef(true);
  const current = useRef(data);
  const anchor = usePracticeListAnchor(
    ready ? checklistAnchor(data.position, mode) - 1 : null,
    mode,
  );
  const load = useCallback(async () => {
    setBusy(true);
    setFailure(null);
    try {
      await saveQueue.catch(() => undefined);
      const raw = await AsyncStorage.getItem(KEY);
      const value =
        raw === null ? { coverage: [], position: null } : decodeChecklistState(JSON.parse(raw));
      if (live.current) {
        current.current = value;
        setData(value);
        setReady(true);
      }
    } catch {
      if (live.current) {
        setReady(false);
        setFailure('load');
      }
    } finally {
      if (live.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    live.current = true;
    void load();
    return () => {
      live.current = false;
    };
  }, [load]);
  useEffect(() => {
    if (!ready) return;
    const anchor = checklistAnchor(current.current.position, mode);
    setExpanded(mode === 'hizb' || mode === 'juz' ? anchor : 0);
    // Checkmarks and a newly saved stop must not move the list beneath a tap.
  }, [mode, ready]);
  function save(value: ChecklistState) {
    anchor.cancel();
    current.current = value;
    setData(value);
    setBusy(true);
    setFailure(null);
    saveQueue = saveQueue
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(value)));
    void saveQueue
      .catch(() => {
        if (live.current) setFailure('save');
      })
      .finally(() => {
        if (live.current) setBusy(false);
      });
  }
  const disabled = !ready || busy || failure !== null;
  const coverage = new Set(data.coverage);
  const maximum =
    mode === 'surah' ? chapters.length : mode === 'juz' ? 30 : mode === 'hizb' ? 60 : 240;
  const nextIndex = data.position ? checklistRange(data.position)[1] : 0;
  const next = nextIndex < totalVerses ? versePoint(nextIndex) : null;
  const number = (n: number) => n.toLocaleString(locale, { useGrouping: false });
  const point = (v: { surah: number; ayah: number }) =>
    `${locale === 'ar' ? chapterById(v.surah).nameAr : chapterById(v.surah).name} · ${number(v.surah)}:${number(v.ayah)}`;
  const name = (target: QuranNoteTarget) =>
    target.scope === 'surah'
      ? `${number(target.number)} · ${locale === 'ar' ? chapterById(target.number).nameAr : chapterById(target.number).name}`
      : target.scope === 'rub'
        ? `${t('checklist.hizb')} ${number(Math.ceil(target.number / 4))} · ${t('checklist.rub')} ${number(((target.number - 1) % 4) + 1)}`
        : `${t(`checklist.${target.scope}`)} ${number(target.number)}`;
  function partRow(target: QuranNoteTarget, expandable = false) {
    const [start, end] = checklistRange(target);
    let count = 0;
    for (let i = start; i < end; i++) if (coverage.has(i)) count++;
    const done = count === end - start;
    const partial = count > 0 && !done;
    const label = name(target);
    const isPosition =
      data.position?.scope === target.scope && data.position.number === target.number;
    return (
      <View testID={`part-${target.scope}-${target.number}`} style={{ paddingVertical: 6 }}>
        <View style={[s.row, { alignItems: 'center' }]}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`${t(done ? 'checklist.undo' : 'checklist.check')}: ${label}`}
            accessibilityState={{ checked: partial ? 'mixed' : done, disabled }}
            disabled={disabled}
            onPress={() =>
              save({
                ...current.current,
                coverage: toggleCoverage(current.current.coverage, target, !done),
              })
            }
            style={{ width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon
              name={done ? 'check-circle' : partial ? 'minus-circle' : 'circle'}
              color={done || partial ? p.primary : p.muted}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('checklist.open')}: ${label}`}
            onPress={() => nav.navigate('Mushaf', versePoint(start))}
            style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}
          >
            <T translate={false} bold>
              {label}
            </T>
            <T translate={false} muted size={12}>
              {point(versePoint(start))}
            </T>
          </Pressable>
          {expandable && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ expanded: expanded === target.number }}
              onPress={() => {
                anchor.cancel();
                setExpanded(expanded === target.number ? 0 : target.number);
              }}
              style={{ width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name={expanded === target.number ? 'chevron-up' : 'chevron-down'} />
            </Pressable>
          )}
        </View>
        <Button
          title={t(isPosition ? 'checklist.saved' : 'checklist.stop')}
          variant="quiet"
          disabled={disabled || isPosition}
          onPress={() => save({ ...current.current, position: target })}
          style={{ alignSelf: 'flex-start', marginStart: 48 }}
        />
      </View>
    );
  }
  return (
    <Screen scroll={false}>
      <T size={30} bold>
        {t('checklist.title')}
      </T>
      {failure && (
        <Notice
          error
          message={failure === 'load' ? loadErrorCopy[locale] : t('checklist.error')}
          onRetry={() => (failure === 'load' ? void load() : save(current.current))}
        />
      )}
      <View style={{ gap: 8, marginVertical: 14 }}>
        <T bold>{t('checklist.here')}</T>
        <T translate={false} muted>
          {data.position
            ? `${name(data.position)} · ${point(versePoint(checklistRange(data.position)[1] - 1))}`
            : t('checklist.empty')}
        </T>
        <T translate={false} muted>
          {next ? `${t('checklist.next')}: ${point(next)}` : t('checklist.end')}
        </T>
        {next && (
          <Button
            title={t('checklist.continue')}
            icon="book-open"
            disabled={!ready}
            onPress={() => nav.navigate('Mushaf', next)}
          />
        )}
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          <Button
            title={t('checklist.clearPosition')}
            variant="quiet"
            disabled={disabled || !data.position}
            onPress={() => setClearing('position')}
          />
          <Button
            title={t('checklist.clearChecklist')}
            variant="quiet"
            disabled={disabled || data.coverage.length === 0}
            onPress={() => setClearing('checklist')}
          />
        </View>
      </View>
      <T muted size={13}>
        {t('checklist.help')}
      </T>
      <Segments
        value={mode}
        onChange={setMode}
        options={(['surah', 'juz', 'hizb', 'rub'] as const).map((value) => ({
          value,
          label: t(`checklist.${value}`),
        }))}
      />
      <FlatList
        {...anchor.listProps}
        key={mode}
        data={Array.from({ length: maximum }, (_, i) => i + 1)}
        keyExtractor={(n) => `${mode}:${n}`}
        renderItem={({ item: n }) => {
          const target: QuranNoteTarget = { scope: mode, number: n };
          const children = checklistChildren(target);
          return (
            <View style={{ borderBottomColor: p.line, borderBottomWidth: 1 }}>
              {partRow(target, children.length > 0)}
              {expanded === n && children.length > 0 && (
                <View style={{ paddingStart: 16 }}>
                  {children.map((child) => (
                    <React.Fragment key={child.number}>{partRow(child)}</React.Fragment>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
      <Sheet
        visible={clearing !== null}
        title={t(clearing === 'position' ? 'checklist.clearPosition' : 'checklist.clearChecklist')}
        onClose={() => setClearing(null)}
      >
        <T>
          {t(clearing === 'position' ? 'checklist.positionWarning' : 'checklist.checklistWarning')}
        </T>
        <Button
          title={t('checklist.clear')}
          variant="danger"
          style={{ marginTop: 18 }}
          onPress={() => {
            const action = clearing;
            setClearing(null);
            save(
              action === 'position'
                ? clearChecklistPosition(current.current)
                : clearChecklistCoverage(current.current),
            );
          }}
        />
        <Button title={t('checklist.cancel')} variant="quiet" onPress={() => setClearing(null)} />
      </Sheet>
    </Screen>
  );
}
