// eslint.config.js
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        wx: 'readonly', // 微信小程序全局对象
        App: 'readonly',
        Page: 'readonly',
        Component: 'readonly',
        getApp: 'readonly'
      },
      ecmaVersion: 2020,
      sourceType: 'module'
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
      'no-debugger': 'off',
      'no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: false }],
      'eqeqeq': ['error', 'always'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'no-trailing-spaces': ['error'],
      'eol-last': ['error', 'always']
    }
  }
];
