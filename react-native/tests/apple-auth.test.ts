import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthService } from '../src/services/auth/auth';
import {
  createAppleOAuth,
  type AppleNativePort,
  type AppleOAuth,
} from '../src/services/auth/appleIdentity';
import { appleOAuth as unavailableApple } from '../src/services/auth/appleOAuth';
import { initializeProviderName } from '../src/services/profiles/initializeProviderName';

function nativeFixture() {
  const requests: Array<{ nonce: string; state: string }> = [];
  const challenges: string[] = [];
  let counter = 0;
  let request: AppleNativePort['request'] = async ({ state }) => ({
    state,
    identityToken: 'signed-apple-id-token',
    fullName: '  Amina Reader  ',
  });
  const port: AppleNativePort = {
    isAvailable: async () => true,
    randomValues: (bytes) => {
      bytes.fill(++counter);
      return bytes;
    },
    sha256: async (value) => {
      challenges.push(value);
      return createHash('sha256').update(value).digest('hex');
    },
    request: async (input) => {
      requests.push(input);
      return request(input);
    },
  };
  return {
    port,
    apple: createAppleOAuth(port),
    requests,
    challenges,
    setRequest: (value: AppleNativePort['request']) => {
      request = value;
    },
  };
}

function authFixture(apple: AppleOAuth) {
  const calls: unknown[] = [];
  const user = {
    id: 'apple-reader',
    email: 'relay@privaterelay.appleid.com',
    app_metadata: { provider: 'apple' },
    user_metadata: { display_name: 'Existing name' },
  };
  const session = { user, access_token: 'private-access', refresh_token: 'private-refresh' };
  let result: unknown = { data: { user, session }, error: null };
  let currentAccount: string | null = null;
  const client = {
    auth: {
      getSession: async () => ({
        data: { session: currentAccount ? { user: { id: currentAccount } } : null },
        error: null,
      }),
      signInWithIdToken: async (input: unknown) => {
        calls.push(input);
        return result;
      },
      updateUser: async () => {
        throw new Error('Apple must not overwrite auth metadata');
      },
    },
  } as unknown as SupabaseClient;
  return {
    auth: createAuthService(
      client,
      'https://backend.test',
      async () => undefined,
      undefined,
      apple,
    ),
    calls,
    user,
    session,
    setResult: (next: unknown) => {
      result = next;
    },
    setAccount: (id: string | null) => {
      currentAccount = id;
    },
  };
}

test('another account signing in while the native Apple prompt is open prevents the token exchange', async () => {
  const f = nativeFixture();
  const auth = authFixture(f.apple);
  f.setRequest(async ({ state }) => {
    auth.setAccount('another-account');
    return { state, identityToken: 'token', fullName: null };
  });
  await assert.rejects(auth.auth.signInWithApple(), /Account identity changed/);
  assert.deepEqual(auth.calls, []);
});

test('Apple hashes a fresh 256-bit nonce for native authorization and passes the raw nonce only to Supabase', async () => {
  const f = nativeFixture();
  const auth = authFixture(f.apple);
  const result = await auth.auth.signInWithApple();
  const rawNonce = f.challenges[0]!;
  assert.match(rawNonce, /^[a-f\d]{64}$/);
  assert.equal(f.requests[0]!.nonce, createHash('sha256').update(rawNonce).digest('hex'));
  assert.notEqual(f.requests[0]!.state, rawNonce);
  assert.deepEqual(auth.calls, [
    { provider: 'apple', token: 'signed-apple-id-token', nonce: rawNonce },
  ]);
  assert.deepEqual(result, {
    user: {
      id: 'apple-reader',
      email: 'relay@privaterelay.appleid.com',
      provider: 'apple',
      appleLinked: true,
      displayName: 'Existing name',
      avatarUrl: null,
    },
    firstSignInName: 'Amina Reader',
  });
  assert.doesNotMatch(
    JSON.stringify(result),
    /private-access|private-refresh|signed-apple-id-token|nonce/,
  );
  await auth.auth.signInWithApple();
  assert.notEqual(f.challenges[0], f.challenges[1]);
  assert.notEqual(f.requests[0]!.state, f.requests[1]!.state);
});

test('Apple cancellation is neutral and a later retry gets a new challenge', async () => {
  const f = nativeFixture();
  const auth = authFixture(f.apple);
  f.setRequest(async () => {
    throw { code: 'ERR_REQUEST_CANCELED' };
  });
  assert.equal(await auth.auth.signInWithApple(), null);
  assert.deepEqual(auth.calls, []);
  f.setRequest(async ({ state }) => ({ state, identityToken: 'retry-token', fullName: null }));
  assert.equal((await auth.auth.signInWithApple())!.firstSignInName, null);
  assert.notEqual(f.challenges[0], f.challenges[1]);
});

test('Apple state mismatch and missing tokens fail closed before Supabase receives anything', async () => {
  const f = nativeFixture();
  const auth = authFixture(f.apple);
  f.setRequest(async () => ({ state: 'wrong-state', identityToken: 'token', fullName: null }));
  await assert.rejects(auth.auth.signInWithApple(), /APPLE_STATE_MISMATCH/);
  f.setRequest(async ({ state }) => ({ state, identityToken: null, fullName: null }));
  await assert.rejects(auth.auth.signInWithApple(), /APPLE_ID_TOKEN_MISSING/);
  assert.deepEqual(auth.calls, []);
});

test('unsupported platforms, unavailable devices and crypto errors never open native authorization', async () => {
  assert.equal(await unavailableApple.isAvailable(), false);
  await assert.rejects(unavailableApple.signIn(), /APPLE_SIGN_IN_UNAVAILABLE/);
  const f = nativeFixture();
  f.port.isAvailable = async () => false;
  await assert.rejects(f.apple.signIn(), /APPLE_SIGN_IN_UNAVAILABLE/);
  f.port.isAvailable = async () => true;
  f.port.randomValues = () => {
    throw new Error('native crypto unavailable');
  };
  await assert.rejects(f.apple.signIn(), /native crypto unavailable/);
  f.port.randomValues = (bytes) => bytes.fill(1);
  f.port.sha256 = async () => 'not-sha256';
  await assert.rejects(f.apple.signIn(), /APPLE_NONCE_HASH_INVALID/);
  assert.deepEqual(f.requests, []);
});

test('the entire native prompt and backend exchange reject duplicate taps', async () => {
  const f = nativeFixture();
  let resolve!: (value: Awaited<ReturnType<AppleNativePort['request']>>) => void;
  f.setRequest(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const auth = authFixture(f.apple);
  const first = auth.auth.signInWithApple();
  await new Promise((done) => setImmediate(done));
  await assert.rejects(auth.auth.signInWithApple(), /APPLE_SIGN_IN_BUSY/);
  await assert.rejects(f.apple.signIn(), /APPLE_SIGN_IN_BUSY/);
  resolve({ state: f.requests[0]!.state, identityToken: 'token', fullName: null });
  await first;
  assert.equal(auth.calls.length, 1);
});

test('backend errors and incomplete Apple sessions remain failures and permit retry', async () => {
  const f = nativeFixture();
  const auth = authFixture(f.apple);
  auth.setResult({ data: { user: null, session: null }, error: new Error('provider disabled') });
  await assert.rejects(auth.auth.signInWithApple(), /provider disabled/);
  auth.setResult({ data: { user: auth.user, session: null }, error: null });
  await assert.rejects(auth.auth.signInWithApple(), /returned no session/);
  auth.setResult({
    data: { user: auth.user, session: { user: { id: 'someone-else' } } },
    error: null,
  });
  await assert.rejects(auth.auth.signInWithApple(), /returned no session/);
  auth.setResult({ data: { user: auth.user, session: auth.session }, error: null });
  assert.equal((await auth.auth.signInWithApple())!.user.id, auth.user.id);
});

test('the installed native adapter uses secure getRandomValues, full-name/email scopes and forwards the hash unchanged', async () => {
  const inputs: Array<Record<string, unknown>> = [];
  const randomSizes: number[] = [];
  const modules = {
    './appleIdentity': { createAppleOAuth },
    'expo-crypto': {
      CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
      CryptoEncoding: { HEX: 'hex' },
      getRandomValues: (bytes: Uint8Array) => {
        randomSizes.push(bytes.length);
        return bytes.fill(randomSizes.length);
      },
      digestStringAsync: async (
        algorithm: string,
        value: string,
        options: { encoding: string },
      ) => {
        assert.equal(algorithm, 'SHA-256');
        assert.equal(options.encoding, 'hex');
        return createHash('sha256').update(value).digest('hex');
      },
    },
    'expo-apple-authentication': {
      isAvailableAsync: async () => true,
      AppleAuthenticationScope: { FULL_NAME: 'FULL_NAME', EMAIL: 'EMAIL' },
      signInAsync: async (input: Record<string, unknown>) => {
        inputs.push(input);
        return { state: input.state, identityToken: 'id-token', fullName: { givenName: 'Amina' } };
      },
      formatFullName: (name: { givenName: string }) => name.givenName,
    },
  };
  const output = ts.transpileModule(
    readFileSync(new URL('../src/services/auth/appleOAuth.ios.ts', import.meta.url), 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText;
  const exports = {} as { appleOAuth: AppleOAuth };
  vm.runInNewContext(output, { exports, require: (name: keyof typeof modules) => modules[name] });
  const credential = await exports.appleOAuth.signIn();
  assert.deepEqual(randomSizes, [32, 32]);
  assert.deepEqual(Array.from(inputs[0]!.requestedScopes as string[]), ['FULL_NAME', 'EMAIL']);
  assert.equal(inputs[0]!.nonce, createHash('sha256').update(credential!.nonce).digest('hex'));
  assert.equal(credential!.firstSignInName, 'Amina');
});

function profileFixture(initial: string | null | undefined) {
  let name = initial;
  let actor = 'reader';
  let readError = false;
  let concurrentName: string | undefined;
  const writes: Array<{ patch: Record<string, unknown>; options?: Record<string, unknown> }> = [];
  function query() {
    let operation = 'read';
    let value: Record<string, unknown> = {};
    let expected: unknown;
    const chain = {
      select: () => chain,
      eq: (column: string, match: unknown) => {
        if (column === 'display_name') expected = match;
        return chain;
      },
      is: (_column: string, match: unknown) => {
        expected = match;
        return chain;
      },
      update: (patch: Record<string, unknown>) => {
        operation = 'update';
        value = patch;
        writes.push({ patch });
        return chain;
      },
      upsert: (patch: Record<string, unknown>, options: Record<string, unknown>) => {
        operation = 'insert';
        value = patch;
        writes.push({ patch, options });
        return chain;
      },
      maybeSingle: async () => {
        if (operation === 'read')
          return {
            data: name === undefined ? null : { display_name: name },
            error: readError ? { message: 'offline' } : null,
          };
        if (concurrentName !== undefined) name = concurrentName;
        if (
          (operation === 'insert' && name !== undefined) ||
          (operation === 'update' && name !== expected)
        )
          return { data: null, error: null };
        name = value.display_name as string;
        return { data: { display_name: name }, error: null };
      },
    };
    return chain;
  }
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: actor } }, error: null }) },
    from: query,
  } as unknown as SupabaseClient;
  return {
    client,
    writes,
    name: () => name,
    actor: (value: string) => {
      actor = value;
    },
    failRead: () => {
      readError = true;
    },
    concurrent: (value: string) => {
      concurrentName = value;
    },
  };
}

test('one-time Apple names only initialize missing or blank profiles and never touch avatars', async () => {
  for (const initial of [undefined, null, '', '   ']) {
    const f = profileFixture(initial);
    assert.equal(await initializeProviderName(f.client, 'reader', '  Amina  '), 'Amina');
    assert.equal(f.name(), 'Amina');
    assert.equal(f.writes.length, 1);
    assert.deepEqual(
      Object.keys(f.writes[0]!.patch).sort(),
      initial === undefined ? ['display_name', 'id'] : ['display_name'],
    );
    if (initial === undefined)
      assert.deepEqual(f.writes[0]!.options, { onConflict: 'id', ignoreDuplicates: true });
  }
});

test('custom names, unknown remote state and mismatched accounts prevent optional profile writes', async () => {
  const custom = profileFixture('My chosen name');
  assert.equal(await initializeProviderName(custom.client, 'reader', 'Apple name'), null);
  assert.equal(custom.writes.length, 0);
  const offline = profileFixture('');
  offline.failRead();
  assert.equal(await initializeProviderName(offline.client, 'reader', 'Apple name'), null);
  assert.equal(offline.writes.length, 0);
  const switched = profileFixture('');
  switched.actor('other-reader');
  assert.equal(await initializeProviderName(switched.client, 'reader', 'Apple name'), null);
  assert.equal(switched.writes.length, 0);
});

test('a custom profile edit racing a first Apple name wins both insertion and update', async () => {
  for (const initial of [undefined, null, '', '   ']) {
    const f = profileFixture(initial);
    f.concurrent('New custom name');
    assert.equal(await initializeProviderName(f.client, 'reader', 'Apple name'), null);
    assert.equal(f.name(), 'New custom name');
  }
});
