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

  it('has gradients only for About’s gray shade (never to white), the tagline’s violet shine and fade, the stats’ glint, the Toolbox’s dots, and the Free Tool’s emerald border — and no dark mode', () => {
    // The build also emits each with its color-mix precomputed, for browsers without color-mix.
    const gradients = css.match(/[a-z-]*gradient\([^;}]*/g) ?? [];
    const about = gradients.filter((g) => g.startsWith('linear-gradient(to bottom,var(--color-surface),'));
    // The shine: a deep violet (primary-text toward ink) at both ends, a light primary at the middle.
    const deep = 'color-mix(in oklab,var(--color-primary-text) 65%,var(--color-ink))';
    const shine = gradients.filter((g) => g.startsWith('linear-gradient(90deg,'));
    // The Hero's stat numbers: ink with a light slate glint across the middle.
    const stats = gradients.filter((g) => g.startsWith('linear-gradient(100deg,var(--color-ink) 25%,'));
    expect(stats.length).toBeGreaterThan(0);
    // The tagline fades out a little toward its foot (a mask: opaque at the top).
    const taglineFade = gradients.filter((g) => g === 'linear-gradient(#000 40%,#000000a6)');
    // The Toolbox's dots fade out from behind the header.
    const dots = gradients.filter((g) => g.startsWith('radial-gradient(80% 70% at 50% 20%,#000 35%,'));
    // The Free Tool: its fill over an emerald ring with a light glint (one background, two layers).
    const emerald = gradients.filter((g) => /^linear-gradient\(var\(--fill\), ?var\(--fill\)\) padding-box,/.test(g));
    expect(emerald).toHaveLength(1);
    expect(emerald[0]).toMatch(/var\(--emerald-glint\) 50%/);
    // Masks are emitted twice: standard and -webkit- prefixed.
    expect(taglineFade.length).toBeGreaterThan(0);
    expect(dots.length).toBeGreaterThan(0);
    expect(about.length + shine.length + stats.length + taglineFade.length + dots.length + emerald.length).toBe(
      gradients.length,
    );
    expect(about).toContainEqual(
      expect.stringMatching(/color-mix\(in oklab,\s*var\(--color-surface\) 40%,\s*var\(--color-line\)\)\)$/),
    );
    for (const gradient of about) expect(gradient).not.toMatch(/--color-bg|#fff\b|#ffffff|white/i);
    expect(shine).toContain(
      `linear-gradient(90deg,${deep},color-mix(in oklab,var(--color-primary) 75%,white) 50%,${deep})`,
    );
    expect(css).not.toMatch(/prefers-color-scheme/);
  });
});
