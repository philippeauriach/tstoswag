module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'import'],
  ignorePatterns: ['dist/'],
  rules: {
    '@typescript-eslint/prefer-optional-chain': 'error',
    semi: 0,
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 'off',
    'prefer-template': 'error',
    'no-warning-comments': ['error', { terms: ['todo'], location: 'anywhere' }],
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal'],
        pathGroups: [{ pattern: 'src/**', group: 'external', position: 'after' }],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/newline-after-import': ['error', { count: 1 }],
    'import/no-default-export': 'error',
  },
  overrides: [
    {
      files: ['src/*.ts', 'src/__tests__/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
}
