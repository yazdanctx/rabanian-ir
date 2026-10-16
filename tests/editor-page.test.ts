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
});
