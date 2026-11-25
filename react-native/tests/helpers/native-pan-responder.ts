import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';

/** Execute the installed RN responder, including its grant-time displacement reset. */
export function nativePanResponder(): typeof import('react-native').PanResponder {
  const require = createRequire(import.meta.url);
  const babel = require('@babel/core') as {
    transformSync(source: string, options: object): { code: string };
  };
  const directory = path.join(
    path.dirname(require.resolve('react-native/package.json')),
    'Libraries/Interaction',
  );
  const load = (name: string): { default: unknown } => {
    const module = { exports: {} };
    const code = babel.transformSync(readFileSync(path.join(directory, `${name}.js`), 'utf8'), {
      configFile: false,
      babelrc: false,
      plugins: [
        require.resolve('babel-plugin-syntax-hermes-parser'),
        require.resolve('@babel/plugin-transform-flow-strip-types'),
        require.resolve('@babel/plugin-transform-modules-commonjs'),
      ],
    }).code;
    vm.runInNewContext(code, {
      module,
      exports: module.exports,
      require(dependency: string) {
        assert.equal(dependency, './TouchHistoryMath');
        return load('TouchHistoryMath');
      },
    });
    return module.exports as { default: unknown };
  };
  return load('PanResponder').default as typeof import('react-native').PanResponder;
}
