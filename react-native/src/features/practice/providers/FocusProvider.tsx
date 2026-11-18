import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { AppState, Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  focusReducer,
  decodeFocus,
  initialFocus,
  type FocusAction,
  type FocusTimer,
} from '../../../domain/focus';
import { newId } from '../../../state/reducer';
import { useAppStore } from '../../../state/store';
import { useI18n } from '../../../i18n';
import { Icon, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppNavigation } from '../../../app/navigation/types';

const KEY = 'wirdna:focus:v1';
type FocusContext = {
  timer: FocusTimer;
  dispatch: React.Dispatch<FocusAction>;
  ready: boolean;
  error: 'load' | 'save' | null;
  retry: () => void;
};
const Context = createContext<FocusContext | null>(null);
export function FocusProvider({ children }: React.PropsWithChildren) {
  const { dispatch: appDispatch } = useAppStore();
  const [timer, dispatch] = useReducer(focusReducer, initialFocus(newId()));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<'load' | 'save' | null>(null);
  const [attempt, setAttempt] = useState(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef(timer);
  latest.current = timer;
  const save = useCallback(() => {
    const snapshot = latest.current;
    queue.current = queue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(snapshot)))
      .then(() => setError(null))
      .catch(() => setError('save'));
  }, []);
  const retry = useCallback(() => {
    if (ready) save();
    else {
      setError(null);
      setAttempt((value) => value + 1);
    }
  }, [ready, save]);
  useEffect(() => {
    let live = true;
    void AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!live) return;
        dispatch({
          type: 'restore',
          timer: raw ? decodeFocus(raw, newId()) : initialFocus(newId()),
        });
        setReady(true);
      })
      .catch(() => {
        if (live) setError('load');
      });
    return () => {
      live = false;
    };
  }, [attempt]);
  // Persist transitions, not every display tick. A running deadline reconstructs elapsed time.
  useEffect(() => {
    if (ready) save();
  }, [
    ready,
    timer.id,
    timer.goal,
    timer.minutes,
    timer.deadline,
    timer.started,
    timer.finished,
    save,
  ]);
  useEffect(() => {
    if (!ready) return;
    const sample = () => dispatch({ type: 'sample', now: Date.now() });
    const interval = setInterval(sample, 500);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') sample();
    });
    sample();
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [ready]);
  useEffect(() => {
    if (ready && timer.finished)
      appDispatch({
        type: 'focus/finish',
        id: timer.id,
        seconds: timer.minutes * 60,
        now: Date.now(),
      });
  }, [ready, timer.finished, timer.id, timer.minutes, appDispatch]);
  return (
    <Context.Provider value={{ timer, dispatch, ready, error, retry }}>{children}</Context.Provider>
  );
}
export function useFocus() {
  const context = useContext(Context);
  if (!context) throw new Error('FocusProvider is missing');
  return context;
}
export function FocusFloatingTimer() {
  const { timer, ready } = useFocus();
  const nav = useAppNavigation();
  const p = usePalette();
  const { t } = useI18n();
  if (!ready || !timer.started || timer.finished) return null;
  const navigation = nav.getState();
  if (navigation?.routes[navigation.index]?.name === 'Focus') return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('focus.title')}
      onPress={() => nav.navigate('Focus')}
      style={{
        backgroundColor: p.primary,
        marginHorizontal: 12,
        marginBottom: 6,
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 48,
      }}
    >
      <Icon name={timer.deadline ? 'clock' : 'pause'} color={p.onPrimary} size={19} />
      <T color={p.onPrimary} bold>
        {t('focus.menuTitle')}
      </T>
      <View style={{ flex: 1 }} />
      <T color={p.onPrimary} style={{ fontVariant: ['tabular-nums'] }}>
        {Math.floor(timer.remaining / 60)}:{String(timer.remaining % 60).padStart(2, '0')}
      </T>
    </Pressable>
  );
}
