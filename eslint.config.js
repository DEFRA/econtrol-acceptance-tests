import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: [
      'node_modules/**',
      'allure-results/**',
      'allure-report/**',
      'logs.txt'
    ]
  },
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        browser: 'readonly',
        $: 'readonly',
        $$: 'readonly',
        expect: 'readonly'
      }
    }
  }
]
