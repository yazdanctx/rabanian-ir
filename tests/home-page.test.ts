import { describe, expect, it } from 'vitest';
import { distFiles, page } from './helpers/dist';

describe('home page (dist/index.html)', () => {
  const doc = page('index.html');

  it('is a Farsi, right-to-left document', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('fa');
    expect(doc.documentElement.getAttribute('dir')).toBe('rtl');
  });

  const meta = (selector: string) => doc.querySelector(selector)?.getAttribute('content');

  it('has a Farsi title and description', () => {
    expect(doc.title).toMatch(/امین ربانیان/);
    expect(meta('meta[name="description"]')).toMatch(/[؀-ۿ]/);
  });

  it('declares its canonical URL on rabanian.ir', () => {
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://rabanian.ir/',
    );
  });

  it('carries Open Graph and Twitter card tags matching the page', () => {
    expect(meta('meta[property="og:title"]')).toBe(doc.title);
    expect(meta('meta[property="og:description"]')).toBe(meta('meta[name="description"]'));
    expect(meta('meta[property="og:url"]')).toBe('https://rabanian.ir/');
    expect(meta('meta[property="og:type"]')).toBe('website');
    expect(meta('meta[property="og:locale"]')).toBe('fa_IR');
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(meta('meta[name="twitter:title"]')).toBe(doc.title);
    expect(meta('meta[name="twitter:description"]')).toBe(meta('meta[name="description"]'));
  });

  it('preloads only the Regular FaNum font, as a woff2 that exists in dist', () => {
    const preloads = [...doc.querySelectorAll('link[rel="preload"][as="font"]')];
    expect(preloads).toHaveLength(1);
    const [link] = preloads;
    expect(link.getAttribute('type')).toBe('font/woff2');
    expect(link.hasAttribute('crossorigin')).toBe(true);
    const href = link.getAttribute('href') ?? '';
    expect(href).toMatch(/^\/_astro\/IRANYekanXFaNum-Regular\.[\w-]+\.woff2$/);
    expect(distFiles()).toContain(href.slice(1));
  });

  it('renders a main landmark', () => {
    expect(doc.querySelectorAll('main')).toHaveLength(1);
  });
});
