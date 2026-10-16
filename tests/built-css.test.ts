import { describe, expect, it } from 'vitest';
import { builtCss, distFiles } from './helpers/dist';

/** `@font-face { … }` blocks in the built CSS, as raw declaration text. */
function fontFaces(css: string): string[] {
  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]);
}

describe('built stylesheet', () => {
  const css = builtCss();

  it('declares IRANYekanXFaNum at 400, 500, 600 and 700 with font-display: swap', () => {
    const faces = fontFaces(css);
    const weights = faces
      .filter((f) => /font-family:\s*["']?IRANYekanXFaNum["']?\s*[;}]?/.test(f))
      .map((f) => {
        expect(f).toMatch(/font-display:\s*swap/);
        expect(f).toMatch(/url\([^)]*IRANYekanXFaNum-\w+\.[\w-]+\.woff2\)\s*format\(["']?woff2["']?\)/);
        return Number(f.match(/font-weight:\s*(\d+)/)?.[1]);
      });
    expect(weights.sort()).toEqual([400, 500, 600, 700]);
  });

  it('loads no English (Latin-digit) IRANYekanX font', () => {
    expect(css).not.toMatch(/IRANYekanX-(Regular|Medium|DemiBold|Bold)/);
    expect(distFiles().filter((f) => /IRANYekanX-/.test(f))).toEqual([]);
  });

  it('sets the page in IRANYekanXFaNum, ink on white', () => {
    expect(css).toMatch(/font-family:\s*["']?IRANYekanXFaNum/);
    expect(css).toMatch(/background(-color)?:\s*(#fff\b|#ffffff\b|white\b|var\(--color-bg\))/i);
    expect(css).toMatch(/[^-]color:\s*var\(--color-ink\)/);
  });

  it('scrolls smoothly, except under reduced motion', () => {
    expect(css).toMatch(/scroll-behavior:\s*smooth/);
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{[^{}]*{[^}]*scroll-behavior:\s*auto/,
    );
  });

  it('pulses the hero status dot over 3s, and holds it still under reduced motion', () => {
    const keyframes = css.match(/@keyframes\s+([\w-]+)\s*{[^@]*?opacity:\s*\.45[^@]*?opacity:\s*1/);
    expect(keyframes).not.toBeNull();
    const name = keyframes![1];
    const animation = css.match(/\.pulse-dot[^{]*{[^}]*animation:\s*([^;}]+)/)?.[1] ?? '';
    expect(animation.split(/\s+/).sort()).toEqual(['3s', 'ease-in-out', 'infinite', name].sort());
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{[^{}]*\.pulse-dot[^{]*{[^}]*animation:\s*none/,
    );
  });

  it('has no gradients and no dark-mode styles', () => {
    expect(css).not.toMatch(/gradient\(/);
    expect(css).not.toMatch(/prefers-color-scheme/);
  });
});
