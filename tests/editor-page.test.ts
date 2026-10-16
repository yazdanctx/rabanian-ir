import { describe, expect, it } from 'vitest';
import { page } from './helpers/dist';

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
