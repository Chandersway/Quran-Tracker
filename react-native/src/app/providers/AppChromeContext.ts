import { createContext, useCallback, useContext, useRef } from 'react';

/** Allows a focused reader to temporarily use the root's top safe area. */
export const AppChromeContext = createContext<(owner: symbol, immersive: boolean) => void>(
  () => {},
);
export function useAppChrome() {
  const setOwnedChrome = useContext(AppChromeContext);
  const owner = useRef(Symbol('reader'));
  return useCallback(
    (immersive: boolean) => setOwnedChrome(owner.current, immersive),
    [setOwnedChrome],
  );
}
