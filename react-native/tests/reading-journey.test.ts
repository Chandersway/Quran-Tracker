import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState, type ReadingEntry } from '../src/state/models';
import { appReducer } from '../src/state/reducer';
import { decodeState } from '../src/state/persistence/decodeState';
import {
  defaultReadingJourney,
  journeyDialogTarget,
  readingJourneyForecast,
  readingJourneyProgress,
} from '../src/domain/readingJourney';

const journey = { ...defaultReadingJourney, enabled: true, startDate: '2026-11-01' };
const goal = { ...initialState.goals[0]!, unit: 'pages', target: 20 };
const history: ReadingEntry[] = [
  {
    id: 'read',
    surahId: 1,
    surahName: 'Pages',
    type: 'pages',
    action: 'read',
    amount: 200,
    timestamp: 1,
    dateKey: '2026-11-10',
    sourceKey: null,
    ownerId: '',
    contentType: 'surah',
  },
];

test('source dynamic journey forecast follows logged reading and changing daily quantity', () => {
  assert.equal(readingJourneyForecast(journey, goal, [], '2026-11-13').end, '2026-12-13');
  assert.equal(readingJourneyForecast(journey, goal, history, '2026-11-13').end, '2026-12-03');
  assert.equal(
    readingJourneyForecast(journey, { ...goal, target: 40 }, history, '2026-11-13').end,
    '2026-11-23',
  );
  assert.equal(
    readingJourneyForecast(journey, { ...goal, unit: 'minutes' }, history, '2026-11-13').end,
    null,
  );
  assert.equal(
    readingJourneyForecast(journey, { ...goal, target: 0 }, history, '2026-11-13').end,
    null,
  );
});
test('journey uses reading since its start and repeated reading counts toward one full Quran', () => {
  const progress = readingJourneyProgress(
    journey,
    [
      ...history,
      { ...history[0]!, id: 'old', dateKey: '2026-10-31' },
      { ...history[0]!, id: 'memory', action: 'memorized' },
    ],
    '2026-11-13',
  );
  assert.ok(Math.abs(progress.remainingPages - 404) < 1e-9);
  assert.equal(
    readingJourneyProgress(
      journey,
      Array.from({ length: 4 }, (_, index) => ({ ...history[0]!, id: String(index) })),
      '2026-11-13',
    ).fraction,
    1,
  );
});
test('journey dialog supports daily pages and inclusive finish date quantities', () => {
  assert.equal(journeyDialogTarget(404, '20', null, '2026-11-13'), 20);
  assert.equal(journeyDialogTarget(404, '', '2026-12-02', '2026-11-13'), 21);
  assert.equal(journeyDialogTarget(404, '', '2026-11-12', '2026-11-13'), null);
});
test('journey and goal save atomically and retain the original journey start', () => {
  const state = { ...initialState, readingJourney: journey };
  const next = appReducer(state, {
    type: 'readingJourney/save',
    journey: { ...journey, startDate: '2026-11-13' },
    goal,
    date: '2026-11-13',
  });
  assert.equal(next.readingJourney.startDate, '2026-11-01');
  assert.equal(next.goal.unit, 'pages');
  assert.equal(next.goal.target, 20);
  assert.throws(() =>
    appReducer(state, {
      type: 'readingJourney/save',
      journey: { ...journey, enabled: false },
      goal: { ...goal, target: 10001 },
      date: '2026-11-13',
    }),
  );
  assert.equal(state.readingJourney.enabled, true);
  assert.equal(state.goal.target, initialState.goal.target);
});
test('old RN state upgrades to a disabled default without losing its scheduled itineraries', () => {
  const old = { ...initialState } as Partial<typeof initialState>;
  delete old.readingJourney;
  const decoded = decodeState(JSON.stringify(old));
  assert.deepEqual(decoded.readingJourney, defaultReadingJourney);
  assert.deepEqual(decoded.journeys, initialState.journeys);
});
