const base = require('./base')

/** @type {import("eslint").Linter.Config} */
module.exports = {
  ...base,
  extends: [...(base.extends ?? []), 'plugin:react/recommended', 'plugin:react-native/all'],
  env: {
    'react-native/react-native': true,
  },
  rules: {
    ...base.rules,
    'react/react-in-jsx-scope': 'off',
    'react-native/no-raw-text': 'off',
  },
}
