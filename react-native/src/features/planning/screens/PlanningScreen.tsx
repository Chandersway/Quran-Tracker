import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useAppStore } from '../../../state/store';
import { addDays, buildJourneyPlans, parseDateKey } from '../../../domain/journey';
import { localDate } from '../../../domain/localDate';
import { newId } from '../../../state/reducer';
import { chapterById, divisions, divisionEnd } from '../../../content/quran';
import type { Plan } from '../../../state/models';
import {
  Button,
  Card,
  Empty,
  Field,
  Icon,
  IconButton,
  Notice,
  Row,
  Screen,
  Section,
  Segments,
  Sheet,
  T,
  s,
} from '../../../shared/components';
import { AgendaCalendar } from '../components/AgendaCalendar';
import {
  agendaReminderPreset,
  orderedAgendaPlans,
  type AgendaReminderPreset,
} from '../../../domain/agenda';
import { planIdentity } from '../../../domain/planning';
import { progressForGoal } from '../../../domain/goals';
import { useI18n } from '../../../i18n';
import { usePalette } from '../../../shared/theme';
import { useAppNavigation } from '../../../app/navigation/types';
import {
  planReminderCopy,
  planningReminderDueAt,
} from '../../../services/notifications/planningReminders';
import { requestPlanReminderPermission } from '../../../services/notifications/planningReminderPort';

export function PlanningScreen() {
  const p = usePalette();
  const nav = useAppNavigation();
  const { params } = useRoute<RouteProp<{ Plan: { planId?: string } | undefined }, 'Plan'>>();
  const { state, dispatch, commit } = useAppStore();
  const { t, locale, format } = useI18n();
  const [date, setDate] = useState(localDate());
  const [sheet, setSheet] = useState<'plan' | 'journey' | null>(null);
  const [kind, setKind] = useState<'surah' | 'juz' | 'hizb' | 'rub'>('surah');
  const [number, setNumber] = useState('1');
  const [endDate, setEndDate] = useState(addDays(localDate(), 29));
  const [startRub, setStartRub] = useState('1');
  const [endRub, setEndRub] = useState('240');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [removedPlan, setRemovedPlan] = useState<Plan | null>(null);
  const [reminderPlan, setReminderPlan] = useState<Plan | null>(null);
  const [reminderHour, setReminderHour] = useState('20');
  const [reminderMinute, setReminderMinute] = useState('00');
  const [reminderError, setReminderError] = useState('');
  const [reminderPreset, setReminderPreset] = useState<AgendaReminderPreset | null>(null);
  const [savingReminder, setSavingReminder] = useState(false);
  const reminderInFlight = useRef(false);
  const [sessionGoal, setSessionGoal] = useState<'1' | '2' | '3'>('1');
  const [allUpcoming, setAllUpcoming] = useState(false);
  const [showMissed, setShowMissed] = useState(false);
  const consumedPlan = useRef<string | null>(null);
  const today = localDate();
  useEffect(() => {
    if (!params?.planId || consumedPlan.current === params.planId) return;
    const plan = state.plans.find((item) => item.id === params.planId);
    if (plan) {
      setDate(plan.date);
      consumedPlan.current = params.planId;
    }
  }, [params?.planId, state.plans]);
  useEffect(() => {
    dispatch({ type: 'goals/refresh', date: today });
  }, [dispatch, today]);
  const reminderCopy = planReminderCopy(state.preferences.language);
  const items = orderedAgendaPlans(state.plans, date);
  const upcoming = orderedAgendaPlans(
    state.plans.filter((plan) => plan.date > today && !plan.isDone),
  );
  const missed = [
    ...new Set(
      state.plans.filter((plan) => plan.date < today && !plan.isDone).map((plan) => plan.date),
    ),
  ]
    .sort()
    .reverse();
  const max = kind === 'surah' ? 114 : kind === 'juz' ? 30 : kind === 'hizb' ? 60 : 240;
  function planningError(error: unknown): string {
    const code = error instanceof Error ? error.message : '';
    if (code === 'PLANNING_NUMBER_INVALID') return format('ui.planning.numberInvalid', max);
    if (code === 'PLANNING_DUPLICATE') return t('ui.planning.duplicate');
    if (code === 'PLANNING_REMINDER_PAST') return t('ui.planning.reminderPast');
    if (
      code === 'Use a date in YYYY-MM-DD format.' ||
      code === 'Choose a valid calendar date.' ||
      code === 'Choose a valid plan date.'
    )
      return t('ui.planning.dateInvalid');
    if (code === 'Choose an end date after the start, within ten years.')
      return t('ui.planning.endInvalid');
    if (code === 'Choose a rub range between 1 and 240.') return t('ui.planning.rubInvalid');
    if (code === 'Choose a valid reminder time.') return t('ui.planning.timeInvalid');
    if (
      code ===
      'That local time does not exist because of the daylight-saving change. Choose another time.'
    )
      return t('ui.planning.dstTime');
    return t('readingPlan.Opslaan mislukt. Probeer opnieuw.');
  }
  function savePlan() {
    try {
      parseDateKey(date);
      const n = Number(number);
      if (!Number.isInteger(n) || n < 1 || n > max) throw new Error('PLANNING_NUMBER_INVALID');
      const identity = planIdentity({
        date,
        goalId: Number(sessionGoal),
        type: kind,
        referenceId: kind === 'rub' ? Math.ceil(n / 4) : n,
        subId: kind === 'rub' ? ((n - 1) % 4) + 1 : 0,
      });
      const isDuplicate = state.plans.some((plan) => planIdentity(plan) === identity);
      if (isDuplicate) throw new Error('PLANNING_DUPLICATE');
      setRemovedPlan(null);
      const contentName =
        kind === 'surah'
          ? locale === 'ar'
            ? chapterById(n).nameAr
            : chapterById(n).name
          : `${t(kind)} ${n}`;
      dispatch({
        type: 'plan/add',
        plans: [
          {
            id: newId(),
            date,
            type: kind,
            referenceId: kind === 'rub' ? Math.ceil(n / 4) : n,
            subId: kind === 'rub' ? ((n - 1) % 4) + 1 : 0,
            displayName:
              Number(sessionGoal) === 1
                ? contentName
                : `${t(sessionGoal === '2' ? 'agenda.types.hifdh' : 'agenda.types.revision')} · ${contentName}`,
            isDone: false,
            historyLogged: false,
            reminderHour: null,
            reminderMinute: null,
            createdAt: Date.now(),
            goalId: Number(sessionGoal),
            amount: 1,
            measurementUnit: kind,
          },
        ],
      });
      setSheet(null);
      setMessage('planning.saved');
    } catch (e) {
      setError(planningError(e));
    }
  }
  function saveJourney() {
    try {
      const id = newId();
      const plans = buildJourneyPlans(date, endDate, Number(startRub), Number(endRub), id);
      setRemovedPlan(null);
      dispatch({
        type: 'journey/add',
        journey: {
          id,
          name: t('agenda.khatmaPlanTitle'),
          startDate: date,
          endDate,
          startRub: Number(startRub),
          endRub: Number(endRub),
        },
        plans,
      });
      setSheet(null);
      setMessage('agenda.khatmaPlanAdded');
    } catch (e) {
      setError(planningError(e));
    }
  }
  function openPlan(plan: Plan) {
    if (plan.type === 'surah')
      return nav.navigate('Mushaf', { surah: plan.referenceId, planId: plan.id });
    const startId =
      plan.type === 'khatma'
        ? plan.referenceId
        : plan.type === 'juz'
          ? (plan.referenceId - 1) * 8 + 1
          : plan.type === 'hizb'
            ? (plan.referenceId - 1) * 4 + 1
            : (plan.referenceId - 1) * 4 + plan.subId;
    const endId =
      plan.type === 'khatma'
        ? plan.subId
        : startId + (plan.type === 'juz' ? 7 : plan.type === 'hizb' ? 3 : 0);
    const d = divisions[startId - 1];
    if (!d) return;
    const end = divisionEnd(endId);
    nav.navigate('Mushaf', {
      surah: d.surah,
      ayah: d.ayah,
      endSurah: end.surah,
      endAyah: end.ayah,
      planId: plan.id,
    });
  }
  function openReminder(plan: Plan) {
    setReminderPlan(plan);
    setReminderError('');
    setReminderPreset(null);
    setReminderHour(String(plan.reminderHour ?? 20).padStart(2, '0'));
    setReminderMinute(String(plan.reminderMinute ?? 0).padStart(2, '0'));
  }
  async function saveReminder() {
    if (!reminderPlan || reminderInFlight.current) return;
    reminderInFlight.current = true;
    setSavingReminder(true);
    const hour = Number(reminderHour);
    const minute = Number(reminderMinute);
    try {
      const due = planningReminderDueAt(reminderPlan.date, hour, minute);
      const immediate = reminderPreset === 'now' && reminderPlan.date === localDate();
      if (!immediate && due.getTime() <= Date.now()) throw new Error('PLANNING_REMINDER_PAST');
      if (!(await requestPlanReminderPermission())) {
        setReminderError(reminderCopy.permissionDenied);
        return;
      }
      // The exact timestamp keeps "Now" eligible after this minute's start,
      // and still passes through the normal quiet-hours/category coordinator.
      await commit({
        type: 'plan/reminder',
        id: reminderPlan.id,
        hour,
        minute,
        dueAt: immediate ? Date.now() + 5_000 : null,
        notificationId: null,
      });
      setReminderPlan(null);
      setMessage('notifications.saved');
    } catch (e) {
      setReminderError(planningError(e));
    } finally {
      reminderInFlight.current = false;
      setSavingReminder(false);
    }
  }
  return (
    <Screen>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <T bold size={32} style={{ letterSpacing: -0.8 }}>
          {t('agenda.title')}
        </T>
        <IconButton
          name="list"
          label={t('checklist.title')}
          onPress={() => nav.navigate('Checklist')}
        />
      </View>
      <T muted style={{ marginVertical: 12 }}>
        {t('onboarding.planning.description')}
      </T>
      <AgendaCalendar value={date} onChange={setDate} plans={state.plans} />
      {message ? <Notice message={message} /> : null}
      {removedPlan && (
        <View
          accessibilityRole="alert"
          style={{ backgroundColor: p.subtle, padding: 16, borderRadius: 12, marginVertical: 8 }}
        >
          <T translate={false}>{format('ui.planning.removed', removedPlan.displayName)}</T>
          <Button
            title={t('ui.planning.undo')}
            variant="quiet"
            onPress={() => {
              dispatch({ type: 'plan/add', plans: [removedPlan] });
              setRemovedPlan(null);
            }}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
      )}
      <Section
        title={
          date === localDate()
            ? t('agenda.today.title')
            : new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
                month: 'long',
                day: 'numeric',
              })
        }
        action={t('agenda.add')}
        onAction={() => {
          setSheet('plan');
          setError('');
        }}
      />
      {items.length > 0 && (
        <T muted size={13}>
          {format(
            'agenda.completedCount',
            items.filter((plan) => plan.isDone).length,
            items.length,
          )}
        </T>
      )}
      {state.goals
        .filter((goal) => goal.target > 0)
        .map((goal) => {
          const day = state.goalDays.find((row) => row.goalId === goal.id && row.date === date) ?? {
            goalId: goal.id,
            date,
            unit: goal.unit,
            target: date >= today ? goal.target : 0,
            extra: 0,
            resolution: '',
          };
          const progress = progressForGoal(day, state.history);
          return (
            <Row
              key={`goal-${goal.id}`}
              title={t(
                goal.id === 2
                  ? 'agenda.types.hifdh'
                  : goal.id === 3
                    ? 'agenda.types.revision'
                    : 'agenda.types.reading',
              )}
              translateTitle={false}
              subtitle={format(
                'ui.planning.goalProgress',
                progress.done,
                progress.target,
                t(day.unit),
              )}
              icon={goal.id === 2 ? 'activity' : goal.id === 3 ? 'refresh-cw' : 'book-open'}
              onPress={() => nav.navigate('Goals', { date })}
            />
          );
        })}
      {items.length ? (
        items.map((plan) => (
          <View key={plan.id} style={[s.listRow, { borderBottomColor: p.line }]}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={format('ui.planning.markComplete', plan.displayName)}
              accessibilityState={{ checked: plan.isDone }}
              onPress={() =>
                dispatch({
                  type: 'plan/toggle',
                  id: plan.id,
                  completed: !plan.isDone,
                  date: localDate(),
                  now: Date.now(),
                })
              }
              style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon
                name={plan.isDone ? 'check-circle' : 'circle'}
                color={plan.isDone ? p.primary : p.muted}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={{ flex: 1 }}
              onPress={() => openPlan(plan)}
            >
              <T
                translate={false}
                bold
                style={plan.isDone ? { textDecorationLine: 'line-through' } : undefined}
              >
                {plan.displayName}
              </T>
              <T size={13} muted>
                {plan.reminderHour !== null && plan.reminderMinute !== null
                  ? format(
                      'agenda.remindMeAt',
                      `${String(plan.reminderHour).padStart(2, '0')}:${String(plan.reminderMinute).padStart(2, '0')}`,
                    )
                  : plan.isDone
                    ? t('agenda.completed')
                    : t('agenda.startReading')}
              </T>
            </Pressable>
            <IconButton
              name="bell"
              label={t(
                plan.reminderHour === null
                  ? 'agenda.empty.addReminder'
                  : 'ui.planning.editReminder',
              )}
              disabled={plan.isDone}
              selected={plan.reminderHour !== null}
              onPress={() => openReminder(plan)}
            />
            <IconButton
              name="trash-2"
              label={format('ui.planning.removePlan', plan.displayName)}
              onPress={() => {
                setRemovedPlan(plan);
                dispatch({ type: 'plan/delete', id: plan.id });
              }}
            />
          </View>
        ))
      ) : (
        <Empty
          icon="calendar"
          title={t('agenda.emptyTitle')}
          message={t('agenda.empty.description')}
          action={t('agenda.addItem')}
          onAction={() => {
            setSheet('plan');
            setError('');
          }}
        />
      )}
      <Card color={p.lime} style={{ marginTop: 24 }}>
        <Icon name="map" color={p.onLime} size={27} />
        <T bold size={23} color={p.onLime} style={{ marginTop: 16 }}>
          {t('agenda.khatmaPlanTitle')}
        </T>
        <T color={p.onLime} style={{ marginTop: 8, marginBottom: 20 }}>
          {t('agenda.khatmaPlanSubtitle')}
        </T>
        <Button
          title="agenda.createKhatmaPlan"
          icon="arrow-right"
          mirrorInRtl
          onPress={() => {
            setSheet('journey');
            setError('');
          }}
        />
      </Card>
      {state.journeys.length > 0 && (
        <>
          <Section title="app.khatmaAndAgenda" />
          {state.journeys.map((j) => (
            <Row
              key={j.id}
              title={j.name}
              translateTitle={false}
              subtitle={format(
                'ui.planning.journeyRange',
                j.startDate,
                j.endDate,
                j.startRub,
                j.endRub,
              )}
              icon="map"
            />
          ))}
        </>
      )}
      {upcoming.length > 0 && (
        <>
          <Section
            title="agenda.upcoming.title"
            action={
              upcoming.length > 3 ? (allUpcoming ? 'agenda.viewLess' : 'agenda.viewAll') : undefined
            }
            onAction={() => setAllUpcoming((value) => !value)}
          />
          {(allUpcoming ? upcoming : upcoming.slice(0, 3)).map((plan) => (
            <Row
              key={`upcoming-${plan.id}`}
              title={plan.displayName}
              translateTitle={false}
              subtitle={
                plan.date === addDays(today, 1)
                  ? t('agenda.upcoming.tomorrow')
                  : plan.date === addDays(today, 2)
                    ? t('agenda.upcoming.dayAfterTomorrow')
                    : new Date(`${plan.date}T12:00:00`).toLocaleDateString(locale, {
                        dateStyle: 'medium',
                      })
              }
              icon="calendar"
              onPress={() => setDate(plan.date)}
            />
          ))}
        </>
      )}
      {missed.length > 0 && (
        <>
          <Section
            title="agenda.missedDays"
            action={showMissed ? 'agenda.viewLess' : 'agenda.viewAll'}
            onAction={() => setShowMissed((value) => !value)}
          />
          {showMissed &&
            missed.map((day) => (
              <Row
                key={`missed-${day}`}
                title={new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
                  dateStyle: 'medium',
                })}
                translateTitle={false}
                subtitle={String(
                  state.plans.filter((plan) => plan.date === day && !plan.isDone).length,
                )}
                onPress={() => setDate(day)}
              />
            ))}
        </>
      )}
      <Sheet
        visible={sheet !== null}
        title={sheet === 'journey' ? 'agenda.khatmaPlanTitle' : 'agenda.addItem'}
        onClose={() => setSheet(null)}
      >
        <Field
          label={t('hizbOverview.from')}
          value={date}
          onChangeText={setDate}
          autoCapitalize="none"
        />
        {sheet === 'journey' ? (
          <>
            <Field
              label={t('hizbOverview.through')}
              value={endDate}
              onChangeText={setEndDate}
              autoCapitalize="none"
            />
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Field
                  label={t('ui.planning.firstRub')}
                  value={startRub}
                  onChangeText={setStartRub}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label={t('ui.planning.lastRub')}
                  value={endRub}
                  onChangeText={setEndRub}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <Segments
              value={sessionGoal}
              onChange={setSessionGoal}
              options={[
                { value: '1', label: t('agenda.types.reading') },
                { value: '2', label: t('agenda.types.hifdh') },
                { value: '3', label: t('agenda.types.revision') },
              ]}
            />
            <Segments
              value={kind}
              onChange={setKind}
              options={[
                { value: 'surah', label: 'Surah' },
                { value: 'juz', label: 'Juz' },
                { value: 'hizb', label: 'Hizb' },
                { value: 'rub', label: 'Rub' },
              ]}
            />
            <Field
              label={format('ui.planning.numberRange', max)}
              value={number}
              onChangeText={setNumber}
              keyboardType="number-pad"
            />
            {kind === 'surah' && Number(number) >= 1 && Number(number) <= 114 && (
              <T translate={false} muted style={{ marginBottom: 16 }}>
                {chapterById(Number(number)).name}
              </T>
            )}
          </>
        )}
        {error && <Notice error message={error} />}
        <Button
          title={sheet === 'journey' ? 'agenda.createKhatmaPlan' : 'agenda.addToPlanning'}
          onPress={sheet === 'journey' ? saveJourney : savePlan}
        />
      </Sheet>
      <Sheet
        visible={reminderPlan !== null}
        title={t('agenda.reminderTitle')}
        onClose={() => {
          if (!reminderInFlight.current) setReminderPlan(null);
        }}
      >
        <T translate={false} muted style={{ marginBottom: 16 }}>
          {reminderPlan?.displayName}
        </T>
        <View style={[s.row, { flexWrap: 'wrap', marginBottom: 12 }]}>
          {(['now', 'plusThirtyMinutes', 'tonight'] as const).map((preset) => (
            <Button
              key={preset}
              title={t(`agenda.${preset}`)}
              variant="secondary"
              disabled={savingReminder}
              onPress={() => {
                const clock = agendaReminderPreset(preset);
                setReminderHour(String(clock.hour).padStart(2, '0'));
                setReminderMinute(String(clock.minute).padStart(2, '0'));
                setReminderPreset(preset);
                setReminderError('');
              }}
            />
          ))}
        </View>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Field
              label={t('agenda.hour')}
              value={reminderHour}
              editable={!savingReminder}
              onChangeText={(value) => {
                setReminderPreset(null);
                setReminderHour(value.slice(0, 2));
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <T bold size={24} style={{ marginBottom: 16 }}>
            :
          </T>
          <View style={{ flex: 1 }}>
            <Field
              label={t('agenda.minute')}
              value={reminderMinute}
              editable={!savingReminder}
              onChangeText={(value) => {
                setReminderPreset(null);
                setReminderMinute(value.slice(0, 2));
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>
        {reminderError ? <Notice error message={reminderError} /> : null}
        <Button
          title={t('planning.saveReminder')}
          icon="bell"
          loading={savingReminder}
          onPress={saveReminder}
        />
        {reminderPlan?.reminderHour !== null && reminderPlan?.reminderHour !== undefined && (
          <Button
            title={t('agenda.clear')}
            variant="quiet"
            disabled={savingReminder}
            onPress={() => {
              dispatch({
                type: 'plan/reminder',
                id: reminderPlan.id,
                hour: null,
                minute: null,
                notificationId: null,
              });
              setReminderPlan(null);
              setMessage('ui.planning.reminderCleared');
            }}
            style={{ marginTop: 8 }}
          />
        )}
      </Sheet>
    </Screen>
  );
}
