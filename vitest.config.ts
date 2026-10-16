import { configDefaults, defineConfig } from 'vitest/config';

/** Tests that time the browser: they run alone, once the rest are done. */
const LATENCY = 'tests/**/*-latency-browser.test.ts';

export default defineConfig({
  test: {
    // Builds the site once into dist/ so tests assert on the real static output.
    globalSetup: ['tests/setup/build-site.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    projects: [
      {
        extends: true,
        test: { name: 'site', include: ['tests/**/*.test.ts'], exclude: [...configDefaults.exclude, LATENCY] },
      },
      {
        extends: true,
        // A later group: no other test's browser competes with the one timed.
        test: { name: 'latency', include: [LATENCY], sequence: { groupOrder: 1 } },
      },
    ],
  },
});
