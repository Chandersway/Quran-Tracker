import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { Linter } from 'eslint';
import { architecturePlugin } from '../scripts/eslint-architecture.mjs';

function lint(file: string, source: string) {
  return new Linter().verify(
    source,
    {
      plugins: { architecture: architecturePlugin },
      rules: { 'architecture/dependencies': 'error' },
    },
    { filename: path.resolve(file) },
  );
}

test('architecture rejects UI dependencies in rules, services and shared components', () => {
  for (const [file, dependency] of [
    ['src/domain/reading.js', '../features/quran/components/Reader'],
    ['src/domain/reading.js', 'react-native'],
    ['src/domain/reading.js', '../state/store'],
    ['src/services/auth/signIn.js', '../../features/account/screens/AccountScreen'],
    ['src/shared/components/Button.js', '../../features/home/screens/MainScreen'],
    ['src/features/home/screens/MainScreen.js', '../../practice/screens/StatsScreen'],
    ['src/features/account/screens/AccountScreen.js', '@supabase/supabase-js'],
    ['src/migration/room.js', '../features/onboarding/components/OnboardingFlow'],
  ]) {
    const messages = lint(file!, `import value from '${dependency}';`);
    assert.equal(messages.length, 1, `${file} -> ${dependency}`);
    assert.equal(messages[0]?.ruleId, 'architecture/dependencies');
  }
});

test('architecture checks exports, require and dynamic imports without banning valid composition', () => {
  for (const source of [
    "export * from '../features/quran/components/Reader';",
    "const reader = require('../features/quran/components/Reader');",
    "const reader = import('../features/quran/components/Reader');",
  ])
    assert.equal(lint('src/domain/reading.js', source).length, 1);
  for (const [file, dependency] of [
    ['src/app/navigation/AppNavigator.js', '../../features/home/screens/MainScreen'],
    [
      'src/features/home/screens/MainScreen.js',
      '../../practice/components/ReadingStatisticsOverview',
    ],
    ['src/features/quran/screens/ReaderScreen.js', '../../../domain/bookPresentation'],
    ['src/domain/reading.js', '../state/models'],
    ['src/domain/reading.js', '../content/quran'],
    ['src/shared/theme/index.js', '../../state/store'],
    ['src/services/backend/backend.js', '@supabase/supabase-js'],
  ])
    assert.deepEqual(lint(file!, `import value from '${dependency}';`), []);
});
