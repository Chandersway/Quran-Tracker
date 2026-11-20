import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { AppleSignInButton as unsupportedButton } from '../src/features/account/components/AppleSignInButton';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Native element props are inspected without loading React Native into Node.
type Element = { type: string; props: Record<string, any>; children: Element[] };
function nativeButton(available: boolean) {
  let value = false;
  let effect: (() => void) | undefined;
  let started = false;
  let presses = 0;
  const react = {
    createElement: (type: string, props: object, ...children: Element[]) => ({
      type,
      props,
      children,
    }),
    useState: () => [
      value,
      (next: boolean) => {
        value = next;
      },
    ],
    useEffect: (run: () => void) => {
      if (!started) {
        started = true;
        effect = run;
      }
    },
  };
  const modules = {
    react,
    'react-native': { View: 'View', ActivityIndicator: 'ActivityIndicator' },
    '../../../shared/theme': { usePalette: () => ({ primary: 'ink' }), isDarkPalette: () => false },
    'expo-apple-authentication': {
      isAvailableAsync: async () => available,
      AppleAuthenticationButton: 'NativeAppleButton',
      AppleAuthenticationButtonType: { SIGN_IN: 'SIGN_IN' },
      AppleAuthenticationButtonStyle: { BLACK: 'BLACK', WHITE: 'WHITE' },
    },
  };
  const output = ts.transpileModule(
    readFileSync(
      new URL('../src/features/account/components/AppleSignInButton.ios.tsx', import.meta.url),
      'utf8',
    ),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
    },
  ).outputText;
  const exports = {} as { AppleSignInButton: (props: object) => Element | null };
  vm.runInNewContext(output, { exports, require: (name: keyof typeof modules) => modules[name] });
  return {
    render(disabled = false, loading = false) {
      const node = exports.AppleSignInButton({
        disabled,
        loading,
        onPress: () => {
          presses++;
        },
      });
      effect?.();
      effect = undefined;
      return node;
    },
    presses: () => presses,
  };
}

test('Apple button is absent on unsupported platforms and before device availability is confirmed', async () => {
  assert.equal(unsupportedButton({ disabled: false, loading: false, onPress() {} }), null);
  const unavailable = nativeButton(false);
  assert.equal(unavailable.render(), null);
  await new Promise((done) => setImmediate(done));
  assert.equal(unavailable.render(), null);
  const available = nativeButton(true);
  assert.equal(available.render(), null);
  await new Promise((done) => setImmediate(done));
  assert.equal(available.render()!.children[0]!.children[0]!.type, 'NativeAppleButton');
});

test('native Apple button retains approved appearance and blocks presses with busy accessibility state', async () => {
  const f = nativeButton(true);
  f.render();
  await new Promise((done) => setImmediate(done));
  const normal = f.render()!.children[0]!.children[0]!;
  assert.equal(normal.props.buttonType, 'SIGN_IN');
  assert.equal(normal.props.buttonStyle, 'BLACK');
  assert.equal(normal.props.cornerRadius, 12);
  assert.equal(normal.props.style.height, 50);
  assert.equal(normal.props.style.width, '100%');
  assert.equal('backgroundColor' in normal.props.style, false);
  normal.props.onPress();
  assert.equal(f.presses(), 1);
  for (const [disabled, loading] of [
    [true, false],
    [false, true],
  ]) {
    const tree = f.render(disabled, loading)!;
    const wrapper = tree.children[0]!;
    const button = wrapper.children[0]!;
    assert.equal(wrapper.props.pointerEvents, 'none');
    assert.equal(button.props.accessibilityState.disabled, true);
    assert.equal(button.props.accessibilityState.busy, loading);
    button.props.onPress();
    assert.equal(f.presses(), 1);
    if (loading) assert.equal(tree.children[1]!.type, 'ActivityIndicator');
  }
});
