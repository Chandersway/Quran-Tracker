import path from 'node:path';

const normalized = (value) => value.replaceAll('\\', '/');

/** Resolve ownership, rather than matching fragile numbers of ../ path segments. */
export function dependencyViolation(filename, specifier, cwd = process.cwd()) {
  const file = normalized(path.relative(cwd, filename));
  if (!file.startsWith('src/')) return null;
  const owner = file.split('/')[1];
  if (specifier === '@supabase/supabase-js' && ['features', 'shared', 'domain'].includes(owner))
    return 'Supabase belongs inside a service adapter. Import the public service contract instead.';
  if (!specifier.startsWith('.')) {
    if (
      owner === 'domain' &&
      /^(react(?:-native)?(?:\/|$)|expo-|@react-native|@react-navigation)/.test(specifier)
    )
      return 'Domain rules must not depend on React, native APIs or navigation.';
    return null;
  }
  const target = normalized(path.relative(cwd, path.resolve(path.dirname(filename), specifier)));
  const targetOwner = target.split('/')[1];
  if (
    ['src/ui', 'src/navigation', 'src/importing'].some(
      (old) => target === old || target.startsWith(old + '/'),
    )
  )
    return 'Use the current app/navigation, shared/components, shared/theme or exporting module.';
  const forbidden = {
    domain: ['features', 'app', 'shared', 'services'],
    services: ['features', 'app', 'shared'],
    shared: ['features', 'app', 'services'],
    content: ['features', 'app', 'shared'],
    migration: ['features', 'app', 'shared'],
    state: ['features', 'app', 'shared'],
  };
  if (forbidden[owner]?.includes(targetOwner))
    return `${owner} must not import ${targetOwner}. Move the reusable behavior to its owning module.`;
  if (
    owner === 'domain' &&
    targetOwner === 'state' &&
    !/^src\/state\/models(?:\.[cm]?tsx?)?$/.test(target)
  )
    return 'Domain rules may use state model types, but must not depend on store or persistence behavior.';
  const fromFeature = /^src\/features\/([^/]+)\//.exec(file)?.[1];
  const screen = /^src\/features\/([^/]+)\/screens\//.exec(target);
  if (fromFeature && screen && fromFeature !== screen[1])
    return 'Reuse the other feature’s components or hooks, never its screen implementation.';
  return null;
}

/** @type {import('eslint').ESLint.Plugin} */
export const architecturePlugin = {
  rules: {
    dependencies: {
      meta: { type: 'problem', schema: [], messages: { dependency: '{{reason}}' } },
      create(context) {
        function check(node) {
          if (!node || typeof node.value !== 'string') return;
          const reason = dependencyViolation(context.filename, node.value, context.cwd);
          if (reason) context.report({ node, messageId: 'dependency', data: { reason } });
        }
        return {
          ImportDeclaration: (node) => check(node.source),
          ExportNamedDeclaration: (node) => check(node.source),
          ExportAllDeclaration: (node) => check(node.source),
          ImportExpression: (node) => check(node.source),
          CallExpression: (node) => {
            if (node.callee.type === 'Identifier' && node.callee.name === 'require')
              check(node.arguments[0]);
          },
        };
      },
    },
  },
};
