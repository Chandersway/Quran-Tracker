import assert from 'node:assert/strict';
import { generateKeyPairSync, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from '../../react-native/node_modules/typescript';
import * as apns from '../functions/group-push/apns-contract';

// Ephemeral test-only material, never written to disk or sent to a provider.
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

test('the real FCM worker sends the post kind after authorization and respects blocked, invalid and retry cases', async () => {
  for (const scenario of ['sent', 'muted', 'retry', 'invalid-kind', 'unauthorized'] as const) {
    const calls: string[] = [];
    const providerMessages: Array<Record<string, unknown>> = [];
    const outcomes: string[] = [];
    let handler: (request: Request) => Promise<Response>;
    const env: Record<string, string> = {
      SUPABASE_URL: 'http://127.0.0.1:55431', SUPABASE_SERVICE_ROLE_KEY: 'local-test-only',
      FCM_PROJECT_ID: 'local-test-project',
      FCM_SERVICE_ACCOUNT_JSON: JSON.stringify({ project_id: 'local-test-project', client_email: 'test@example.invalid', private_key: privateKey }),
    };
    const fetchMock = async (input: string, options?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('http://127.0.0.1:55431/rest/v1/rpc/')) {
        const name = url.split('/').at(-1)!;
        calls.push(name);
        if (name === 'verify_group_push_dispatcher_v1') return Response.json(scenario !== 'unauthorized');
        if (name === 'claim_group_push_v3') return Response.json([{ delivery_id: 'delivery', claim: 'claim', kind: scenario === 'invalid-kind' ? 'unsupported' : 'group_post', event_id: 'event', recipient: 'recipient', token: 'device-test-token', platform: 'android', language: 'nl' }]);
        if (name === 'group_push_claim_allowed_v1') return Response.json(scenario !== 'muted');
        if (name === 'finish_group_push_v1') {
          outcomes.push(JSON.parse(String(options?.body)).p_result);
          return Response.json(null);
        }
      }
      if (url === 'https://oauth2.googleapis.com/token') {
        calls.push('oauth-mock');
        assert.equal(options?.method, 'POST');
        return Response.json({ access_token: 'test-only-access-token', expires_in: 3600 });
      }
      if (url === 'https://fcm.googleapis.com/v1/projects/local-test-project/messages:send') {
        calls.push('fcm-mock');
        assert.equal(options?.method, 'POST');
        const message = JSON.parse(String(options?.body)).message;
        providerMessages.push(message);
        return Response.json({}, { status: scenario === 'retry' ? 429 : 200 });
      }
      throw new Error('Unrecognized request; network is forbidden in this test');
    };
    const code = ts.transpileModule(readFileSync(new URL('../functions/group-push/index.ts', import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
      exports: {}, require: (name: string) => { assert.equal(name, './apns-contract.ts'); return apns; },
      Deno: { env: { get: (key: string) => env[key] }, serve: (callback: typeof handler) => { handler = callback; } },
      crypto: webcrypto, fetch: fetchMock, Request, Response, URLSearchParams, TextEncoder, Uint8Array, AbortSignal, btoa, atob,
      console: { warn: () => undefined, error: () => undefined },
    });
    const response = await handler!(new Request('http://127.0.0.1/local-test', { method: 'POST', headers: { Authorization: `Bearer ${'x'.repeat(40)}` } }));
    assert.equal(response.status, scenario === 'unauthorized' ? 401 : 200);
    const shouldSend = scenario === 'sent' || scenario === 'retry';
    assert.equal(providerMessages.length, shouldSend ? 1 : 0);
    if (shouldSend) {
      const message = providerMessages[0]!;
      assert.deepEqual(message.data, { kind: 'group_post', event_id: 'event', recipient: 'recipient' });
      assert.equal('notification' in message, false, 'authorization must precede local display');
      assert.deepEqual(message.android, { priority: 'HIGH', ttl: '86400s' });
    } else assert.equal(calls.includes('oauth-mock'), false);
    assert.deepEqual(outcomes, scenario === 'unauthorized' ? [] : [scenario === 'sent' ? 'sent' : scenario === 'retry' ? 'retry' : 'failed']);
  }
});
