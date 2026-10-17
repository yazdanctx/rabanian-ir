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

  it('hides the Rail scrollbar in every engine', () => {
    expect(css).toMatch(/\.rail[^{]*{[^}]*scrollbar-width:\s*none/);
    expect(css).toMatch(/\.rail[^{]*::-webkit-scrollbar[^{]*{[^}]*display:\s*none/);
  });

  it('has one gradient only — About’s subtle gray-to-gray shade, never to white — and no dark-mode styles', () => {
    // The build also emits the shade with its color-mix precomputed, for browsers without color-mix.
    const gradients = css.match(/[a-z-]*gradient\([^;}]*/g) ?? [];
    expect(gradients.length).toBeGreaterThan(0);
    expect(gradients.length).toBeLessThanOrEqual(2);
    expect(gradients).toContainEqual(
      expect.stringMatching(/^linear-gradient\(to bottom,\s*var\(--color-surface\),\s*color-mix\(in oklab,\s*var\(--color-surface\) 40%,\s*var\(--color-line\)\)\)/),
    );
    for (const gradient of gradients) {
      expect(gradient).toMatch(/^linear-gradient\(to bottom,\s*var\(--color-surface\),/);
      expect(gradient).not.toMatch(/--color-bg|#fff\b|#ffffff|white/i);
    }
    expect(css).not.toMatch(/prefers-color-scheme/);
  });
});
