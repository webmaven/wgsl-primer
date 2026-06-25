import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'venv/**',
      'node_modules/**',
      'docs/assets/**',
      'site/**',
      'vite.config.ts',
      'docs/javascripts/**',
      'scratch_*.js',
      'scratch/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'linebreak-style': ['warn', 'unix'],
      'no-console': 'warn',
      'no-undef': 'off',
      'no-useless-rename': 'warn',
      'object-shorthand': 'warn',
      quotes: ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    },
  },
];
