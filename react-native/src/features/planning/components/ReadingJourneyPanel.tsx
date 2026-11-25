import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { useAppStore } from '../../../state/store';
import { localDate } from '../../../domain/localDate';

import { addDays } from '../../../domain/journey';
import { unitQuranFraction } from '../../../domain/goals';
import {
  journeyDialogTarget,
  readingJourneyForecast,
  readingJourneyProgress,
} from '../../../domain/readingJourney';
import { normalizePlanNumber } from '../../../domain/readingPlan';
import { useI18n } from '../../../i18n';
import {
  Button,
  Card,
  Field,
  Notice,
  ProgressBar,
  Segments,
  Sheet,
  T,
  s,
} from '../../../shared/components';
import { Calendar } from '../../../shared/components/Calendar';

/** The source journey follows the reading goal; scheduled khatma plans are separate. */
export function ReadingJourneyPanel() {
  const { state, dispatch } = useAppStore();
  const { t, locale, interpolate } = useI18n();
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<'daily' | 'date'>('daily');
  const [end, setEnd] = useState(addDays(localDate(), 29));
  const [amount, setAmount] = useState('20');
  const [calendar, setCalendar] = useState(false);
  const [error, setError] = useState('');
  const today = localDate();
  const journey = state.readingJourney;
  const goal = state.goals.find((row) => row.id === 1)!;
  const progress = readingJourneyProgress(journey, state.history, today);
  const forecast = readingJourneyForecast(journey, goal, state.history, today);
  const target = journeyDialogTarget(
    progress.remainingPages,
    amount,
    mode === 'date' ? end : null,
    today,
  );
  const preview = target
    ? addDays(today, Math.max(0, Math.ceil(progress.remainingPages / target) - 1))
    : null;
  const date = (value: string | null) =>
    value ? new Date(`${value}T12:00:00`).toLocaleDateString(locale, { dateStyle: 'medium' }) : '—';
  function open() {
    setEnabled(journey.enabled);
    setAmount(String(Math.max(1, Math.ceil(unitQuranFraction(goal.unit) * goal.target * 604))));
    setMode('daily');
    setError('');
    setEditing(true);
  }
  function save() {
    if (!target || target > 10000) return;
    try {
      dispatch({
        type: 'readingJourney/save',
        journey: {
          ...journey,
          enabled,
          startDate: progress.start,
          totalDays: 30,
          updatedAt: Date.now(),
        },
        goal: { ...goal, unit: 'pages', target },
        date: today,
      });
      setEditing(false);
    } catch {
      setError(t('readingPlan.Opslaan mislukt. Probeer opnieuw.'));
    }
  }
  return (
    <Card style={{ marginTop: 24, gap: 12 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}>
          <T bold size={21}>
            {t('inline.GoalHubPanel.44f9037fef')}
          </T>
          <T muted size={12}>
            {t('inline.GoalHubPanel.390df74bae')}
          </T>
        </View>
        <Switch
          accessibilityLabel={t('inline.ReadingJourneyDialog.2ffe9f50bf')}
          value={journey.enabled}
          onValueChange={(value) =>
            dispatch({
              type: 'readingJourney/save',
              journey: {
                ...journey,
                enabled: value,
                startDate: progress.start,
                updatedAt: Date.now(),
              },
              date: today,
            })
          }
        />
      </View>
      <ProgressBar value={progress.fraction} label={t('app.readingJourney')} />
      <T>
        {interpolate('inline.ReadingJourneyDialog.281880d192', {
          '(fraction * 100).toInt()': Math.floor(progress.fraction * 100).toLocaleString(locale),
        })}
      </T>
      {journey.enabled && (
        <>
          <T muted>
            {forecast.end
              ? `${t('inline.GoalHubPanel.d582650c15')}${date(forecast.end)}`
              : t('inline.GoalHubPanel.89e0b3d9ca')}
          </T>
          <T muted size={12}>
            {t('inline.GoalHubPanel.87c00db429')}
          </T>
        </>
      )}
      <Button title="inline.ReadingJourneyDialog.3a55c19024" variant="secondary" onPress={open} />
      <Sheet
        visible={editing}
        title="inline.ReadingJourneyDialog.3a55c19024"
        onClose={() => setEditing(false)}
      >
        <T bold>{t('inline.ReadingJourneyDialog.602cc4aea5')}</T>
        <T style={{ marginTop: 12 }}>
          {interpolate('inline.ReadingJourneyDialog.07c41b7050', {
            'ceil(remaining).toInt()': Math.ceil(progress.remainingPages).toLocaleString(locale),
          })}
        </T>
        <T muted size={12} style={{ marginVertical: 12 }}>
          {interpolate('inline.ReadingJourneyDialog.1866eecdf8', { start: progress.start })}
        </T>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <T>{t('inline.ReadingJourneyDialog.2ffe9f50bf')}</T>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>
        <Segments
          value={mode}
          onChange={setMode}
          options={[
            { value: 'daily', label: t('inline.ReadingJourneyDialog.5b9e193b00') },
            { value: 'date', label: t('inline.ReadingJourneyDialog.b79ed3f604') },
          ]}
        />
        {mode === 'daily' ? (
          <Field
            label="inline.ReadingJourneyDialog.40f739c547"
            value={amount}
            onChangeText={(value) =>
              setAmount(normalizePlanNumber(value).replace(/\D/g, '').slice(0, 5))
            }
            keyboardType="number-pad"
          />
        ) : (
          <>
            <Button
              title={date(end)}
              variant="secondary"
              onPress={() => setCalendar((value) => !value)}
            />
            {calendar && (
              <Calendar
                value={end}
                onChange={(value) => {
                  if (value >= today) {
                    setEnd(value);
                    setCalendar(false);
                  }
                }}
              />
            )}
            <T>
              {interpolate('inline.ReadingJourneyDialog.18dbb48da6', {
                target: target?.toLocaleString(locale) ?? '—',
              })}
            </T>
          </>
        )}
        <T bold style={{ marginVertical: 14 }}>
          {t('inline.ReadingJourneyDialog.28a5051a6c')}
          {date(preview)}
        </T>
        <T muted size={13} style={{ marginBottom: 16 }}>
          {t('inline.ReadingJourneyDialog.68f4cbc617')}
        </T>
        {error && <Notice error message={error} />}
        <Button title="common.save" disabled={!target || target > 10000} onPress={save} />
      </Sheet>
    </Card>
  );
}
