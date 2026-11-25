import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import type { useAccountProfile } from '../src/features/account/hooks/useAccountProfile';
import type { Profile, ProfileAccount, ProfileService } from '../src/services/profiles/types';

type Controller = ReturnType<typeof useAccountProfile>;
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function editor() {
  let slot = 0;
  const slots: unknown[] = [];
  const effects: Array<() => void> = [];
  const cleanups = new Map<number, () => void>();
  const notices: string[] = [];
  const errors: string[] = [];
  const calls: unknown[] = [];
  const loaded = deferred<Profile>();
  const saved = deferred<Profile>();
  let canceled = false;
  let account: ProfileAccount | null = {
    id: 'reader',
    email: 'reader@example.test',
    displayName: 'Identity',
    avatarUrl: null,
  };
  const profiles: ProfileService = {
    clearCache: async () => undefined,
    rememberProviderName: async () => null,
    load: () => loaded.promise,
    saveName: async (id, displayName) => {
      calls.push(['saveName', id, displayName]);
      return (await saved.promise).displayName;
    },
    saveAvatar: async (user, name, photo) => {
      calls.push(['avatar', user.id, name, photo]);
      return saved.promise;
    },
  };
  const modules: Record<string, unknown> = {
    react: {
      useState(value: unknown) {
        const index = slot++;
        if (!(index in slots)) slots[index] = value;
        return [
          slots[index],
          (next: unknown) => {
            slots[index] = next;
          },
        ];
      },
      useRef(value: unknown) {
        const index = slot++;
        if (!(index in slots)) slots[index] = { current: value };
        return slots[index];
      },
      useEffect(callback: () => () => void, dependencies: unknown[]) {
        const index = slot++;
        const previous = slots[index] as unknown[] | undefined;
        if (previous && dependencies.every((value, key) => value === previous[key])) return;
        slots[index] = dependencies;
        effects.push(() => {
          cleanups.get(index)?.();
          cleanups.set(index, callback());
        });
      },
    },
    'expo-document-picker': {
      getDocumentAsync: async (options: unknown) => {
        calls.push(['pick', options]);
        return {
          canceled,
          assets: canceled ? [] : [{ uri: 'file:///photo', mimeType: 'image/png' }],
        };
      },
    },
  };
  const output = ts.transpileModule(
    readFileSync(
      new URL('../src/features/account/hooks/useAccountProfile.ts', import.meta.url),
      'utf8',
    ),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText;
  const exports: { useAccountProfile?: typeof useAccountProfile } = {};
  vm.runInNewContext(output, {
    exports,
    require(name: string) {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  let current: Controller;
  function render() {
    slot = 0;
    current = exports.useAccountProfile!({
      profiles,
      account,
      messages: {
        profileName: 'Name required',
        profileSaved: 'Profile saved',
        avatarSaved: 'Photo saved',
      },
      errorMessage: () => 'Profile failed',
      setError: (message) => errors.push(message),
      setNotice: (message) => notices.push(message),
    });
    effects.splice(0).forEach((effect) => effect());
    return current;
  }
  render();
  return {
    render,
    loaded,
    saved,
    calls,
    notices,
    errors,
    account: (value: ProfileAccount | null) => {
      account = value;
    },
    cancel: () => {
      canceled = true;
    },
    unmount: () => {
      for (const cleanup of cleanups.values()) cleanup();
    },
  };
}

test('late profile loads hydrate existing photos without overwriting an edited name', async () => {
  const e = editor();
  assert.equal(e.render().profileName, 'Identity');
  e.render().setProfileName('Draft');
  e.loaded.resolve({ displayName: 'Online', avatarUrl: 'online-photo' });
  await e.loaded.promise;
  assert.equal(e.render().profileName, 'Draft');
  assert.equal(e.render().avatarUrl, 'online-photo');
});

test('profile save owns busy/error recovery and suppresses duplicate submissions', async () => {
  const e = editor();
  e.render().setProfileName('Draft');
  const action = e.render();
  const first = action.saveProfile();
  await action.saveProfile();
  assert.equal(e.calls.length, 1);
  assert.equal(e.render().profileBusy, true);
  e.saved.reject(new Error('offline'));
  await first;
  assert.equal(e.render().profileBusy, false);
  assert.equal(e.render().profileName, 'Draft');
  assert.equal(e.errors.at(-1), 'Profile failed');
  assert.equal(e.notices.includes('Profile saved'), false);
});

test('canceling avatar choice does not upload and releases the busy state', async () => {
  const e = editor();
  e.cancel();
  await e.render().chooseAvatar();
  assert.equal(e.render().profileBusy, false);
  assert.equal(e.calls.length, 1);
  assert.equal(e.notices.includes('Photo saved'), false);
});

test('avatar saves selected photo and uses returned profile plus success feedback', async () => {
  const e = editor();
  const action = e.render().chooseAvatar();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(e.calls.length, 2);
  assert.equal((e.calls[1] as unknown[])[0], 'avatar');
  e.saved.resolve({ displayName: 'Saved', avatarUrl: 'saved-photo' });
  await action;
  assert.equal(e.render().profileName, 'Saved');
  assert.equal(e.render().avatarUrl, 'saved-photo');
  assert.equal(e.notices.at(-1), 'Photo saved');
});

test('account changes and unmount discard pending profile feedback and data', async () => {
  const e = editor();
  const action = e.render().saveProfile();
  e.account(null);
  e.render();
  e.saved.resolve({ displayName: 'Old account', avatarUrl: 'old-photo' });
  await action;
  assert.equal(e.render().profileName, '');
  assert.equal(e.render().avatarUrl, null);
  assert.equal(e.notices.includes('Profile saved'), false);
  e.unmount();
  e.loaded.resolve({ displayName: 'Loaded after unmount', avatarUrl: 'old-photo' });
  await e.loaded.promise;
  assert.equal(e.render().profileName, '');
});

test('saving a name before hydration never sends or overwrites the unloaded photo', async () => {
  const e = editor();
  e.render().setProfileName('Draft');
  const action = e.render().saveProfile();
  assert.deepEqual(JSON.parse(JSON.stringify(e.calls[0])), ['saveName', 'reader', 'Draft']);
  e.saved.resolve({ displayName: 'Draft', avatarUrl: null });
  await action;
  e.loaded.resolve({ displayName: 'Old name', avatarUrl: 'existing-community-photo' });
  await e.loaded.promise;
  assert.equal(e.render().profileName, 'Draft');
  assert.equal(e.render().avatarUrl, 'existing-community-photo');
  assert.equal(e.render().profileBusy, false);
});

test('a stale profile load cannot replace a newly uploaded photo', async () => {
  const e = editor();
  const action = e.render().chooseAvatar();
  await new Promise((resolve) => setImmediate(resolve));
  e.saved.resolve({ displayName: 'Reader', avatarUrl: 'new-upload' });
  await action;
  e.loaded.resolve({ displayName: 'Old name', avatarUrl: 'old-photo' });
  await e.loaded.promise;
  assert.equal(e.render().profileName, 'Reader');
  assert.equal(e.render().avatarUrl, 'new-upload');
});
