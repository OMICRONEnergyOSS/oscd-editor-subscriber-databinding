import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import eslintPluginTSDoc from 'eslint-plugin-tsdoc';
import litPlugin from 'eslint-plugin-lit';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...typescriptEslint.configs['flat/recommended'],
  litPlugin.configs['flat/recommended'],
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', 'doc/'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  eslintConfigPrettier,
  {
    files: ['**/*.ts'],
    plugins: {
      tsdoc: eslintPluginTSDoc,
      'no-only-tests': noOnlyTests,
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': [
        'error',
        {
          ignoreRestArgs: true,
        },
      ],
      'lit/lifecycle-super': 'error',
      'lit/no-classfield-shadowing': 'error',
      'no-only-tests/no-only-tests': 'error',
      'tsdoc/syntax': 'warn',
      curly: ['error', 'all'],
    },
  },
  {
    files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];
