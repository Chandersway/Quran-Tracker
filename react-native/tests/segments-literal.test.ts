import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { translate } from '../src/i18n';
import { layoutDirection, selectedOptionScrollX } from '../src/domain/layoutDirection';

type Element = { type: unknown; props: Record<string, unknown>; children: unknown[] };

test('literal segment labels keep a user plan name for visible and accessible text', () => {
  const source = readFileSync('src/shared/components/Segments.tsx', 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
  }).outputText;
  const react = {
    useRef: (current: unknown) => ({ current }),
    useEffect: () => {},
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => ({
      type,
      props,
      children,
    }),
  };
  const modules: Record<string, unknown> = {
    react: { __esModule: true, default: react, ...react },
    'react-native': { Pressable: 'Pressable', ScrollView: 'ScrollView', View: 'View' },
    '../../i18n': {
      useI18n: () => ({ locale: 'nl', t: (value: string) => translate(value, 'nl') }),
    },
    '../theme': { usePalette: () => ({}) },
    './AppText': { T: 'T' },
    './styles': { s: {} },
    '../../domain/layoutDirection': { layoutDirection, selectedOptionScrollX },
  };
  const exports: Record<string, (props: Record<string, unknown>) => Element> = {};
  vm.runInNewContext(code, { exports, require: (name: string) => modules[name] });
  const tree = exports.Segments!({
    value: 'plan',
    options: [{ value: 'plan', label: 'Settings' }],
    onChange: () => {},
    translateLabels: false,
  });
  const list = tree.children[0] as Element;
  const tab = (list.children[0] as Element[])[0]!;
  assert.equal(tab.props.accessibilityLabel, 'Settings');
  assert.equal((tab.children[0] as Element).children[0], 'Settings');
  assert.notEqual(translate('Settings', 'nl'), 'Settings');
});
