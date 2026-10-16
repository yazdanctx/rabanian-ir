import { describe, expect, it } from 'vitest';
import { page } from './helpers/dist';

describe('home page (dist/index.html)', () => {
  const doc = page('index.html');

  it('is a Farsi, right-to-left document', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('fa');
    expect(doc.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('renders a main landmark', () => {
    expect(doc.querySelectorAll('main')).toHaveLength(1);
  });
});
