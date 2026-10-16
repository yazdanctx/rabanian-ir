import { configDefaults, defineConfig } from 'vitest/config';

/** Tests that time the browser: they run alone, once the rest are done. */
const TIMED = ['tests/**/*-latency-browser.test.ts', 'tests/motion-browser.test.ts'];

export default defineConfig({
  test: {
    // Builds the site once into dist/ so tests assert on the real static output.
    globalSetup: ['tests/setup/build-site.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    projects: [
      {
        extends: true,
        test: { name: 'site', include: ['tests/**/*.test.ts'], exclude: [...configDefaults.exclude, ...TIMED] },
      },
      {
        extends: true,
        // A later group, one file at a time: no other test's browser competes with the one timed.
        test: { name: 'timed', include: TIMED, fileParallelism: false, sequence: { groupOrder: 1 } },
      },
    ],
  },
});
