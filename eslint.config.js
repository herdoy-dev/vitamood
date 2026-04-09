// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // Plain English in JSX is allowed. The default rule rejects
      // apostrophes and quotes in JSX text ("don't", "it's", etc.)
      // and demands HTML entities (&apos;, &quot;) instead. React
      // renders raw punctuation correctly; forcing HTML entities
      // makes the source unreadable and doesn't catch any real bugs.
      // Keeping the rule on was producing 31 errors across the
      // codebase on natural copy, all of which were noise.
      'react/no-unescaped-entities': 'off',
    },
  },
]);
