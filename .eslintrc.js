module.exports = {
  root: true,
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],

  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'max-len': ['error', { code: 120 }],
    'linebreak-style': ['error', (process.platform === 'win32' ? 'windows' : 'unix')],
    camelcase: 'off',
    semi: ['error', 'always'],
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
  },
};
