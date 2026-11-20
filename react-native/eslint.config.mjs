import tseslint from 'typescript-eslint';
import { architecturePlugin } from './scripts/eslint-architecture.mjs';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist*/**',
      'output/**',
      '.tooling/**',
      'assets/**',
      '.expo/**',
      'android/**',
      'ios/**',
      'audio-cache/**',
      'src/content/generated/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { architecture: architecturePlugin },
    rules: { 'architecture/dependencies': 'error' },
  },
  { files: ['metro.config.js'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
