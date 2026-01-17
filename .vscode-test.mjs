import { defineConfig } from '@vscode/test-electron';

export default defineConfig({
  files: 'out/test/**/*.test.js',
  mocha: {
    ui: 'tdd',
    timeout: 10000
  }
});

