import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, type Plan, type ReadingEntry } from '../src/state/models';
import {
  hizbAt,
  homeWidgetSnapshot,
  mushafLink,
} from '../src/features/homeWidget/model/homeWidgetSnapshot';
import { linking } from '../src/app/navigation/linking';
import { getStateFromPath } from '@react-navigation/core';

const t = (key: string) => (key === 'unit.hizb' ? 'Hizb' : key);
const today = '2026-11-24';
const goalState = {
  ...initialState,
  goals: [{ id: 1, unit: 'hizb', target: 2, reminderHour: 8, reminderMinute: 0 }],
  goal: { unit: 'hizb' as const, target: 2 },
};
const read = (amount: number, dateKey = today): ReadingEntry => ({
  id: `r${amount}${dateKey}`,
  surahId: 1,
  surahName: 'Hizb 1',
  type: 'hizb',
  action: 'read',
  amount,
  timestamp: 1,
  dateKey,
  sourceKey: `r${amount}${dateKey}`,
  ownerId: '',
  contentType: 'hizb',
});

test('widget shows today goal progress in Dutch and a fresh day for after midnight', () => {
  const snapshot = homeWidgetSnapshot(
    { ...goalState, history: [read(1), read(5, '2026-11-23')] },
    today,
    'nl',
    t,
  );
  assert.equal(snapshot.title, 'Vandaag lezen');
  assert.equal(snapshot.today.progressText, '1 / 2 Hizb');
  assert.equal(snapshot.today.status, 'Nog 1 Hizb te gaan');
  assert.equal(snapshot.today.fraction, 0.5);
  assert.equal(snapshot.today.complete, false);
  assert.equal(snapshot.tomorrow.date, '2026-11-25');
  assert.equal(snapshot.tomorrow.progressText, '0 / 2 Hizb');
});

test('widget marks a reached goal clearly', () => {
  const snapshot = homeWidgetSnapshot({ ...goalState, history: [read(2)] }, today, 'nl', t);
  assert.equal(snapshot.today.complete, true);
  assert.equal(snapshot.today.status, 'Dagdoel gehaald ✓');
  assert.equal(snapshot.today.fraction, 1);
});

test('widget opens the open reading plan for today before the resume point', () => {
  const plan: Plan = {
    id: 'p1',
    date: today,
    type: 'hizb',
    referenceId: 33,
    subId: 0,
    displayName: 'Hizb 33',
    isDone: false,
    historyLogged: false,
    reminderHour: null,
    reminderMinute: null,
    createdAt: 1,
    goalId: 1,
    amount: 1,
    measurementUnit: 'hizb',
  };
  const planned = homeWidgetSnapshot({ ...goalState, plans: [plan] }, today, 'nl', t);
  assert.equal(planned.next, 'Gepland: Hizb 33');
  assert.match(
    planned.url,
    /^qurantracker:\/\/mushaf\/\d+\?ayah=\d+&endSurah=\d+&endAyah=\d+&planId=p1$/,
  );
  const done = homeWidgetSnapshot(
    { ...goalState, plans: [{ ...plan, isDone: true }] },
    today,
    'nl',
    t,
  );
  assert.match(done.next, /^Verder: Hizb \d+ · /);
});

test('widget without a daily goal links to the goal settings', () => {
  const snapshot = homeWidgetSnapshot(
    { ...initialState, goals: [], goal: { unit: 'hizb', target: 0 } },
    today,
    'nl',
    t,
  );
  assert.equal(snapshot.url, 'qurantracker://goals');
  assert.equal(snapshot.today.status, 'Stel een dagdoel in');
});

test('widget deep link resolves to the Mushaf with numeric verse parameters', () => {
  assert.equal(hizbAt(1, 1), 1);
  assert.equal(hizbAt(2, 142), 3);
  const url = mushafLink({ surah: 2, ayah: 142, planId: 'p1' });
  const state = getStateFromPath(url.replace('qurantracker://', ''), linking.config);
  const route = state?.routes.at(-1);
  assert.equal(state?.routes[0]?.name, 'Main');
  assert.equal(route?.name, 'Mushaf');
  assert.deepEqual(route?.params, { surah: 2, ayah: 142, planId: 'p1' });
});
