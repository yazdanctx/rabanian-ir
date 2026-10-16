import { build } from 'astro';

/** Vitest global setup: one production build into dist/ before any test runs. */
export default async function buildSite() {
  await build({ root: process.cwd(), logLevel: 'error' });
}
