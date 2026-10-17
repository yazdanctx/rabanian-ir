import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { builtCss, distDir, page } from './helpers/dist';
import { gzippedBytes, pageScripts } from './helpers/scripts';

const doc = page('index.html');

/** Flat `selector { declarations }` rules in CSS, at-rule wrappers ignored. */
function rules(css: string): { selector: string; body: string }[] {
  return [...css.matchAll(/([^{}]+){([^{}]*)}/g)].map(([, selector, body]) => ({
    selector: selector.trim(),
    body,
  }));
}

/** The `data-reveal` elements whose nearest `data-stagger` group is `group`. */
const members = (group: Element) =>
  [...group.querySelectorAll('[data-reveal]')].filter(
    (el) => el.parentElement?.closest('[data-stagger]') === group,
  );

describe('reveal markup', () => {
  it('sequences the Hero on load: badge, h1, tagline, lead, photo, buttons, stats', () => {
    const hero = doc.querySelector('#top [data-stagger="load"]');
    expect(hero).not.toBeNull();
    const items = members(hero!);
    expect(items).toHaveLength(7);
    const [badge, h1, tagline, lead, photo, buttons, stats] = items;
    expect(badge.hasAttribute('data-badge')).toBe(true);
    expect(h1.tagName).toBe('H1');
    expect(tagline.textContent).toBe('با من هوش مصنوعی رو اصولی یاد بگیر!');
    expect(lead.tagName).toBe('P');
    expect(photo.querySelector('[data-profile-photo]') ?? photo.closest('[data-profile-photo]')).not.toBeNull();
    expect(buttons.querySelector('a[href="#courses"]')).not.toBeNull();
    expect(buttons.querySelector('a[href="#tools"]')).not.toBeNull();
    expect(stats.hasAttribute('data-stats')).toBe(true);
  });

  it('reveals every section after the Hero, heading and content', () => {
    const sections = [...doc.querySelectorAll('main > section')].slice(1);
    expect(sections.length).toBeGreaterThanOrEqual(6);
    for (const section of sections) {
      expect(section.querySelector('[data-reveal]')).not.toBeNull();
      const header = section.querySelector('header');
      if (header) expect(header.hasAttribute('data-reveal')).toBe(true);
    }
  });

  it('staggers every Rail, the Toolbox and the résumé lists item by item', () => {
    const lists = [
      ...doc.querySelectorAll('[data-rail]'),
      doc.querySelector('#tools ul'),
      doc.querySelector('[data-timeline]'),
      doc.querySelector('#resume [data-timeline] ~ ul'),
    ];
    expect(lists).toHaveLength(6);
    for (const list of lists) {
      expect(list?.hasAttribute('data-stagger')).toBe(true);
      const items = [...list!.children];
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) expect(item.hasAttribute('data-reveal')).toBe(true);
    }
  });

  it('never nests one reveal inside another', () => {
    for (const el of doc.querySelectorAll('[data-reveal]')) {
      expect(el.parentElement?.closest('[data-reveal]')).toBeNull();
    }
  });
});

describe('reveal starting state', () => {
  const hiding = rules(builtCss()).filter(
    (r) => r.selector.includes('[data-reveal]') && /opacity:\s*0\b|transform:/.test(r.body),
  );

  it('hides reveal targets before they animate in', () => {
    expect(hiding.length).toBeGreaterThan(0);
  });

  it('hides nothing unless the script has put .motion on <html>', () => {
    for (const { selector } of hiding) {
      for (const part of selector.split(',')) expect(part.trim()).toMatch(/^(html)?\.motion\s/);
    }
  });
});

describe('landing-page JavaScript (ADR-0003)', () => {
  const scripts = pageScripts(doc);

  it('ships one bundled module script', () => {
    const modules = doc.querySelectorAll('script[type="module"][src]');
    expect(modules).toHaveLength(1);
    expect(scripts.length).toBeGreaterThan(0);
  });

  it('stays within ~45 KB gzipped in total', () => {
    expect(gzippedBytes(scripts)).toBeLessThanOrEqual(45 * 1024);
  });

  it('loads no React runtime and hydrates no islands', () => {
    expect(doc.querySelector('astro-island')).toBeNull();
    for (const path of scripts) {
      const code = readFileSync(join(distDir, path), 'utf8');
      expect(code).not.toMatch(/react(\.transitional)?\.element|__REACT_DEVTOOLS/);
    }
  });
});

describe('hover lift', () => {
  const css = builtCss();

  it('lifts 2px on hover, with a 180ms transform and shadow transition', () => {
    const lift = css.match(/\.lift\s*{([^}]*)}/)?.[1] ?? '';
    const properties = lift.match(/transition-property:\s*([^;}]+)/)?.[1].split(/\s*,\s*/) ?? [];
    expect(properties).toEqual(expect.arrayContaining(['transform', 'box-shadow']));
    expect(lift).toMatch(/transition-duration:\s*(180ms|\.18s)/);
    expect(css).toMatch(/\.lift:hover\s*{[^}]*transform:\s*translateY\(-2px\)/);
  });

  it('holds still under reduced motion', () => {
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{[^@]*?\.lift:hover\s*{[^}]*transform:\s*none/,
    );
  });

  it('moves the Hero buttons, Course cards, the free Tool, the CTA button and footer links', () => {
    /** Whether each match moves on hover: it, or the card around it, is `.lift`. */
    const lifted = (selector: string) =>
      [...doc.querySelectorAll(selector)].map((el) => el.closest('.lift') !== null);
    for (const selector of [
      '#top a[href="#courses"]',
      '#top a[href="#tools"]',
      '[data-masterclass]',
      '#courses [data-rail] article',
      '#tools a',
      'footer [data-cta] a',
      'footer nav a',
    ]) {
      const flags = lifted(selector);
      expect(flags.length, selector).toBeGreaterThan(0);
      expect(flags.every(Boolean), selector).toBe(true);
    }
    expect(lifted('#tools [aria-disabled="true"]').some(Boolean)).toBe(false);
  });
});
