import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { distDir, page } from './helpers/dist';

const doc = page('index.html');

/** The `[url, descriptor]` candidates of a `srcset`. */
const candidates = (srcset: string | null | undefined) =>
  (srcset ?? '')
    .split(',')
    .map((c) => c.trim().split(/\s+/))
    .filter(([url]) => url) as [string, string][];

/** Byte size of a built asset referenced by a root-relative URL. */
const bytes = (url: string) => statSync(join(distDir, decodeURI(url.split('?')[0]))).size;

/** Assert a <picture> serves AVIF then WebP, each as a built multi-width srcset. */
function expectAvifWebp(picture: Element | null | undefined) {
  const sources = [...(picture?.querySelectorAll('source') ?? [])];
  expect(sources.map((s) => s.getAttribute('type'))).toEqual(['image/avif', 'image/webp']);
  for (const source of sources) {
    const set = candidates(source.getAttribute('srcset'));
    expect(set.length).toBeGreaterThan(1);
    for (const [url, descriptor] of set) {
      expect(descriptor).toMatch(/^\d+w$/);
      expect(url).toMatch(source.getAttribute('type') === 'image/avif' ? /\.avif$/ : /\.webp$/);
      expect(bytes(url)).toBeGreaterThan(0);
    }
  }
}

describe('profile photo', () => {
  const slot = doc.querySelector('#top [data-profile-photo]');
  const picture = slot?.querySelector('picture');
  const img = picture?.querySelector('img');

  it('is a <picture> serving AVIF and WebP srcsets with a fallback <img>', () => {
    expectAvifWebp(picture);
    expect(bytes(img?.getAttribute('src') ?? '')).toBeGreaterThan(0);
  });

  it('is named for Amin in Farsi and has fixed dimensions and sizes', () => {
    expect(img?.getAttribute('alt')).toBe('امین ربانیان');
    expect(img?.getAttribute('width')).toBe('150');
    expect(img?.getAttribute('height')).toBe('150');
    expect(img?.getAttribute('sizes')).toBe('150px');
  });

  it('loads eagerly at high priority, being above the fold', () => {
    expect(img?.getAttribute('loading')).toBe('eager');
    expect(img?.getAttribute('fetchpriority')).toBe('high');
  });

  it('keeps the above-the-fold image under 80 KB at any served width', () => {
    expect(picture).toBeTruthy();
    for (const source of picture?.querySelectorAll('source') ?? []) {
      for (const [url] of candidates(source.getAttribute('srcset'))) {
        expect(bytes(url)).toBeLessThan(80 * 1024);
      }
    }
  });
});

describe('Masterclass banner', () => {
  const banner = doc.querySelector('#courses [data-masterclass] [data-banner]');
  const picture = banner?.querySelector('picture');
  const img = picture?.querySelector('img');

  it('is a <picture> serving AVIF and WebP srcsets with a fallback <img>', () => {
    expectAvifWebp(picture);
    expect(bytes(img?.getAttribute('src') ?? '')).toBeGreaterThan(0);
  });

  it('has a Farsi alt, 16:9 dimensions and sizes matching the column', () => {
    expect(img?.getAttribute('alt')).toMatch(/[؀-ۿ]/);
    expect(img?.getAttribute('width')).toBe('680');
    expect(img?.getAttribute('height')).toBe('383');
    expect(img?.getAttribute('sizes')).toBe('(min-width: 768px) 680px, 100vw');
  });

  it('loads lazily and decodes asynchronously, being below the fold', () => {
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(img?.getAttribute('decoding')).toBe('async');
    expect(img?.hasAttribute('fetchpriority')).toBe(false);
  });
});

describe('favicon', () => {
  it('is linked from the head as an SVG icon', () => {
    const link = doc.querySelector('head link[rel="icon"]');
    expect(link?.getAttribute('type')).toBe('image/svg+xml');
    expect(link?.getAttribute('href')).toBe('/favicon.svg');
  });

  it('draws the white star mark on a primary tile', () => {
    const svg = parseHTML(readFileSync(join(distDir, 'favicon.svg'), 'utf8')).document;
    const root = svg.querySelector('svg');
    expect(root?.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    expect(root?.getAttribute('viewBox')).toBe('0 0 32 32');
    expect(svg.querySelector('rect')?.getAttribute('fill')).toBe('#1769FF');
    const star = svg.querySelector('path');
    expect(star?.getAttribute('d')).toBe('M12 2.5l2 6.4 6.4 2-6.4 2-2 6.4-2-6.4-6.4-2 6.4-2z');
    expect(star?.getAttribute('fill')).toBe('#FFFFFF');
  });
});
