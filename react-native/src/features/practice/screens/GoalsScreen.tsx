import { readingUnitLabelKey } from '../../../domain/readingUnit';
import { QuickCheckInSheet } from '../components/QuickCheckInSheet';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { useAppStore } from '../../../state/store';
import { localDate } from '../../../domain/localDate';
import { newId } from '../../../state/reducer';
import {
  goalUnits,
  progressForGoal,
  resolveGoalDay,
  saveGoalDefinition,
} from '../../../domain/goals';
import { goalAction, planIdentity } from '../../../domain/planning';
import { goalRegistrationTimestamp } from '../../../domain/goalRegistration';
import { parseDateKey } from '../../../domain/journey';
import type { DailyGoal, Plan } from '../../../state/models';
import {
  Button,
  Card,
  Field,
  Icon,
  Notice,
  ProgressBar,
  Row,
  Screen,
  Section,
  Segments,
  Sheet,
  T,
  s,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { chapterById } from '../../../content/quran';
import { ReadingJourneyPanel } from '../../planning/components/ReadingJourneyPanel';
import type { RootStack } from '../../../app/navigation/types';
import { useI18n } from '../../../i18n';

const goalNames: Record<number, string> = { 1: 'Reading', 2: 'Memorization', 3: 'Review' };
export function GoalsScreen() {
  const { params } = useRoute<RouteProp<RootStack, 'Goals'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStack, 'Goals'>>();
  const { t } = useI18n();
  const p = usePalette();
  const { state, dispatch } = useAppStore();
  const today = localDate();
  const [editing, setEditing] = useState<DailyGoal | null>(null);
  const [target, setTarget] = useState('4');
  const [unit, setUnit] = useState('rub');
  const [hour, setHour] = useState('8');
  const [minute, setMinute] = useState('0');
  const [quickCheck, setQuickCheck] = useState(Boolean(params?.quickCheckIn));
  const [recording, setRecording] = useState<number | null>(null);
  const [amount, setAmount] = useState('1');
  const [recordUnit, setRecordUnit] = useState<string>('rub');
  const [date, setDate] = useState(today);
  const [scheduling, setScheduling] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const selectedDate = params?.date ?? today;
  const [content, setContent] = useState<'surah' | 'hizb' | 'juz'>('surah');
  const [number, setNumber] = useState('1');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (params?.quickCheckIn) {
      setQuickCheck(true);
      navigation.setParams({ quickCheckIn: undefined });
    }
  }, [params?.quickCheckIn, navigation]);
  useEffect(() => {
    dispatch({ type: 'goals/refresh', date: today });
  }, [dispatch, today]);
  function save() {
    if (!editing) return;
    try {
      const goal = {
        ...editing,
        target: Number(target),
        unit,
        reminderHour: Number(hour),
        reminderMinute: Number(minute),
      };
      saveGoalDefinition(state, goal, today);
      dispatch({ type: 'goals/save', goal, date: today });
      setEditing(null);
      setMessage('Your daily intention is saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'This goal could not be saved.');
    }
  }
  function record() {
    try {
      parseDateKey(date);
      if (scheduling ? date < today : date > today)
        throw new Error(t('onboarding.planning.invalid'));
      const timestamp = goalRegistrationTimestamp(date, Date.now());
      const linkedPlan = selectedPlanId
        ? state.plans.find((plan) => plan.id === selectedPlanId)
        : null;
      if (linkedPlan && !scheduling) {
        const id = newId();
        dispatch({
          type: 'goals/record',
          planId: linkedPlan.id,
          entry: {
            id,
            sourceKey: `plan:${linkedPlan.id}`,
            surahId: linkedPlan.referenceId,
            surahName: linkedPlan.displayName,
            type: linkedPlan.measurementUnit || linkedPlan.type,
            action: goalAction(recording ?? 1),
            amount: linkedPlan.amount,
            timestamp,
            dateKey: date,
            ownerId: '',
            contentType: linkedPlan.type,
          },
        });
        setRecording(null);
        setMessage(t('planning.saved'));
        return;
      }
      parseDateKey(date);
      const n = Number(number);
      const a = Number(amount);
      const max = content === 'surah' ? 114 : content === 'hizb' ? 60 : 30;
      if (!Number.isInteger(n) || n < 1 || n > max)
        throw new Error(`Choose a ${content} number between 1 and ${max}.`);
      if (!Number.isInteger(a) || a < 1 || a > 10000 || (scheduling ? date < today : date > today))
        throw new Error(t('onboarding.planning.invalid'));
      const id = newId();
      if (scheduling) {
        const plan: Plan = {
          id,
          date,
          type: content,
          referenceId: n,
          subId: 0,
          displayName: `${t(goalNames[recording ?? 1] ?? 'Reading')} · ${content === 'surah' ? chapterById(n).name : `${t(content)} ${n}`}`,
          isDone: false,
          historyLogged: false,
          reminderHour: null,
          reminderMinute: null,
          createdAt: Date.now(),
          goalId: recording ?? 1,
          amount: 1,
          measurementUnit: content,
        };
        if (state.plans.some((existing) => planIdentity(existing) === planIdentity(plan)))
          throw new Error(t('ui.planning.duplicate'));
        dispatch({ type: 'plan/add', plans: [plan] });
        setRecording(null);
        setMessage(t('planning.saved'));
        return;
      }
      dispatch({
        type: 'goals/record',
        entry: {
          id,
          sourceKey: `goal:${id}`,
          surahId: n,
          surahName: content === 'surah' ? chapterById(n).name : `${content} ${n}`,
          type: recordUnit,
          action: goalAction(recording ?? 1),
          amount: a,
          timestamp,
          dateKey: date,
          ownerId: '',
          contentType: content,
        },
      });
      setRecording(null);
      setMessage('A little more practice, recorded.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'This session could not be recorded.');
    }
  }
  function resolve(goalId: number, date: string, mode: 'carry' | 'spread' | 'skip') {
    try {
      resolveGoalDay(state, goalId, date, mode, today);
      dispatch({ type: 'goals/resolve', goalId, date, mode, today });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'This day could not be updated.');
    }
  }
  const past = state.goalDays
    .filter(
      (day) =>
        day.date < today && !day.resolution && progressForGoal(day, state.history).remaining > 0,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const matchingPlans = state.plans.filter(
    (plan) =>
      plan.date === date &&
      plan.goalId === recording &&
      !plan.historyLogged &&
      ['surah', 'hizb', 'juz'].includes(plan.type),
  );
  function openRecord(goal: DailyGoal, schedule: boolean) {
    const selectedContent =
      goal.unit === 'juz' ? 'juz' : goal.unit === 'hizb' || goal.unit === 'rub' ? 'hizb' : 'surah';
    setRecording(goal.id);
    setScheduling(schedule);
    setRecordUnit(selectedContent);
    setDate(selectedDate);
    setAmount('1');
    setError('');
    setSelectedPlanId(null);
    setContent(selectedContent);
  }
  return (
    <Screen>
      <T size={32} bold style={{ letterSpacing: -0.8 }}>
        {t('inline.GoalHubPanel.1533e1efd2')}
      </T>
      <T muted style={{ marginTop: 10 }}>
        {t('inline.GoalHubPanel.3245f2648a')}
      </T>
      {message && <Notice message={message} />}
      <ReadingJourneyPanel />
      {state.goals.map((goal) => {
        const day = state.goalDays.find(
          (day) => day.goalId === goal.id && day.date === selectedDate,
        ) ?? {
          goalId: goal.id,
          date: selectedDate,
          unit: goal.unit,
          target: selectedDate >= today ? goal.target : 0,
          extra: 0,
          resolution: '',
        };
        const progress = progressForGoal(day, state.history);
        return (
          <View key={goal.id} style={{ marginTop: 28 }}>
            <View style={[s.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
              <T size={23} bold>
                {t(goalNames[goal.id] ?? 'Reading')}
              </T>
              <Button
                title="common.open"
                variant="quiet"
                onPress={() => {
                  setEditing(goal);
                  setUnit(goal.unit);
                  setTarget(String(goal.target));
                  setHour(String(goal.reminderHour));
                  setMinute(String(goal.reminderMinute));
                  setError('');
                }}
              />
            </View>
            <Card color={goal.id === 1 ? p.lime : goal.id === 2 ? p.peach : p.blueWash}>
              <View style={s.row}>
                <Icon
                  name={goal.id === 1 ? 'book-open' : goal.id === 2 ? 'activity' : 'refresh-cw'}
                  color={p.primary}
                />
                <T bold size={22}>
                  {progress.done} / {progress.target} {t(readingUnitLabelKey(day.unit))}
                </T>
              </View>
              <View style={{ marginTop: 18 }}>
                <ProgressBar value={progress.fraction} label={t(goalNames[goal.id] ?? 'Reading')} />
              </View>
              {!!day.resolution && (
                <T muted size={13} style={{ marginTop: 10 }}>
                  {t(
                    day.resolution === 'carry'
                      ? 'inline.GoalHubPanel.799ac7bdd3'
                      : day.resolution === 'spread'
                        ? 'inline.GoalHubPanel.bc7c6d824c'
                        : 'inline.GoalHubPanel.8b5407d6f9',
                  )}
                </T>
              )}
              <T muted size={13} style={{ marginVertical: 10 }}>
                {progress.target === 0
                  ? t('inline.GoalHubPanel.1b3eb959e5')
                  : `${t('inline.GoalHubPanel.767791c52c')}${progress.remaining} ${t(readingUnitLabelKey(day.unit))}${day.extra ? t('inline.GoalHubPanel.d06b01ca84') : ''}`}
              </T>
              {progress.target > 0 && selectedDate <= today && (
                <Button
                  title="inline.GoalHubPanel.846ac43c5f"
                  variant="secondary"
                  icon="plus"
                  onPress={() => openRecord({ ...goal, unit: day.unit }, false)}
                />
              )}
              {progress.target > 0 && selectedDate >= today && (
                <Button
                  title="inline.GoalHubPanel.2aa58bde7c"
                  variant="quiet"
                  icon="calendar"
                  onPress={() => openRecord(goal, true)}
                />
              )}
            </Card>
          </View>
        );
      })}
      {past.length > 0 && (
        <>
          <Section title="inline.GoalHubPanel.11cbeb183b" />
          <T muted>{t('inline.GoalHubPanel.3245f2648a')}</T>
          {past.map((day) => (
            <View key={`${day.goalId}:${day.date}`} style={{ marginTop: 20 }}>
              <Row
                title={`${t(goalNames[day.goalId] ?? 'Reading')} · ${day.date}`}
                translateTitle={false}
                subtitle={`${progressForGoal(day, state.history).remaining} ${t(readingUnitLabelKey(day.unit))}`}
              />
              <View style={[s.row, { flexWrap: 'wrap' }]}>
                <Button
                  title="Carry"
                  variant="secondary"
                  onPress={() => resolve(day.goalId, day.date, 'carry')}
                />
                <Button
                  title="Spread"
                  variant="secondary"
                  onPress={() => resolve(day.goalId, day.date, 'spread')}
                />
                <Button
                  title="Let it go"
                  variant="quiet"
                  onPress={() => resolve(day.goalId, day.date, 'skip')}
                />
              </View>
            </View>
          ))}
        </>
      )}
      <QuickCheckInSheet
        visible={quickCheck}
        onClose={() => setQuickCheck(false)}
        onSaved={() => setMessage(t('quickCheck.saved'))}
      />
      <Sheet
        visible={editing !== null}
        title={t(goalNames[editing?.id ?? 1] ?? 'Reading')}
        onClose={() => setEditing(null)}
      >
        <T bold>{t('dailyGoal.unit')}</T>
        <Segments
          value={unit}
          onChange={setUnit}
          options={goalUnits.map((value) => ({ value, label: t(readingUnitLabelKey(value)) }))}
        />
        <Field
          label="inline.GoalHubPanel.e1f4a7690e"
          keyboardType="number-pad"
          value={target}
          onChangeText={setTarget}
        />
        {editing?.id === 1 && (
          <View style={[s.row, { alignItems: 'flex-start' }]}>
            <View style={{ flex: 1 }}>
              <Field
                label="notifications.hours"
                value={hour}
                onChangeText={setHour}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="notifications.minutesLabel"
                value={minute}
                onChangeText={setMinute}
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}
        {error && <Notice error message={error} />}
        <Button title="inline.GoalHubPanel.88b7665451" onPress={save} />
      </Sheet>
      <Sheet
        visible={recording !== null}
        title={t(goalNames[recording ?? 1] ?? 'Reading')}
        onClose={() => setRecording(null)}
      >
        <Field
          label="onboarding.planning.chooseDate"
          value={date}
          onChangeText={(value) => {
            setDate(value);
            setSelectedPlanId(null);
          }}
        />
        {!scheduling && (
          <T muted style={{ marginBottom: 12 }}>
            {t('inline.GoalHubPanel.9079129c66')}
          </T>
        )}
        {!scheduling && matchingPlans.length > 0 && (
          <>
            <T bold>{t('inline.GoalHubPanel.9aa2197d7a')}</T>
            <Segments
              translateLabels={false}
              value={selectedPlanId ?? '__new'}
              onChange={(value) => setSelectedPlanId(value === '__new' ? null : value)}
              options={[
                { value: '__new', label: t('inline.GoalHubPanel.0b1917cf55') },
                ...matchingPlans.map((plan) => ({ value: plan.id, label: plan.displayName })),
              ]}
            />
          </>
        )}
        {!selectedPlanId && (
          <>
            <T bold>{t('inline.GoalHubPanel.5ec079e340')}</T>
            <Segments
              value={content}
              onChange={(value) => {
                setContent(value);
                setRecordUnit(value);
                setAmount('1');
              }}
              options={[
                { value: 'surah', label: t('app.surah') },
                { value: 'hizb', label: t('app.hizb') },
                { value: 'juz', label: t('app.juz') },
              ]}
            />
            <Field
              label={t(
                content === 'hizb'
                  ? 'inline.GoalHubPanel.e1a3b3f5b5'
                  : content === 'juz'
                    ? 'inline.GoalHubPanel.a7249babca'
                    : 'inline.GoalHubPanel.9f835f96e5',
              )}
              value={number}
              onChangeText={setNumber}
              keyboardType="number-pad"
            />
            {!scheduling && (
              <>
                <Segments
                  value={recordUnit}
                  onChange={setRecordUnit}
                  options={['surah', ...goalUnits].map((value) => ({
                    value,
                    label: t(readingUnitLabelKey(value)),
                  }))}
                />
                <Field
                  label="inline.StatsReadingDetails.49e96d7cdf"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="number-pad"
                />
              </>
            )}
          </>
        )}
        {error && <Notice error message={error} />}
        <Button
          title={scheduling ? 'onboarding.planning.schedule' : 'inline.GoalHubPanel.bfdd510698'}
          icon="check"
          onPress={record}
        />
      </Sheet>
    </Screen>
  );
}
