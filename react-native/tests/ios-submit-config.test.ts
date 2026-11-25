import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const original = {
  build: { production: { autoIncrement: true } },
  submit: {
    production: {
      android: { track: 'internal', releaseStatus: 'draft' },
      ios: { appleTeamId: 'EXAMPLE' },
    },
  },
};

function prepare(appId?: string) {
  const root = mkdtempSync(join(tmpdir(), 'wirdna-ios-submit-'));
  try {
    mkdirSync(join(root, 'scripts'));
    copyFileSync('scripts/prepare-ios-submit.mjs', join(root, 'scripts', 'prepare-ios-submit.mjs'));
    const before = JSON.stringify(original);
    writeFileSync(join(root, 'eas.json'), before);
    const env = { ...process.env };
    delete env.ASC_APP_ID;
    if (appId !== undefined) env.ASC_APP_ID = appId;
    const result = spawnSync(process.execPath, ['scripts/prepare-ios-submit.mjs'], {
      cwd: root,
      env,
      encoding: 'utf8',
    });
    assert.ifError(result.error);
    return {
      status: result.status,
      output: result.stdout + result.stderr,
      before,
      after: readFileSync(join(root, 'eas.json'), 'utf8'),
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('missing App Store Connect destination fails before changing the submit profile', () => {
  const result = prepare();
  assert.notEqual(result.status, 0);
  assert.equal(result.after, result.before);
  assert.match(result.output, /ASC_APP_ID/);
});

test('a bundle ID cannot be mistaken for the numeric App Store Connect app ID', () => {
  const result = prepare('com.Ameender.qurantracker');
  assert.notEqual(result.status, 0);
  assert.equal(result.after, result.before);
});

test('explicit iOS app destination preserves Android, Apple team and build configuration', () => {
  const appId = '1234567890';
  const result = prepare(appId);
  assert.equal(result.status, 0, result.output);
  assert.deepEqual(JSON.parse(result.after), {
    ...original,
    submit: {
      production: {
        ...original.submit.production,
        ios: { ...original.submit.production.ios, ascAppId: appId },
      },
    },
  });
  assert.ok(!result.output.includes(appId));
});
