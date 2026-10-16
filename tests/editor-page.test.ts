import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { distDir, distFiles, page, pageCss } from './helpers/dist';
import { pageScripts } from './helpers/scripts';

/* The HTML Editor's route, as built (spec: .scratch/html-editor/spec.md → Page). */
const doc = page('editor/index.html');

describe('editor page (dist/editor/index.html)', () => {
  it('is a Farsi, right-to-left document titled «ویرایشگر HTML — rabanian.ir»', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('fa');
    expect(doc.documentElement.getAttribute('dir')).toBe('rtl');
    expect(doc.querySelectorAll('title')).toHaveLength(1);
    expect(doc.title).toBe('ویرایشگر HTML — rabanian.ir');
  });

  it('has a Farsi meta description', () => {
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    expect(description).toMatch(/^[؀-ۿ]/);
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('names the tool in the main heading', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('main h1')?.textContent?.trim()).toBe('ویرایشگر HTML');
  });

  it('mounts the editor as one React island rendered only in the browser', () => {
    const islands = doc.querySelectorAll('astro-island');
    expect(islands).toHaveLength(1);
    const [island] = islands;
    expect(island.closest('main')).not.toBeNull();
    expect(island.getAttribute('client')).toBe('only');
    expect(island.getAttribute('component-url')).toMatch(/^\/_astro\/EditorApp\.[\w-]+\.js$/);
    expect(island.getAttribute('renderer-url')).toMatch(/^\/_astro\/client\.[\w-]+\.js$/);
    // client:only: nothing is server-rendered inside it.
    expect(island.children).toHaveLength(0);
  });

  describe('top bar, as on the landing page', () => {
    const header = doc.querySelector('body > header');

    it('links the logo home, since this page has no #top', () => {
      const logo = header?.querySelector('a');
      expect(logo?.getAttribute('href')).toBe('/');
      expect(logo?.textContent?.trim()).toBe('آکادمی ربانیان');
      expect(logo?.querySelector('picture img')?.getAttribute('alt')).toBe('');
    });

    it('has the Telegram button to Support', () => {
      const support = header?.querySelector('a[href="https://t.me/codaminsupport"]');
      expect(support?.getAttribute('aria-label')).toBe('پشتیبانی تلگرام');
    });
  });
});

/** `@font-face { … }` blocks in CSS, as raw declaration text. */
const fontFaces = (css: string) => [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]);
const monoFaces = (css: string) =>
  fontFaces(css).filter((face) => /font-family:\s*["']?JetBrains Mono["']?\s*(;|$)/.test(face));

describe('JetBrains Mono, the code font', () => {
  const faces = monoFaces(pageCss(doc));

  it('is declared on /editor at 400 and 700, self-hosted woff2, swapping in', () => {
    const weights = faces.map((face) => {
      expect(face).toMatch(/font-display:\s*swap/);
      const url = face.match(/url\(["']?([^)"']+)["']?\)\s*format\(["']?woff2["']?\)/)?.[1] ?? '';
      expect(url).toMatch(/^\/_astro\/JetBrainsMono-\w+\.[\w-]+\.woff2$/);
      expect(distFiles()).toContain(url.slice(1));
      return Number(face.match(/font-weight:\s*(\d+)/)?.[1]);
    });
    expect(weights.sort()).toEqual([400, 700]);
  });
});

describe('landing page (dist/index.html) stays free of the editor', () => {
  const home = page('index.html');

  it('loads no JetBrains Mono', () => {
    expect(pageCss(home)).not.toMatch(/JetBrains/);
    for (const link of home.querySelectorAll('link[rel="preload"]')) {
      expect(link.getAttribute('href')).not.toMatch(/JetBrains/);
    }
  });

  it('loads no editor code', () => {
    expect(home.querySelector('astro-island')).toBeNull();
    for (const path of pageScripts(home)) {
      expect(readFileSync(join(distDir, path), 'utf8')).not.toMatch(/EditorApp|data-editor/);
    }
  });

  it('loads no CodeMirror', () => {
    for (const path of pageScripts(home)) {
      expect(readFileSync(join(distDir, path), 'utf8')).not.toMatch(/\bcm-(editor|content)\b|@codemirror/);
    }
    expect(pageCss(home)).not.toMatch(/\.cm-|code-(tag|string|comment)/);
  });
});
