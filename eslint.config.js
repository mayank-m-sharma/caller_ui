import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImportX from 'eslint-plugin-import-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tailwind from 'eslint-plugin-tailwindcss';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import TS_ESLint from 'typescript-eslint';

export default TS_ESLint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      eslintPluginImportX.flatConfigs.recommended,
      eslintPluginImportX.flatConfigs.typescript,
      ...tailwind.configs['flat/recommended'],
      ...TS_ESLint.configs.strictTypeChecked,
      ...TS_ESLint.configs.stylisticTypeChecked,
      eslintConfigPrettier,
    ],

    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      // ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
      parser: tsParser,

      parserOptions: {
        ecmaVersion: 'latest',
        project: [
          './tsconfig.app.json',
          './tsconfig.json',
          './tsconfig.node.json',
        ],
        projectService: true,
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname,

        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      'react-hooks': reactHooks,
      // 'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
      // 'react-compiler': reactCompiler,
      react,
    },

    settings: {
      react: {
        version: 'detect',
      },
      tailwindcss: {
        // These are the default values but feel free to customize
        callees: ['classnames', 'clsx', 'ctl', 'cx', 'cn', 'cva'],
        config: 'tailwind.config.js',
      },
    },

    ignores: [
      '.prettierrc.cjs',
      'dist',
      'postcss.config.js',
      'tailwind.config.ts',
    ],

    rules: {
      ...reactHooks.configs.recommended.rules,

      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // React
      'react/prop-types': 'off',
      'react/no-unknown-property': [
        'error',
        { ignore: ['cmdk-input-wrapper'] },
      ],

      // turn on errors for missing imports
      'import-x/default': 'warn',
      'import-x/no-cycle': 'warn',
      'import-x/no-self-import': 'warn',
      'import-x/no-unassigned-import': [
        'warn',
        {
          allow: ['**/*.css', '**/*.scss', '**/*.sass', '**/*.less'],
        },
      ],
      'import-x/no-useless-path-segments': 'warn',

      // TypeScript
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'generic',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          // allowBoolean: true,
        },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            arguments: false,
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/no-invalid-void-type': [
        'warn',
        { allowInGenericTypeArguments: true, allowAsThisParameter: false },
      ],

      // unused import
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
);
