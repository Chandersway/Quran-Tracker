import React, { useState } from 'react';
import { readingStreakText } from '../../../i18n/readingStreak';
import { FlatList, Pressable, View } from 'react-native';
import { useAppStore } from '../../../state/store';
import { localDate } from '../../../domain/localDate';
import { newId } from '../../../state/reducer';
import { chapterById } from '../../../content/quran';
import {
  explicitAssessments,
  averageAssessmentScore,
  inconsistentJuz,
  reviewDue,
  type Assessment,
  type AssessmentKind,
} from '../../../domain/hifz';
import { motivationStats } from '../../../domain/motivation';
import { hifzCardColors } from '../../../domain/hifzPresentation';
import { progressForGoal } from '../../../domain/goals';
import {
  Button,
  Card,
  Field,
  Notice,
  ProgressBar,
  Row,
  Section,
  Segments,
  Sheet,
  T,
  s,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useI18n } from '../../../i18n';

/** DashboardScreen.kt: explicit assessments, review advice, motivation and ranges. */
export function PracticeOverview() {
  const { state, dispatch } = useAppStore();
  const { t, format, locale } = useI18n();
  const p = usePalette();
  const [kind, setKind] = useState<AssessmentKind>('surah');
  const [editing, setEditing] = useState(false);
  const [from, setFrom] = useState('1'),
    [to, setTo] = useState('1'),
    [score, setScore] = useState('0');
  const [saved, setSaved] = useState(false);
  const now = Date.now();
  const today = localDate();
  const goal = state.goalDays.find((day) => day.goalId === 1 && day.date === today) ?? {
    goalId: 1,
    date: today,
    unit: state.goal.unit,
    target: state.goal.target,
    extra: 0,
    resolution: '',
  };
  const points = motivationStats(
    state.history,
    goal.target + goal.extra > 0 &&
      progressForGoal(goal, state.history).done >= goal.target + goal.extra,
  );
  const assessments = explicitAssessments(state.progress);
  const current = assessments.filter((item) => item.kind === kind);
  const average = averageAssessmentScore(assessments);
  const limit = kind === 'surah' ? 114 : kind === 'hizb' ? 60 : 30;
  const name = (item: Pick<Assessment, 'kind' | 'number'>) =>
    item.kind === 'surah'
      ? locale === 'ar'
        ? chapterById(item.number).nameAr
        : chapterById(item.number).name
      : format(`common.${item.kind}Number`, item.number);
  const due = assessments
    .map((item) => ({ ...item, days: reviewDue(item, now) }))
    .sort(
      (a, b) =>
        a.days - b.days || a.score - b.score || a.kind.localeCompare(b.kind) || a.number - b.number,
    );
  function saveRange() {
    const first = Math.min(limit, Math.max(1, Number(from))),
      last = Math.min(limit, Math.max(1, Number(to)));
    if (![first, last, Number(score)].every(Number.isInteger)) return;
    for (let number = Math.min(first, last); number <= Math.max(first, last); number++)
      dispatch({ type: 'hifz', kind, number, score: Number(score), now });
    setEditing(false);
    setSaved(true);
  }
  return (
    <>
      <Section title={t('app.motivationPoints')} />
      <Card style={{ backgroundColor: p.subtle, gap: 12 }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <T bold>{t(points.level.key)}</T>
          <T bold size={24}>
            {points.total} {t('app.pointsShort')}
          </T>
        </View>
        <ProgressBar value={points.progress} label={t(points.level.key)} />
        <T muted size={12}>
          {points.remaining
            ? format('app.pointsToNextLevel', points.remaining)
            : t('app.newLevelReached')}
        </T>
        <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'space-between' }]}>
          {[
            ['app.today', points.today],
            ['app.week', points.week],
            ['app.bonus', points.bonus],
          ].map(([label, value]) => (
            <View key={label} style={{ gap: 3 }}>
              <T muted size={12}>
                {t(String(label))}
              </T>
              <T bold size={21}>
                {value}
              </T>
            </View>
          ))}
        </View>
        <T size={13}>{readingStreakText(points.streak, locale)}</T>
        <T size={12} muted>
          {t('app.latest')}:{' '}
          {points.latest
            ? `${points.latest.surahName} · +${points.latestPoints}`
            : t('quickCheck.noCheckIn')}
        </T>
        <T muted size={12}>
          {t('app.appPointsDisclaimer')}
        </T>
      </Card>
      <Section
        title={t('app.hifzOverview')}
        action={t('app.scoreRange')}
        onAction={() => {
          setSaved(false);
          setEditing(true);
        }}
      />
      <T muted size={13}>
        {t('hifz.independent')}
      </T>
      <T bold size={24} testID="home-hifz-average">
        {assessments.length ? `${average}/100` : '—'}
      </T>
      <T muted size={13}>
        {t('home.hifz.averageExplanation')}
      </T>
      <Segments
        value={kind}
        onChange={setKind}
        options={(['surah', 'hizb', 'juz'] as const).map((value) => ({
          value,
          label: t(`unit.${value}`),
        }))}
      />
      <View style={[s.row, { justifyContent: 'space-between', marginVertical: 10 }]}>
        <T muted size={13}>
          {format('hifz.assessed', current.length, limit)}
        </T>
      </View>
      <FlatList
        horizontal
        data={Array.from({ length: limit }, (_, index) => index + 1)}
        keyExtractor={String}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={3}
        getItemLayout={(_, index) => ({ length: 100, offset: 100 * index, index })}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
        renderItem={({ item: number }) => {
          const assessment = current.find((item) => item.number === number);
          return (
            <Pressable
              key={number}
              accessibilityRole="button"
              accessibilityLabel={format('tracker.hifzScoreTitle', name({ kind, number }))}
              onPress={() => {
                setFrom(String(number));
                setTo(String(number));
                setScore(String(assessment?.score ?? 0));
                setEditing(true);
              }}
              style={{
                width: 92,
                minHeight: 90,
                borderRadius: 10,
                backgroundColor: p.subtle,
                borderWidth: 1,
                borderColor: p.line,
                ...hifzCardColors(
                  assessment ? { hasHifzScore: true, progress: assessment.score } : undefined,
                  state.preferences.hifzColorsEnabled,
                ),
                padding: 10,
                gap: 5,
              }}
            >
              <T size={12}>
                {t(`unit.${kind}`)} {number}
              </T>
              <T bold size={22}>
                {assessment ? `${assessment.score}%` : '—'}
              </T>
            </Pressable>
          );
        }}
      />
      {saved && <Notice message={t('hifz.range.saved')} />}
      {!current.length ? (
        <T muted size={13}>
          {t('app.noHifzScores')}
        </T>
      ) : (
        <>
          {[
            ['app.reviewFirst', [...current].sort((a, b) => a.score - b.score)],
            ['app.strong', [...current].sort((a, b) => b.score - a.score)],
          ].map(([title, rows]) => (
            <View key={String(title)} style={{ marginTop: 16 }}>
              <T bold>{t(String(title))}</T>
              {(rows as Assessment[]).slice(0, 3).map((item) => (
                <Row
                  key={`${item.kind}:${item.number}`}
                  title={name(item)}
                  translateTitle={false}
                  trailing={<T bold>{item.score}/100</T>}
                />
              ))}
            </View>
          ))}
        </>
      )}
      {inconsistentJuz(assessments).map((number) => (
        <Notice
          key={number}
          message={format('hifz.consistency', number, number * 2 - 1, number * 2)}
        />
      ))}
      <Section title={t('app.repeatDue')} />
      <T muted size={13}>
        {t('app.repeatDueSubtitle')}
      </T>
      {!due.length ? (
        <T muted style={{ marginTop: 12 }}>
          {t('app.noRepeatAdvice')}
        </T>
      ) : (
        due.slice(0, 5).map((item) => {
          const date = new Date();
          date.setDate(date.getDate() + Math.max(0, item.days));
          const dateKey = localDate(date);
          const planned = state.plans.some(
            (plan) =>
              plan.date === dateKey &&
              plan.type === item.kind &&
              plan.referenceId === item.number &&
              plan.arabicText?.includes('Hifz herhaling'),
          );
          return (
            <Row
              key={`${item.kind}:${item.number}`}
              title={name(item)}
              translateTitle={false}
              subtitle={`${format('tracker.scoreValue', item.score)} · ${item.days < 0 ? format('app.lateDays', -item.days) : item.days === 0 ? t('app.today') : item.days === 1 ? t('app.tomorrow') : format('app.inDays', item.days)}`}
              trailing={
                <Button
                  title={t(planned ? 'app.planned' : 'app.agenda')}
                  variant="secondary"
                  disabled={planned}
                  onPress={() =>
                    dispatch({
                      type: 'plan/add',
                      plans: [
                        {
                          id: newId(),
                          date: dateKey,
                          type: item.kind,
                          referenceId: item.number,
                          subId: 0,
                          displayName: name(item),
                          arabicText: `${t(`unit.${item.kind}`)} · Hifz herhaling`,
                          isDone: false,
                          historyLogged: false,
                          reminderHour: null,
                          reminderMinute: null,
                          createdAt: now,
                          goalId: 1,
                          amount: 1,
                          measurementUnit: item.kind,
                        },
                      ],
                    })
                  }
                />
              }
            />
          );
        })
      )}
      <Sheet visible={editing} title={t('app.scoreRange')} onClose={() => setEditing(false)}>
        <T muted>{format('hifz.range.limit', 1, limit)}</T>
        <View style={[s.row, { alignItems: 'flex-start', marginTop: 16 }]}>
          <View style={{ flex: 1 }}>
            <Field
              label={t('hifz.range.from')}
              keyboardType="number-pad"
              value={from}
              onChangeText={setFrom}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label={t('hifz.range.to')}
              keyboardType="number-pad"
              value={to}
              onChangeText={setTo}
            />
          </View>
        </View>
        <Field
          label={t('app.hifzScore')}
          keyboardType="number-pad"
          value={score}
          onChangeText={setScore}
        />
        <Button
          title={t('hifz.range.apply')}
          disabled={
            !/^\d{1,3}$/.test(score) ||
            Number(score) > 100 ||
            !/^\d{1,3}$/.test(from) ||
            !/^\d{1,3}$/.test(to)
          }
          onPress={saveRange}
        />
        <Button title={t('hifz.clear')} variant="quiet" onPress={() => setScore('0')} />
      </Sheet>
    </>
  );
}
