import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { distDir, page } from './helpers/dist';
import { gzippedBytes, pageScripts } from './helpers/scripts';

const doc = page('index.html');

describe('landing-page JavaScript (ADR-0003)', () => {
  const scripts = pageScripts(doc);

  it('ships one bundled module script', () => {
    const modules = doc.querySelectorAll('script[type="module"][src]');
    expect(modules).toHaveLength(1);
    expect(scripts.length).toBeGreaterThan(0);
  });

  it('stays within ~45 KB gzipped in total', () => {
    expect(gzippedBytes(scripts)).toBeLessThanOrEqual(45 * 1024);
  });

  it('loads no React runtime and hydrates no islands', () => {
    expect(doc.querySelector('astro-island')).toBeNull();
    for (const path of scripts) {
      const code = readFileSync(join(distDir, path), 'utf8');
      expect(code).not.toMatch(/react(\.transitional)?\.element|__REACT_DEVTOOLS/);
    }
  });
});
