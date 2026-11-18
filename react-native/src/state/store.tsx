import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appReducer, type Action } from './reducer';
import { initialState, type AppState } from './models';
import { importLegacyAndroidData } from '../migration/legacyAndroid';
import { hydrateState, stateStorageKey } from './persistence/hydrateState';
import { createSnapshotWriter } from './persistence/snapshotWriter';

type Store = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** Optimistic update; resolves after durable storage, rejects so forms can offer retry. */
  commit: (action: Action) => Promise<void>;
  ready: boolean;
  ownerId: string | null;
  storageError: string | null;
  retryStorage: () => void;
};
const Context = createContext<Store | null>(null);

export function AppStoreProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [loaded, setLoaded] = useState<AppState | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await hydrateState(AsyncStorage, importLegacyAndroidData);
      if (!cancelled) {
        setLoaded(next);
        setReady(true);
        setStorageError(null);
      }
    })().catch((error) => {
      if (!cancelled)
        setStorageError(
          error instanceof Error
            ? error.message
            : 'Could not open local storage. Please try again.',
        );
    });
    return () => {
      cancelled = true;
    };
  }, [retry]);
  // State lives in one reducer after hydration. Use a keyed child to initialize it once.
  if (loaded && ready) return <HydratedStore initial={loaded}>{children}</HydratedStore>;
  return (
    <Context.Provider
      value={{
        state,
        dispatch,
        commit: async () => {
          throw new Error('Local storage is not ready.');
        },
        ready: false,
        ownerId: null,
        storageError,
        retryStorage: () => {
          setRetry((n) => n + 1);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}

function HydratedStore({ initial, children }: React.PropsWithChildren<{ initial: AppState }>) {
  const [state, setState] = useState(initial);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const owner = useRef<string | null>(null);
  const latest = useRef(initial);
  const live = useRef(true);
  const pending = useRef<
    Array<{
      action: Action;
      resolve: () => void;
      reject: (error: Error) => void;
    }>
  >([]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [writer] = useState(() =>
    createSnapshotWriter<AppState>(
      (snapshot) => AsyncStorage.setItem(stateStorageKey, JSON.stringify(snapshot)),
      (error) => {
        if (live.current)
          setStorageError(
            error ? 'Your latest changes could not be saved. Free some storage and retry.' : null,
          );
      },
    ),
  );
  const apply = useCallback(
    (action: Action) => {
      const next = appReducer(latest.current, action);
      latest.current = next;
      setState(next);
      return writer.save(next);
    },
    [writer],
  );
  const commit = useCallback(
    (action: Action): Promise<void> => {
      if (action.type === 'mushaf/readMark') {
        // A stale reader callback after sign-out must not affect the next owner's
        // mark. The UI waits for owner resolution and supplies the owner it showed.
        if (owner.current !== null && action.ownerId === owner.current) return apply(action);
        return Promise.reject(new Error('The reading account changed. Please try again.'));
      }
      if (
        action.type === 'checkIn' ||
        action.type === 'checkIn/batch' ||
        action.type === 'plan/toggle' ||
        action.type === 'goals/record' ||
        action.type === 'history/record' ||
        action.type === 'surah/memorized'
      ) {
        if (owner.current === null) {
          return new Promise<void>((resolve, reject) => {
            pending.current.push({ action, resolve, reject });
          });
        }
        if (
          (action.type === 'checkIn' &&
            action.ownerId !== undefined &&
            action.ownerId !== owner.current) ||
          (action.type === 'checkIn/batch' &&
            action.entries.some(
              (entry) => entry.ownerId !== undefined && entry.ownerId !== owner.current,
            ))
        )
          return Promise.reject(
            new Error('The reading account changed. Please reopen this check-in.'),
          );
        return apply(
          action.type === 'checkIn/batch'
            ? {
                ...action,
                entries: action.entries.map((entry) => ({ ...entry, ownerId: owner.current! })),
              }
            : action.type === 'goals/record' || action.type === 'history/record'
              ? { ...action, entry: { ...action.entry, ownerId: owner.current } }
              : { ...action, ownerId: owner.current },
        );
      }
      return apply(action);
    },
    [apply],
  );
  const dispatch = useCallback(
    (action: Action) => {
      void commit(action).catch(() => undefined);
    },
    [commit],
  );
  useEffect(() => {
    live.current = true;
    void writer.save(latest.current).catch(() => undefined);
    return () => {
      live.current = false;
      pending.current.splice(0).forEach(({ reject }) => reject(new Error('Local store closed.')));
    };
  }, [writer]);
  useEffect(() => {
    let live = true;
    let unsubscribe: (() => void) | undefined;
    const update = (value: string) => {
      if (!live) return;
      owner.current = value;
      setOwnerId(value);
      const queued = pending.current.splice(0);
      queued.forEach(({ action, resolve, reject }) => {
        void commit(action).then(resolve, reject);
      });
    };
    // Auth owns history attribution. Never merge guest rows into an authenticated account.
    void import('../config/runtime')
      .then(async ({ getBackend }) => {
        const backend = getBackend();
        if (!backend) {
          update('');
          return;
        }
        unsubscribe = backend.auth.onChange((session) => update(session?.user.id ?? ''));
        const session = await backend.auth.getSession();
        if (live && owner.current === null) update(session?.user.id ?? '');
      })
      .catch(() => {
        // A newer auth event can resolve the owner while this startup lookup
        // is still pending. Its failure must not turn that owner into a guest.
        if (live && owner.current === null) update('');
      });
    return () => {
      live = false;
      unsubscribe?.();
    };
  }, [commit]);
  return (
    <Context.Provider
      value={{
        state,
        dispatch,
        commit,
        ready: true,
        ownerId,
        storageError,
        retryStorage: () => {
          void writer.save(latest.current).catch(() => undefined);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useAppStore(): Store {
  const store = useContext(Context);
  if (!store) throw new Error('AppStoreProvider is missing');
  return store;
}

/** Optional store access for shared UI that can render in an error fallback. */
export function useOptionalAppStore(): Store | null {
  return useContext(Context);
}
