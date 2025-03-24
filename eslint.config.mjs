import pluginVue from 'eslint-plugin-vue';
import vueTsEslintConfig from '@vue/eslint-config-typescript';
import skipFormattingConfig from '@vue/eslint-config-prettier/skip-formatting';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    ignores: [
      '**/public',
      '**/dist',
      '**/__snapshot__/**/*.js']
  },
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/src/r3f/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.serviceworker,
        ...globals.browser
      }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules
    }
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx,vue}'],
    rules: {
      // Turn on other rules that you need.
      // '@typescript-eslint/require-array-sort-compare': 'error'
    }
  },
  ...vueTsEslintConfig({
    extends: ['recommended'],
    supportedScriptLangs: { ts: true, js: true },
    rootDir: import.meta.dirname
  }),
  {
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx,vue}'],
    rules: {
      // Turn off the recommended rules that you don't need.
      'prefer-spread': 'off',
      'prefer-rest-params': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-duplicate-enum-values': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '.*', args: 'none', caughtErrors: 'none' }
      ]
    }
  },
  skipFormattingConfig
];
