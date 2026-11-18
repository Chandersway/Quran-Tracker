import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Exercise actual form callbacks without a native renderer.
type Node = { type: string; props: Record<string, any>; children: unknown[] };

function form(screen: 'account' | 'groups' = 'account', platform = 'android', language = 'en') {
  let slot = 0;
  const slots: unknown[] = [];
  const effects: Array<() => unknown> = [];
  const calls: string[] = [];
  const signUps: string[] = [];
  let authError: unknown = { code: 'email_not_confirmed', message: 'Email not confirmed' };
  let session: unknown = null;
  let authListener: ((session: unknown) => void) | undefined;
  let readSession = async () => session;
  let appleWork: () => Promise<unknown> = async () => null;
  let resendError: unknown = null;
  const auth = {
    onChange: (listener: (session: unknown) => void) => {
      authListener = listener;
      return () => undefined;
    },
    getSession: () => readSession(),
    signInWithApple: async () => {
      calls.push('apple');
      const result = await appleWork();
      if (result && typeof result === 'object' && 'user' in result) {
        session = { user: result.user };
        authListener?.(session);
      }
      return result;
    },
    signIn: async (email: string, password: string) => {
      calls.push(`signIn:${email}:${password}`);
      if (authError) throw authError;
      return { id: 'user' };
    },
    signUp: async (email: string, password: string) => {
      signUps.push(`${email}:${password}`);
      return { id: 'new-unconfirmed-user' };
    },
    resendSignUpConfirmation: async (email: string) => {
      calls.push(`resend:${email}`);
      if (resendError) throw resendError;
    },
  };
  const profiles = {
    rememberProviderName: async (id: string, name: string) => {
      calls.push(`name:${id}:${name}`);
      return name;
    },
    load: async (account: { displayName: string }) => ({
      displayName: account.displayName,
      avatarUrl: null,
    }),
  };
  const backend = { auth, profiles };
  const react = {
    Fragment: 'Fragment',
    createElement: (type: string, props: unknown, ...children: unknown[]) => ({
      type,
      props: props ?? {},
      children,
    }),
    useState(value: unknown) {
      const index = slot++;
      if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value;
      return [
        slots[index],
        (next: unknown) => {
          slots[index] = typeof next === 'function' ? next(slots[index]) : next;
        },
      ];
    },
    useRef(value: unknown) {
      const index = slot++;
      if (!(index in slots)) slots[index] = { current: value };
      return slots[index];
    },
    useMemo(fn: () => unknown) {
      return fn();
    },
    useEffect(fn: () => unknown, deps: unknown[]) {
      const index = slot++;
      const old = slots[index] as unknown[] | undefined;
      if (!old || old.length !== deps.length || deps.some((value, i) => value !== old[i])) {
        slots[index] = deps;
        effects.push(fn);
      }
    },
  };
  const modules: Record<string, unknown> = {
    react,
    'react-native': {
      Image: 'Image',
      Pressable: 'Pressable',
      View: 'View',
      KeyboardAvoidingView: 'KeyboardAvoidingView',
      Platform: { OS: platform },
      Linking: {},
    },
    '@react-navigation/elements': { useHeaderHeight: () => 80 },
    '@react-navigation/native': {},
    'expo-document-picker': {},
    '../../../config/runtime': { getBackend: () => backend },
    '../../../state/store': { useAppStore: () => ({ state: { preferences: { language } } }) },
    '../../../shared/theme': { usePalette: () => ({}) },
    '../../../i18n': {
      restoreSourceCopy: (_locale: unknown, copy: unknown) => copy,
      screenSourceKeys: { account: {} },
      useI18n: () => ({ t: (key: string) => key }),
    },
    '../../../shared/components': Object.fromEntries(
      [
        'Button',
        'Card',
        'Empty',
        'Field',
        'Icon',
        'IconButton',
        'Notice',
        'Row',
        'Screen',
        'Section',
        'Segments',
        'Sheet',
        'T',
      ].map((name) => [name, name]),
    ),
    '../model/authLinkState': {
      getAuthLinkState: () => ({}),
      subscribeAuthLinkState: () => () => undefined,
      updateAuthLinkState: () => undefined,
    },
    '../components/KeyboardFormScreen': { KeyboardFormScreen: 'KeyboardFormScreen' },
    '../components/AppleSignInButton': { AppleSignInButton: 'AppleSignInButton' },
    '../../../app/navigation/types': {
      useAppNavigation: () => ({ navigate: (route: string) => calls.push(`navigate:${route}`) }),
    },
    '../components/GroupCreateWizard': {},
    '../components/GroupImage': { GroupImage: 'GroupImage' },
    '../components/GroupJoinFlow': { GroupJoinFlow: 'GroupJoinFlow' },
    '../components/groupUi': {},
  };
  const path =
    screen === 'account'
      ? '../src/features/account/screens/AccountScreen.tsx'
      : '../src/features/groups/screens/GroupsScreen.tsx';
  function loadModule(path: string): Record<string, () => Node> {
    const output = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
    }).outputText;
    const exports: Record<string, () => Node> = {};
    vm.runInNewContext(output, {
      exports,
      require: (name: string) => {
        assert.ok(name in modules, `mock missing: ${name}`);
        return modules[name];
      },
      Error,
    });
    return exports;
  }
  modules['../model/accountCopy'] = loadModule('../src/features/account/model/accountCopy.ts');
  modules['../hooks/useAccountProfile'] = loadModule(
    '../src/features/account/hooks/useAccountProfile.ts',
  );
  const exports = loadModule(path);
  let tree: Node;
  function render() {
    slot = 0;
    const component = exports[screen === 'account' ? 'AccountScreen' : 'GroupsScreen'];
    assert.ok(component);
    tree = component();
    for (const effect of effects.splice(0)) effect();
    return tree;
  }
  function nodes(value: unknown = tree): Node[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== 'object' || !('type' in value)) return [];
    const node = value as Node;
    return [node, ...node.children.flatMap(nodes)];
  }
  function find(type: string, label?: string) {
    const node = nodes().find(
      (node) =>
        node.type === type &&
        (label === undefined || node.props.title === label || node.props.label === label),
    );
    assert.ok(node, `${type} ${label ?? ''} exists`);
    return node;
  }
  async function settle() {
    await new Promise((resolve) => setImmediate(resolve));
    render();
  }
  return {
    render,
    settle,
    nodes,
    find,
    calls,
    signUps,
    setError: (value: unknown) => {
      authError = value;
    },
    setSession: (value: unknown) => {
      session = value;
    },
    emitSession: (value: unknown) => {
      session = value;
      authListener?.(value);
    },
    setSessionReader: (reader: () => Promise<unknown>) => {
      readSession = reader;
    },
    setAppleWork: (work: () => Promise<unknown>) => {
      appleWork = work;
    },
    setResendError: (value: unknown) => {
      resendError = value;
    },
  };
}

test('Apple callback suppresses double taps, retains native cancellation and labels the authenticated provider correctly', async () => {
  const f = form('account', 'ios');
  f.render();
  await f.settle();
  let resolve!: (value: unknown) => void;
  f.setAppleWork(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const button = f.find('AppleSignInButton');
  button.props.onPress();
  button.props.onPress();
  f.render();
  assert.deepEqual(f.calls, ['apple']);
  assert.equal(f.find('AppleSignInButton').props.loading, true);
  assert.equal(f.find('Button', 'Sign in').props.disabled, true);
  resolve(null);
  await f.settle();
  assert.equal(
    f.nodes().some((node) => node.type === 'Notice' && node.props.error),
    false,
  );
  assert.equal(f.find('AppleSignInButton').props.loading, false);
  f.setAppleWork(async () => ({
    user: {
      id: 'apple-reader',
      email: 'relay@example.test',
      provider: 'apple',
      displayName: 'Amina',
      avatarUrl: null,
    },
    firstSignInName: 'Amina',
  }));
  f.find('AppleSignInButton').props.onPress();
  await f.settle();
  assert.ok(f.nodes().some((node) => node.type === 'T' && node.children.includes('Apple account')));
  assert.ok(f.calls.includes('name:apple-reader:Amina'));
  assert.equal(
    f.nodes().some((node) => node.type === 'AppleSignInButton'),
    false,
  );
});

test('Apple backend errors remain localized and do not claim sign-in', async () => {
  const f = form('account', 'ios', 'nl');
  f.render();
  await f.settle();
  f.setAppleWork(async () => {
    throw new Error('provider disabled');
  });
  f.find('AppleSignInButton').props.onPress();
  await f.settle();
  assert.ok(
    f
      .nodes()
      .some(
        (node) =>
          node.type === 'Notice' && /Inloggen met Apple is niet gelukt/.test(node.props.message),
      ),
  );
  assert.equal(f.find('AppleSignInButton').props.disabled, false);
});

test('a newer auth event wins over stale initial session hydration', async () => {
  const f = form();
  let resolve!: (value: unknown) => void;
  f.setSessionReader(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  f.render();
  const account = (id: string) => ({
    user: { id, email: `${id}@example.test`, provider: 'email', displayName: id, avatarUrl: null },
  });
  f.emitSession(account('new-account'));
  resolve(account('old-account'));
  await f.settle();
  assert.ok(
    f
      .nodes()
      .some((node) => node.type === 'T' && node.children.includes('new-account@example.test')),
  );
  assert.equal(
    f
      .nodes()
      .some((node) => node.type === 'T' && node.children.includes('old-account@example.test')),
    false,
  );
});

test('unconfirmed sign-in explains the blocker and resends only on explicit request', async () => {
  const f = form();
  f.render();
  await f.settle();
  f.find('Field', 'Email address').props.onChangeText(' reader@example.test ');
  f.find('Field', 'Password').props.onChangeText('password');
  f.render();
  f.find('Button', 'Sign in').props.onPress();
  await f.settle();
  assert.equal(f.calls[0], 'signIn:reader@example.test:password');
  assert.ok(
    f
      .nodes()
      .some((node) => node.type === 'Notice' && /confirm your email/i.test(node.props.message)),
  );
  assert.equal(f.calls.length, 1);
  f.find('Button', 'Resend confirmation email').props.onPress();
  await f.settle();
  assert.equal(f.calls[1], 'resend:reader@example.test');
  assert.ok(
    f
      .nodes()
      .some(
        (node) =>
          node.type === 'Notice' &&
          /confirmation email/i.test(node.props.message) &&
          !node.props.error,
      ),
  );
  f.find('Field', 'Email address').props.onChangeText('another@example.test');
  f.render();
  assert.equal(
    f.nodes().some((node) => node.props.title === 'Resend confirmation email'),
    false,
  );
});

test('unconfirmed signup uses confirmation wording even when Supabase returns a user', async () => {
  const f = form();
  f.render();
  await f.settle();
  f.find('Row', 'Create account').props.onPress();
  f.render();
  f.find('Field', 'Email address').props.onChangeText('reader@example.test');
  f.find('Field', 'Password').props.onChangeText('a longer password');
  f.find('Field', 'Repeat password').props.onChangeText('a longer password');
  f.render();
  f.find('Button', 'Create account').props.onPress();
  await f.settle();
  assert.ok(
    f
      .nodes()
      .some((node) => node.type === 'Notice' && /confirm your email/i.test(node.props.message)),
  );
  f.find('Button', 'Resend confirmation email');
  assert.equal(f.calls.length, 0);
  assert.deepEqual(f.signUps, ['reader@example.test:a longer password']);
});

test('signup confirmation prevents a mismatched backend call and preserves both fields for correction', async () => {
  const f = form();
  f.render();
  await f.settle();
  f.find('Row', 'Create account').props.onPress();
  f.render();
  f.find('Field', 'Email address').props.onChangeText('reader@example.test');
  f.find('Field', 'Password').props.onChangeText('a longer password');
  f.find('Field', 'Repeat password').props.onChangeText('a longer typo');
  f.render();
  assert.equal(f.find('Button', 'Create account').props.disabled, true);
  assert.equal(f.find('Field', 'Repeat password').props.secureTextEntry, true);
  assert.match(f.find('Field', 'Repeat password').props.error, /do not match/);
  // Callback validation is independent of the disabled presentation.
  f.find('Button', 'Create account').props.onPress();
  await f.settle();
  assert.deepEqual(f.signUps, []);
  assert.equal(f.find('Field', 'Password').props.value, 'a longer password');
  assert.equal(f.find('Field', 'Repeat password').props.value, 'a longer typo');
  f.find('Field', 'Repeat password').props.onChangeText('a longer password');
  f.render();
  assert.equal(f.find('Button', 'Create account').props.disabled, false);
  f.find('Button', 'Create account').props.onPress();
  await f.settle();
  assert.equal(f.signUps.length, 1);
  assert.equal(f.find('Field', 'Password').props.value, '');
  assert.equal(f.find('Field', 'Repeat password').props.value, '');
});

test('structured invalid credentials do not offer confirmation or imply a session', async () => {
  const f = form();
  f.setError({ code: 'invalid_credentials', message: 'Localized error' });
  f.render();
  await f.settle();
  f.find('Field', 'Email address').props.onChangeText('reader@example.test');
  f.find('Field', 'Password').props.onChangeText('password');
  f.render();
  f.find('Button', 'Sign in').props.onPress();
  await f.settle();
  assert.ok(
    f
      .nodes()
      .some((node) => node.type === 'Notice' && /password.*incorrect/i.test(node.props.message)),
  );
  assert.equal(
    f.nodes().some((node) => node.props.title === 'Resend confirmation email'),
    false,
  );
  f.find('Button', 'Sign in');
});

test('a rejected resend reports the rate limit without claiming email delivery', async () => {
  const f = form();
  f.setResendError({ code: 'over_email_send_rate_limit' });
  f.render();
  await f.settle();
  f.find('Field', 'Email address').props.onChangeText('reader@example.test');
  f.find('Field', 'Password').props.onChangeText('password');
  f.render();
  f.find('Button', 'Sign in').props.onPress();
  await f.settle();
  f.find('Button', 'Resend confirmation email').props.onPress();
  await f.settle();
  assert.equal(
    f.nodes().some((node) => node.type === 'Notice' && !node.props.error),
    false,
  );
  assert.ok(
    f
      .nodes()
      .some(
        (node) =>
          node.type === 'Notice' && node.props.error && /wait|later/i.test(node.props.message),
      ),
  );
});

for (const [language, emailLabel, passwordLabel, loginLabel, resendLabel, confirmation] of [
  [
    'nl',
    'E-mailadres',
    'Wachtwoord',
    'Inloggen',
    'Bevestigingsmail opnieuw versturen',
    /Bevestig je e-mailadres/,
  ],
  [
    'ar',
    'البريد الإلكتروني',
    'كلمة المرور',
    'تسجيل الدخول',
    'إعادة إرسال رسالة التأكيد',
    /أكّد بريدك الإلكتروني/,
  ],
] as const)
  test(`confirmation cause and action use full ${language} copy`, async () => {
    const f = form('account', 'android', language);
    f.setError({ code: 'email_not_confirmed', message: 'Localized backend error' });
    f.render();
    await f.settle();
    f.find('Field', emailLabel).props.onChangeText('reader@example.test');
    f.find('Field', passwordLabel).props.onChangeText('password');
    f.render();
    f.find('Button', loginLabel).props.onPress();
    await f.settle();
    assert.ok(
      f.nodes().some((node) => node.type === 'Notice' && confirmation.test(node.props.message)),
    );
    f.find('Button', resendLabel);
  });

test('account delegates field visibility to its measured keyboard form and opts action sheets into avoidance', async () => {
  const f = form('account');
  const tree = f.render();
  await f.settle();
  assert.equal(tree.type, 'KeyboardFormScreen');
  assert.equal(f.find('Sheet').props.avoidKeyboard, true);
});

test('guest group actions have separate touch spacing and preserve both routes', async () => {
  const f = form('groups');
  f.render();
  await f.settle();
  const actions = f
    .nodes()
    .find(
      (node) =>
        node.type === 'View' &&
        node.children.filter(
          (child) => child && typeof child === 'object' && (child as Node).type === 'Button',
        ).length === 2,
    );
  assert.ok(actions && actions.props.style.gap >= 12);
  f.find('Button', 'groups.accountRequired.action').props.onPress();
  assert.deepEqual(f.calls, ['navigate:Account']);
  f.find('Button', 'app.groupJoinWithCode').props.onPress();
  f.render();
  assert.equal(f.find('Sheet').props.visible, true);
  assert.equal(f.find('Sheet').props.avoidKeyboard, true);
});
