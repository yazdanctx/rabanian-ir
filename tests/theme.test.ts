import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PALETTE } from '../src/palette';
import { utilityValue } from './helpers/tailwind';

// Palette Iris, radii and card shadow, as specified in .scratch/landing-page/spec.md.
describe('theme tokens resolve as Tailwind utilities', () => {
  it.each([
    ['ink', '#0F172A'],
    ['muted', '#475569'],
    ['primary', '#7C3AED'],
    ['primary-text', '#6D28D9'],
    ['primary-soft', '#EDE9FE'],
    ['on-primary', '#FFFFFF'],
    ['primary-hover', '#6D28D9'],
    ['surface', '#F1F5F9'],
    ['line', '#E2E8F0'],
    ['bg', '#FFFFFF'],
    // Spec "on dark block": the eyebrow on the ink CTA.
    ['primary-on-ink', '#A78BFA'],
    // HTML Editor (.scratch/html-editor/spec.md): the Code Pane's syntax colours;
    // console warnings and errors.
    ['code-keyword', '#CF222E'],
    ['code-tag', '#116329'],
    ['code-attribute', '#0550AE'],
    ['code-string', '#0A3069'],
    ['code-constant', '#0550AE'],
    ['code-function', '#6F42C1'],
    ['code-definition', '#953800'],
    ['warn', '#B54708'],
    ['error', '#B42318'],
  ])('color %s = %s', async (token, hex) => {
    expect((await utilityValue(`bg-${token}`, 'background-color'))?.toUpperCase()).toBe(hex);
    expect((await utilityValue(`text-${token}`, 'color'))?.toUpperCase()).toBe(hex);
    expect((await utilityValue(`border-${token}`, 'border-color'))?.toUpperCase()).toBe(hex);
  });

  it.each([
    ['btn', '8px'],
    ['card', '14px'],
    ['cta', '18px'],
  ])('radius %s = %s', async (token, value) => {
    expect(await utilityValue(`rounded-${token}`, 'border-radius')).toBe(value);
  });

  it('card shadow is the four-layer paasta shadow', async () => {
    const shadow = await utilityValue('shadow-card', '--tw-shadow');
    expect(shadow?.replace(/\s+/g, ' ')).toBe(
      '0 0 10px 1px var(--tw-shadow-color, #27272a08), ' +
        '0 4px 5px -4px var(--tw-shadow-color, #27272a14), ' +
        '0 1px 5px -2px var(--tw-shadow-color, #27272a1a), ' +
        '0 0 0 1px var(--tw-shadow-color, #27272a0f)',
    );
  });

  it("drops Tailwind's default palette, so no second accent is available", async () => {
    expect(await utilityValue('bg-violet-500', 'background-color')).toBeUndefined();
    expect(await utilityValue('text-blue-600', 'color')).toBeUndefined();
    expect(await utilityValue('text-amber-600', 'color')).toBeUndefined();
  });

  it('the page column (max-w-page) is 680px wide', async () => {
    expect(await utilityValue('max-w-page', 'max-width')).toBe('680px');
  });

  it('font-sans is IRANYekanXFaNum', async () => {
    expect(await utilityValue('font-sans', 'font-family')).toMatch(/^['"]?IRANYekanXFaNum['"]?,/);
  });
});

describe('palette.ts (for code that cannot read CSS, e.g. the OG image)', () => {
  const css = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');
  const cssColors = Object.fromEntries(
    [...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]+);/gi)].map(([, name, hex]) => [
      name,
      hex.toUpperCase(),
    ]),
  );
  const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

  it('holds exactly the colors of the global.css theme, same hexes', () => {
    expect(
      Object.fromEntries(Object.entries(PALETTE).map(([key, hex]) => [kebab(key), hex.toUpperCase()])),
    ).toEqual(cssColors);
  });
});
