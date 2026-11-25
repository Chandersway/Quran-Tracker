import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Keyboard, Platform, ScrollView, TextInput, View, type KeyboardEvent } from 'react-native';

type Scroll = React.ComponentRef<typeof ScrollView>;
type Region = React.ComponentRef<typeof View>;

/** Reveal an actual focused field (and its composer when it fits), in window coordinates. */
export function useKeyboardScroll(
  scroll: RefObject<Scroll | null>,
  enabled: boolean,
  revealRef?: RefObject<Region | null>,
) {
  const active = enabled && Platform.OS !== 'web';
  const [bottomInset, setBottomInset] = useState(0);
  const offset = useRef(0);
  const frame = useRef<number | null>(null);
  const mounted = useRef(true);
  const focused = useRef<ReturnType<typeof TextInput.State.currentlyFocusedInput>>(undefined);
  const keyboardTop = useRef<number | undefined>(Keyboard.metrics?.()?.screenY);
  const revision = useRef(0);
  const reveal = useCallback(() => {
    if (!active || keyboardTop.current === undefined) return;
    const current = ++revision.current;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const input = focused.current;
      const viewport = scroll.current;
      const valid = () =>
        mounted.current &&
        current === revision.current &&
        keyboardTop.current !== undefined &&
        input === TextInput.State.currentlyFocusedInput();
      if (!input || !viewport || !valid()) return;
      viewport.measureInWindow((_x, top, _width, height) => {
        if (!valid() || height <= 0) return;
        const bottom = Math.min(top + height, keyboardTop.current!) - 12;
        const above = top + 12;
        // Android edge-to-edge can leave the scroll view physically behind the IME.
        // Add only that measured overlap, including when this is inside an existing KAV.
        const overlap = Math.max(0, top + height - keyboardTop.current!);
        setBottomInset((previous) => (Math.abs(previous - overlap) < 1 ? previous : overlap));
        if (bottom <= above) return;
        input.measureInWindow((_inputX, inputTop, _inputWidth, inputHeight) => {
          if (!valid() || inputHeight <= 0) return;
          const move = (targetTop: number, targetHeight: number) => {
            if (!valid()) return;
            const delta =
              targetHeight > bottom - above
                ? targetTop + targetHeight - bottom
                : targetTop + targetHeight > bottom
                  ? targetTop + targetHeight - bottom
                  : Math.min(0, targetTop - above);
            const next = Math.max(0, offset.current + delta);
            if (Math.abs(next - offset.current) < 1) return;
            offset.current = next;
            viewport.scrollTo({ y: next, animated: false });
          };
          const region = revealRef?.current;
          if (!region) {
            move(inputTop, inputHeight);
            return;
          }
          region.measureInWindow((_regionX, regionTop, _regionWidth, regionHeight) => {
            const containsInput =
              regionTop <= inputTop + 1 && regionTop + regionHeight >= inputTop + inputHeight - 1;
            if (containsInput && regionHeight > 0 && regionHeight <= bottom - above)
              move(regionTop, regionHeight);
            else move(inputTop, inputHeight);
          });
        });
      });
    });
  }, [active, scroll, revealRef]);
  useEffect(() => {
    mounted.current = true;
    if (!active) return;
    const update = (event: KeyboardEvent) => {
      keyboardTop.current = event.endCoordinates.screenY;
      reveal();
    };
    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', update),
      Keyboard.addListener('keyboardDidHide', () => {
        keyboardTop.current = undefined;
        revision.current++;
        setBottomInset(0);
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
      }),
      ...(Platform.OS === 'ios' ? [Keyboard.addListener('keyboardWillChangeFrame', update)] : []),
    ];
    return () => {
      mounted.current = false;
      revision.current++;
      subscriptions.forEach((subscription) => subscription.remove());
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [active, reveal]);
  return {
    bottomInset: active ? bottomInset : 0,
    reveal,
    focus: () => {
      if (!active) return;
      focused.current = TextInput.State.currentlyFocusedInput();
      keyboardTop.current = Keyboard.metrics?.()?.screenY ?? keyboardTop.current;
      reveal();
    },
    scrolled: (y: number) => {
      offset.current = y;
      revision.current++;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    },
  };
}
