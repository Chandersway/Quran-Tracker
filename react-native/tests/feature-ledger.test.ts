import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

type Evidence = { path: string; line: number; symbol: string };
type Feature = { id: string; status: string; reactNativeEvidence: Evidence[] };
const inventory = JSON.parse(readFileSync('docs/kotlin-feature-inventory.json', 'utf8')) as {
  schemaVersion: number;
  sourceFileCount: number;
  features: Feature[];
  f26Corrections: {
    id: string;
    implementationStatus: string;
    nativeAcceptanceStatus: string;
    reactNativeEvidence: Evidence[];
    testPaths: string[];
  }[];
  files: { path: string; sha256: string }[];
};

function currentEvidence(evidence: Evidence) {
  assert.equal(existsSync(evidence.path), true, evidence.path);
  const line = readFileSync(evidence.path, 'utf8').split(/\r?\n/)[evidence.line - 1];
  assert.ok(
    line?.includes(evidence.symbol),
    `Stale ledger anchor: ${evidence.path}:${evidence.line} (${evidence.symbol}); regenerate the inventory.`,
  );
}

test('feature inventory resolves current file/symbol anchors and retains all original Kotlin hashes', () => {
  assert.equal(inventory.schemaVersion, 2);
  assert.equal(inventory.sourceFileCount, 198);
  assert.equal(inventory.files.length, 198);
  assert.equal(inventory.features.length, 56);
  for (const feature of inventory.features) {
    assert.ok(feature.reactNativeEvidence.length, feature.id);
    feature.reactNativeEvidence.forEach(currentEvidence);
  }
  for (const file of inventory.files) {
    const source = readFileSync(path.resolve('..', file.path), 'utf8').replace(/\r\n?/g, '\n');
    assert.equal(createHash('sha256').update(source).digest('hex'), file.sha256, file.path);
  }
});

test('K01-K10 source implementations are distinct from native acceptance and pending work cannot disappear', () => {
  assert.deepEqual(
    inventory.f26Corrections.map((change) => change.id),
    Array.from({ length: 10 }, (_, index) => `K${String(index + 1).padStart(2, '0')}`),
  );
  for (const correction of inventory.f26Corrections) {
    assert.equal(correction.implementationStatus, 'implemented');
    assert.equal(correction.nativeAcceptanceStatus, 'pending-final-root-record');
    correction.reactNativeEvidence.forEach(currentEvidence);
    assert.ok(correction.testPaths.length);
    for (const file of correction.testPaths) assert.equal(existsSync(file), true, file);
  }
  const priorities = JSON.parse(
    readFileSync('docs/feature-gap-priorities.json', 'utf8'),
  ) as (Feature & { workKind: string })[];
  const pending = inventory.features.filter((feature) => feature.status !== 'implemented');
  assert.deepEqual(
    priorities.map((feature) => feature.id),
    pending.map((feature) => feature.id),
  );
  assert.ok(
    priorities.every(
      (feature) =>
        feature.workKind ===
        (feature.status === 'missing' ? 'implementation-gap' : 'acceptance-or-semantic-review'),
    ),
  );
});
