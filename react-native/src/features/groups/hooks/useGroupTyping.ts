import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { Backend } from '../../../services/backend/backend';
import { GroupTypingController } from '../../../services/groups/groupTypingController';

export function useGroupTyping(
  backend: Backend,
  code: string,
  accountId: string,
  canSend: boolean,
) {
  const controller = useMemo(
    () => new GroupTypingController(backend.groups, code, accountId, canSend),
    [backend, code, accountId],
  );
  const composerFocused = useRef(false);
  const participants = useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  useEffect(() => controller.setCanSend(canSend), [controller, canSend]);
  useFocusEffect(
    useCallback(() => {
      const start = () => {
        controller.start();
        if (composerFocused.current) controller.focus();
      };
      if (AppState.currentState !== 'background' && AppState.currentState !== 'inactive') start();
      const listener = AppState.addEventListener('change', (state) => {
        if (state === 'active') start();
        else controller.stop();
      });
      return () => {
        listener.remove();
        composerFocused.current = false;
        controller.stop();
      };
    }, [controller]),
  );
  return {
    participants,
    activity: (hasText: boolean) => {
      if (canSend) controller.activity(hasText);
      else controller.clear();
    },
    focus: () => {
      composerFocused.current = true;
      controller.focus();
    },
    blur: () => {
      composerFocused.current = false;
      controller.blur();
    },
    stop: controller.clear,
  };
}
