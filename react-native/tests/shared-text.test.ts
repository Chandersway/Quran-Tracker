import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { translate } from '../src/i18n';

test('shared text keeps user names literal and translates only when requested', () => {
  const source = readFileSync('src/shared/components/AppText.tsx', 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
  }).outputText;
  const react = {
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => ({
      type,
      props,
      children,
    }),
  };
  const modules: Record<string, unknown> = {
    react: { __esModule: true, default: react },
    'react-native': { Text: 'Text' },
    '../../i18n': {
      useI18n: () => ({ locale: 'nl', t: (value: string) => translate(value, 'nl') }),
    },
    '../theme': { fonts: {}, usePalette: () => ({ ink: '#111', muted: '#888' }) },
  };
  const exports: Record<string, (props: Record<string, unknown>) => { children: unknown[] }> = {};
  vm.runInNewContext(code, { exports, require: (name: string) => modules[name] });
  assert.equal(exports.T!({ children: 'Settings' }).children[0], 'Settings');
  assert.equal(
    exports.T!({ children: 'Settings', translate: true }).children[0],
    translate('Settings', 'nl'),
  );
  assert.notEqual(translate('Settings', 'nl'), 'Settings');
  assert.equal(
    exports.T!({ children: translate('common.loading', 'nl') }).children[0],
    translate('common.loading', 'nl'),
  );
});
