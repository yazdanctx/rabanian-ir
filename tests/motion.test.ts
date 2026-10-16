import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { builtCss, distDir, page } from './helpers/dist';
import { gzippedBytes, pageScripts } from './helpers/scripts';

const doc = page('index.html');

/** Flat `selector { declarations }` rules in CSS, at-rule wrappers ignored. */
function rules(css: string): { selector: string; body: string }[] {
  return [...css.matchAll(/([^{}]+){([^{}]*)}/g)].map(([, selector, body]) => ({
    selector: selector.trim(),
    body,
  }));
}

describe('reveal starting state', () => {
  const hiding = rules(builtCss()).filter(
    (r) => r.selector.includes('[data-reveal]') && /opacity:\s*0\b|transform:/.test(r.body),
  );

  it('hides reveal targets before they animate in', () => {
    expect(hiding.length).toBeGreaterThan(0);
  });

  it('hides nothing unless the script has put .motion on <html>', () => {
    for (const { selector } of hiding) {
      for (const part of selector.split(',')) expect(part.trim()).toMatch(/^(html)?\.motion\s/);
    }
  });
});

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
