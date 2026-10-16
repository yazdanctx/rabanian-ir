import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { distDir, distFiles, page } from './helpers/dist';

const read = (path: string) => readFileSync(join(distDir, path), 'utf8');
const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);

/** Every built HTML page and the URL it is served at on rabanian.ir. */
const pages = distFiles()
  .filter((f) => f.endsWith('.html') && f !== '404.html')
  .map((file) => ({ file, url: `https://rabanian.ir/${file.replace(/(^|\/)index\.html$/, '$1')}` }));

describe('robots.txt', () => {
  it('lets every crawler in and points at the sitemap index', () => {
    expect(existsSync(join(distDir, 'robots.txt'))).toBe(true);
    const lines = read('robots.txt')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    expect(lines).toContain('User-agent: *');
    expect(lines).toContain('Allow: /');
    expect(lines.some((l) => /^Disallow:\s*\/\S*$/.test(l))).toBe(false);
    expect(lines).toContain('Sitemap: https://rabanian.ir/sitemap-index.xml');
  });
});

describe('sitemap', () => {
  it('has an index whose sitemaps all exist in dist', () => {
    const sitemaps = locs(read('sitemap-index.xml'));
    expect(sitemaps.length).toBeGreaterThan(0);
    for (const loc of sitemaps) {
      expect(loc).toMatch(/^https:\/\/rabanian\.ir\//);
      expect(existsSync(join(distDir, new URL(loc).pathname))).toBe(true);
    }
  });

  it('lists exactly the built pages, the home page included', () => {
    const urls = locs(read('sitemap-index.xml')).flatMap((loc) => locs(read(new URL(loc).pathname)));
    expect(urls).toContain('https://rabanian.ir/');
    expect(urls.sort()).toEqual(pages.map((p) => p.url).sort());
  });
});

describe('canonical links', () => {
  it.each(pages)('$file declares itself canonical at $url', ({ file, url }) => {
    const links = page(file).querySelectorAll('link[rel="canonical"]');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe(url);
  });
});
