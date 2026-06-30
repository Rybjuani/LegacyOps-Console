import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    env: {
      // Prevents apps/api/src/server.ts from binding a real port when imported
      // from smoke tests. The server module still exports buildServer(), which
      // is what tests actually use.
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent'
    },
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/*/src/**', 'apps/*/src/**'],
      exclude: ['**/*.test.ts', '**/index.ts']
    }
  }
});
