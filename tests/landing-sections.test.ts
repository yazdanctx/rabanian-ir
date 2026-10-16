import { describe, expect, it } from 'vitest';
import { page } from './helpers/dist';

const doc = page('index.html');
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();

describe('top bar', () => {
  const header = doc.querySelector('body > header');

  it('links the logo, rabanian.ir with a muted .ir, to the top of the page', () => {
    const logo = header?.querySelector('a[href="#top"]');
    expect(text(logo)).toBe('rabanian.ir');
    expect(logo?.querySelector('svg')).not.toBeNull();
    expect(logo?.getAttribute('dir')).toBe('ltr');
    expect(text(logo?.querySelector('.text-muted'))).toBe('.ir');
  });

  it('has a Telegram button to Support, named for screen readers', () => {
    const support = header?.querySelector('a[href="https://t.me/codaminsupport"]');
    expect(support?.getAttribute('aria-label')).toBe('پشتیبانی تلگرام');
    expect(support?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
