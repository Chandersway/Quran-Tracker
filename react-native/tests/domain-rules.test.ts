import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hizbProgressId,
  juzProgressId,
  noteTargetIncludes,
  rubProgressId,
  surahProgressId,
  validateNoteTarget,
} from '../src/domain/quran';
import { deriveDailyGoalFromJourney, goalAction, goalDayProgress } from '../src/domain/planning';
import {
  nextRepeatStep,
  repeatAyahUrl,
  repeatReciterOptions,
  validateRepeatTimings,
  validRepeatPageRange,
} from '../src/domain/repeat';

test('persisted Quran progress IDs remain stable', () => {
  assert.deepEqual(
    [juzProgressId(2), hizbProgressId(7), rubProgressId(4, 3), surahProgressId(18)],
    ['juz_2', 'hizb_7', 'rub_4_3', 'surah_18'],
  );
});

test('Quran note target ranges and parent-child rules match Android', () => {
  validateNoteTarget({ scope: 'ayah', number: 2, ayah: 286 });
  assert.throws(() => validateNoteTarget({ scope: 'ayah', number: 2, ayah: 287 }));
  assert.throws(() => validateNoteTarget({ scope: 'rub', number: 241 }));
  assert.equal(noteTargetIncludes({ scope: 'juz', number: 1 }, { scope: 'rub', number: 8 }), true);
  assert.equal(
    noteTargetIncludes({ scope: 'hizb', number: 4 }, { scope: 'rub', number: 16 }),
    true,
  );
  assert.equal(
    noteTargetIncludes({ scope: 'surah', number: 2 }, { scope: 'ayah', number: 2, ayah: 255 }),
    true,
  );
});

test('journey goal unit selection and goal progress are preserved', () => {
  assert.deepEqual(deriveDailyGoalFromJourney(30), ['juz', 1]);
  assert.deepEqual(deriveDailyGoalFromJourney(60), ['hizb', 1]);
  assert.deepEqual(deriveDailyGoalFromJourney(100), ['rub', 3]);
  assert.deepEqual(deriveDailyGoalFromJourney(0), ['juz', 30]);
  assert.equal(goalAction(2), 'memorized');
  assert.equal(goalAction(3), 'review');
  assert.deepEqual(
    goalDayProgress({ goalId: 1, date: '2025-01-01', unit: 'rub', target: 4, extra: 1 }, 8),
    { target: 5, done: 8, remaining: 0, fraction: 1 },
  );
});

test('repeat range, finite and continuous sequence, timing validation and reciter URL semantics', () => {
  assert.equal(validRepeatPageRange('1', '604'), true);
  assert.equal(validRepeatPageRange('12', '10'), false);
  assert.deepEqual(nextRepeatStep(2, 1, 3, 2), [0, 2]);
  assert.equal(nextRepeatStep(2, 2, 3, 2), null);
  assert.deepEqual(nextRepeatStep(4, 100, 5, 0), [0, 101]);
  const timings = [
    { ayah: 1, start: 0, end: 100 },
    { ayah: 2, start: 100, end: 200 },
  ];
  assert.deepEqual(validateRepeatTimings(timings, 2), timings);
  assert.throws(() =>
    validateRepeatTimings(
      [
        { ayah: 1, start: 0, end: 100 },
        { ayah: 3, start: 100, end: 200 },
      ],
      2,
    ),
  );
  const hafs = repeatReciterOptions(false).find(({ id }) => id === 'husary')!;
  const teacher = repeatReciterOptions(false).find(({ id }) => id === 'husary_teacher')!;
  const warshCdn = repeatReciterOptions(true).find(({ id }) => id === 'husary_warsh')!;
  assert.equal(repeatAyahUrl(hafs, 2, 282), 'https://everyayah.com/data/Husary_128kbps/002282.mp3');
  assert.equal(
    repeatAyahUrl(teacher, 1, 1),
    'https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3',
  );
  assert.equal(
    repeatAyahUrl(warshCdn, 114, 6),
    'https://cdn.mp3quran.net/audio/mahmoud-husary/r3/114006.mp3',
  );
});
