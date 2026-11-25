import assert from 'node:assert/strict';

/** Accept the checkout's prepared project, while retaining the fixed loopback boundary. */
export function assertLocalQaScope(metadata, config) {
  assert.match(metadata.projectId, /^[a-z0-9-]+$/, 'Invalid isolated QA project ID');
  assert.equal(metadata.apiOrigin, 'http://127.0.0.1:55431', 'Refused non-local QA origin');
  const configuredId = /^project_id\s*=\s*"([a-z0-9-]+)"/m.exec(config)?.[1];
  assert.equal(metadata.projectId, configuredId, 'QA metadata and local config disagree');
}
