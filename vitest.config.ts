import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Builds the site once into dist/ so tests assert on the real static output.
    globalSetup: ['tests/setup/build-site.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
