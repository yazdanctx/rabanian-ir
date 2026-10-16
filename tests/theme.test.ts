import { describe, expect, it } from 'vitest';
import { utilityValue } from './helpers/tailwind';

// Palette P, radii and card shadow, as specified in .scratch/landing-page/spec.md.
describe('theme tokens resolve as Tailwind utilities', () => {
  it.each([
    ['ink', '#050816'],
    ['muted', '#536078'],
    ['primary', '#1769FF'],
    ['primary-text', '#0D5BE0'],
    ['primary-soft', '#EAF1FF'],
    ['surface', '#F5F7FA'],
    ['line', '#DCE3EE'],
    ['bg', '#FFFFFF'],
  ])('color %s = %s', async (token, hex) => {
    expect((await utilityValue(`bg-${token}`, 'background-color'))?.toUpperCase()).toBe(hex);
    expect((await utilityValue(`text-${token}`, 'color'))?.toUpperCase()).toBe(hex);
    expect((await utilityValue(`border-${token}`, 'border-color'))?.toUpperCase()).toBe(hex);
  });

  it.each([
    ['btn', '8px'],
    ['card', '12px'],
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

  it("drops Tailwind's default palette, so no second accent (violet) is available", async () => {
    expect(await utilityValue('bg-violet-500', 'background-color')).toBeUndefined();
    expect(await utilityValue('text-blue-600', 'color')).toBeUndefined();
  });

  it('font-sans is IRANYekanXFaNum', async () => {
    expect(await utilityValue('font-sans', 'font-family')).toMatch(/^['"]?IRANYekanXFaNum['"]?,/);
  });
});
