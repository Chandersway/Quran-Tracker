import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {
  createGroupTypingService,
  type GroupTypingPort,
  type GroupTypingSignal,
  type GroupTypingService,
} from '../src/services/groups/groupTyping';
import { GroupTypingController } from '../src/services/groups/groupTypingController';
import { groupTypingCopy, groupTypingText } from '../src/features/groups/groupTypingCopy';

const settle = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};
function fixture() {
  let now = 10_000;
  let timer: (() => void) | undefined;
  const connections: Array<{
    signal(value: GroupTypingSignal): void;
    ready(value: boolean): void;
    closed: boolean;
  }> = [];
  const writes: boolean[] = [];
  const service: GroupTypingService = {
    connectTyping(_code, _actor, signal, ready) {
      const connection = { signal, ready, closed: false };
      connections.push(connection);
      return {
        publish: async (value) => {
          writes.push(value);
        },
        close: () => {
          connection.closed = true;
        },
      };
    },
  };
  const clock = {
    now: () => now,
    every: (callback: () => void) => {
      timer = callback;
      return () => {
        timer = undefined;
      };
    },
  };
  const controller = new GroupTypingController(service, 'ONE', 'me', true, clock);
  return {
    controller,
    service,
    connections,
    writes,
    advance(ms: number) {
      now += ms;
      timer?.();
    },
    start() {
      controller.start();
      connections.at(-1)!.ready(true);
    },
    signal(userId: string, typing = true, expiresAt = now + 8_000) {
      connections.at(-1)!.signal({
        userId,
        displayName: userId === 'other' ? 'Continue' : userId,
        typing,
        expiresAt,
      });
    },
  };
}

test('typing requires actual focused input, coalesces letters and stops after idle, clear or capability loss', () => {
  const f = fixture();
  f.start();
  f.controller.activity(true);
  f.controller.focus();
  f.controller.activity(false);
  assert.deepEqual(f.writes, []);
  for (let i = 0; i < 100; i++) f.controller.activity(true);
  assert.deepEqual(f.writes, [true]);
  for (let i = 0; i < 3; i++) {
    f.advance(1_000);
    f.controller.activity(true);
  }
  assert.deepEqual(f.writes, [true, true]);
  f.advance(2_000);
  assert.deepEqual(f.writes, [true, true, false]);
  f.advance(20_000);
  assert.equal(f.writes.length, 3, 'no idle heartbeat');
  f.controller.activity(true);
  f.controller.activity(false);
  assert.deepEqual(f.writes.slice(-2), [true, false]);
  f.controller.activity(true);
  f.controller.setCanSend(false);
  f.controller.activity(true);
  assert.deepEqual(f.writes.slice(-2), [true, false]);
  f.controller.stop();
});

test('own actor, stale starts and expired signals stay hidden; remote activity expires and does not become online state', () => {
  const f = fixture();
  f.start();
  f.signal('me');
  f.signal('expired', true, 9_999);
  f.signal('future', true, 40_000);
  assert.deepEqual(f.controller.snapshot(), []);
  f.signal('other');
  f.signal('other');
  assert.deepEqual(f.controller.snapshot(), [{ userId: 'other', displayName: 'Continue' }]);
  f.signal('other', false, 18_001);
  f.signal('other', true, 18_000);
  assert.deepEqual(f.controller.snapshot(), []);
  f.signal('second');
  f.advance(8_000);
  assert.deepEqual(f.controller.snapshot(), []);
  f.controller.stop();
});

test('blur/send cleanup and route or account disposal reject late callbacks from the old connection', () => {
  const f = fixture();
  f.start();
  f.controller.focus();
  f.controller.activity(true);
  f.signal('other');
  f.controller.blur();
  assert.equal(f.writes.at(-1), false);
  f.controller.focus();
  f.controller.activity(true);
  f.controller.clear();
  assert.equal(f.writes.at(-1), false);
  const old = f.connections[0]!;
  f.controller.stop();
  assert.equal(old.closed, true);
  old.signal({ userId: 'old', displayName: 'Hidden', typing: true, expiresAt: 18_000 });
  assert.deepEqual(f.controller.snapshot(), []);
  f.start();
  old.ready(true);
  old.signal({ userId: 'old', displayName: 'Hidden', typing: true, expiresAt: 18_000 });
  assert.deepEqual(f.controller.snapshot(), []);
  f.controller.stop();
});

function portFixture() {
  let payload: ((value: unknown) => void) | undefined;
  let ready: ((value: boolean) => void) | undefined;
  let authClose: (() => void) | undefined;
  let closed = 0;
  const calls: unknown[][] = [];
  const port: GroupTypingPort = {
    resolve: async () => ({
      groupId: 'group',
      topic: 'private',
      members: [{ userId: 'other', displayName: 'Continue' }],
    }),
    open(topic, actor, onPayload, onReady) {
      calls.push(['open', topic, actor]);
      payload = onPayload;
      ready = onReady;
      return () => {
        closed++;
      };
    },
    publish: async (...args) => {
      calls.push(['publish', ...args]);
    },
    onActorChange: (_id, close) => {
      authClose = close;
      return () => {
        calls.push(['auth-cleanup']);
      };
    },
  };
  return {
    port,
    calls,
    payload: (value: unknown) => payload?.(value),
    ready: (value = true) => ready?.(value),
    auth: () => authClose?.(),
    closed: () => closed,
  };
}

test('transport accepts only known other actors and literal roster names, closes on account change and never sends text', async () => {
  const f = portFixture();
  const seen: GroupTypingSignal[] = [];
  const connection = createGroupTypingService(f.port).connectTyping(
    'ONE',
    'me',
    (value) => seen.push(value),
    () => {},
  );
  await settle();
  f.ready();
  for (const user_id of ['other', 'me', 'unknown'])
    f.payload({
      user_id,
      typing: true,
      expires_at: new Date(18_000).toISOString(),
      display_name: 'Forged',
    });
  assert.deepEqual(
    seen.map((value) => value.displayName),
    ['Continue'],
  );
  await connection.publish(true);
  assert.deepEqual(
    f.calls.find((row) => row[0] === 'publish'),
    ['publish', 'group', 'me', true],
  );
  f.auth();
  await settle();
  assert.equal(f.closed(), 1);
  f.payload({ user_id: 'other', typing: true, expires_at: new Date(18_001).toISOString() });
  assert.equal(seen.length, 1);
  connection.close();
});

test('slow or failed start RPC keeps at most one pending state and still sends the final stop in order', async () => {
  const f = portFixture();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const values: boolean[] = [];
  f.port.publish = async (_group, _actor, value) => {
    values.push(value);
    if (values.length === 1) {
      await gate;
      throw new Error('Ambiguous network acknowledgement');
    }
  };
  const connection = createGroupTypingService(f.port).connectTyping(
    'ONE',
    'me',
    () => {},
    () => {},
  );
  await settle();
  f.ready();
  const start = connection.publish(true);
  for (let i = 0; i < 20; i++) void connection.publish(true).catch(() => {});
  const stop = connection.publish(false);
  connection.close();
  release();
  await Promise.allSettled([start, stop]);
  assert.deepEqual(values, [true, false]);
});

test('missing private backend support and a disposed pending resolve never open a public or stale channel', async () => {
  const f = portFixture();
  f.port.resolve = async () => {
    throw new Error('RPC not installed');
  };
  const c = createGroupTypingService(f.port).connectTyping(
    'ONE',
    'me',
    () => {},
    () => {},
  );
  await settle();
  assert.equal(
    f.calls.some((row) => row[0] === 'open'),
    false,
  );
  c.close();
  let resolve!: (value: Awaited<ReturnType<GroupTypingPort['resolve']>>) => void;
  f.port.resolve = () =>
    new Promise((done) => {
      resolve = done;
    });
  const late = createGroupTypingService(f.port).connectTyping(
    'TWO',
    'me',
    () => {},
    () => {},
  );
  late.close();
  resolve({ groupId: 'group', topic: 'private', members: [] });
  await settle();
  assert.equal(
    f.calls.some((row) => row[0] === 'open'),
    false,
  );
});

test('disconnect then close drops queued starts and preserves the pinned stop behind an in-flight request', async () => {
  const f = portFixture();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const values: boolean[] = [];
  f.port.publish = async (_group, _actor, value) => {
    values.push(value);
    if (values.length === 1) await gate;
  };
  const c = createGroupTypingService(f.port).connectTyping(
    'ONE',
    'me',
    () => {},
    () => {},
  );
  await settle();
  f.ready();
  const pending = c.publish(true);
  void c.publish(true).catch(() => {});
  f.ready(false);
  c.close();
  release();
  await pending;
  assert.deepEqual(values, [true, false], 'no new true RPC after disconnect/disposal');
});

test('server-clock skew is normalized for UI expiry while original server order remains authoritative', async () => {
  const f = portFixture();
  f.port.resolve = async () => ({
    groupId: 'group',
    topic: 'private',
    clockOffsetMs: 90_000,
    members: [{ userId: 'other', displayName: 'Continue' }],
  });
  const seen: GroupTypingSignal[] = [];
  const c = createGroupTypingService(f.port).connectTyping(
    'ONE',
    'me',
    (value) => seen.push(value),
    () => {},
  );
  await settle();
  f.ready();
  f.payload({ user_id: 'other', typing: true, expires_at: new Date(108_000).toISOString() });
  assert.equal(seen[0]!.expiresAt, 18_000);
  assert.equal(seen[0]!.order, 108_000);
  c.close();
});

test('whole NL/EN/AR typing sentences preserve names literally, including placeholder-like user text', () => {
  for (const copy of Object.values(groupTypingCopy))
    for (const locale of ['nl', 'en', 'ar'] as const) assert.ok(copy[locale].length > 8);
  assert.equal(
    groupTypingText([{ userId: 'a', displayName: 'Continue' }], 'nl'),
    'Continue is aan het typen…',
  );
  assert.equal(
    groupTypingText(
      [
        { userId: 'a', displayName: '{second}' },
        { userId: 'b', displayName: '$&' },
      ],
      'en',
    ),
    '{second} and $& are typing…',
  );
  assert.equal(groupTypingText([], 'ar'), '');
});

test('actual hook pauses on background and restores retained input focus only for a new foreground keystroke', () => {
  let enter!: () => () => void;
  let lifecycle!: (state: string) => void;
  const actions: string[] = [];
  class Controller {
    snapshot = () => [];
    subscribe = () => () => {};
    setCanSend() {}
    start() {
      actions.push('start');
    }
    stop() {
      actions.push('stop');
    }
    focus() {
      actions.push('focus');
    }
    blur() {
      actions.push('blur');
    }
    clear = () => {
      actions.push('clear');
    };
    activity(value: boolean) {
      actions.push('activity:' + value);
    }
  }
  const modules: Record<string, unknown> = {
    react: {
      useMemo: (fn: () => unknown) => fn(),
      useRef: (current: unknown) => ({ current }),
      useEffect: (fn: () => unknown) => fn(),
      useCallback: (fn: unknown) => fn,
      useSyncExternalStore: (_subscribe: unknown, snapshot: () => unknown) => snapshot(),
    },
    'react-native': {
      AppState: {
        currentState: 'active',
        addEventListener: (_event: string, callback: typeof lifecycle) => {
          lifecycle = callback;
          return { remove: () => actions.push('remove-listener') };
        },
      },
    },
    '@react-navigation/native': {
      useFocusEffect: (fn: typeof enter) => {
        enter = fn;
      },
    },
    '../../../services/groups/groupTypingController': { GroupTypingController: Controller },
  };
  const code = ts.transpileModule(
    readFileSync('src/features/groups/hooks/useGroupTyping.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const output: {
    useGroupTyping?: (
      backend: unknown,
      code: string,
      account: string,
      canSend: boolean,
    ) => {
      focus(): void;
      activity(value: boolean): void;
    };
  } = {};
  vm.runInNewContext(code, {
    exports: output,
    require: (name: string) => {
      assert.ok(name in modules);
      return modules[name];
    },
  });
  const hook = output.useGroupTyping!({ groups: {} }, 'ONE', 'me', true);
  const cleanup = enter();
  hook.focus();
  hook.activity(true);
  lifecycle('background');
  lifecycle('active');
  assert.deepEqual(actions.slice(-3), ['stop', 'start', 'focus']);
  hook.activity(true);
  assert.equal(actions.at(-1), 'activity:true');
  cleanup();
  assert.deepEqual(actions.slice(-2), ['remove-listener', 'stop']);
});

test('actual status reserves scaled Arabic/Latin line height even while empty and keeps long aliases accessible', () => {
  type Element = { type: string; props: Record<string, unknown>; children: Element[] };
  let locale: 'nl' | 'en' | 'ar' = 'nl';
  const modules: Record<string, unknown> = {
    react: {
      createElement: (type: string, props: Record<string, unknown>, ...children: Element[]) => ({
        type,
        props,
        children,
      }),
    },
    'react-native': { View: 'View', useWindowDimensions: () => ({ fontScale: 2 }) },
    '../../../shared/components': { T: 'T' },
    '../../../i18n': { useI18n: () => ({ locale }) },
    '../groupTypingCopy': { groupTypingText },
  };
  const output: {
    GroupTypingStatus?: (props: {
      participants: Array<{ userId: string; displayName: string }>;
    }) => Element;
  } = {};
  const code = ts.transpileModule(
    readFileSync('src/features/groups/components/GroupTypingStatus.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    exports: output,
    require: (name: string) => {
      assert.ok(name in modules);
      return modules[name];
    },
  });
  for (locale of ['nl', 'en', 'ar'] as const) {
    const empty = output.GroupTypingStatus!({ participants: [] });
    const people = [{ userId: 'a', displayName: 'Continue {second} $& '.repeat(15) }];
    const full = output.GroupTypingStatus!({ participants: people });
    assert.equal(
      (empty.props.style as { height: number }).height,
      (full.props.style as { height: number }).height,
    );
    assert.ok((full.props.style as { height: number }).height >= (locale === 'ar' ? 44 : 36) + 8);
    assert.equal(full.children[0]!.props.accessibilityLabel, groupTypingText(people, locale));
    assert.equal(full.children[0]!.props.translate, false);
    assert.equal(full.children[0]!.props.ellipsizeMode, 'middle');
  }
});
