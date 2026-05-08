import js from '@eslint/js'
import globals from 'globals'
import prettier from 'eslint-plugin-prettier'

export default [
  {
    ignores: [
      'node_modules/**',
      'allure-results/**',
      'allure-report/**',
      'docker/**',
      'wdio.browserstack.conf.js',
      'wdio.github.conf.js',
      'wdio.github.browserstack.conf.js',
      'wdio.local.conf.js'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
        ...globals.browser,
        browser: 'readonly',
        expect: 'readonly',
        $: 'readonly',
        $$: 'readonly'
      }
    },
    plugins: {
      prettier
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
]
