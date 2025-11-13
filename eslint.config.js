const path = require('path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const rootDir = process.cwd();

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    languageOptions: {
      parserOptions: {
        project: path.join(rootDir, 'tsconfig.json'),
        tsconfigRootDir: rootDir,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: path.join(rootDir, 'tsconfig.json'),
        },
      },
    },
  },
]);
