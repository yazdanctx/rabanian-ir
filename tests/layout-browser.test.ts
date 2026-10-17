import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromePath, openPage, serveDist } from './helpers/browser';

/*
 * Layout facts that need a real (headless) Chrome. Skipped where no Chrome is
 * installed (set CHROME_PATH).
 */

/**
 * In the page: the Masterclass banner's rendered width, and the width its
 * `sizes` attribute promises at this viewport (first matching condition).
 */
const bannerWidths = `(() => {
  const img = document.querySelector('[data-masterclass] [data-banner] img');
  const entries = img.getAttribute('sizes').split(/,(?![^(]*\\))/).map((s) => s.trim());
  const chosen = entries.find((entry) => {
    const media = entry.match(/^(\\(.*?\\))\\s+(.+)$/);
    return !media || matchMedia(media[1]).matches;
  });
  const length = chosen.match(/^\\(.*?\\)\\s+(.+)$/)?.[1] ?? chosen;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;width:' + length;
  document.body.append(probe);
  const promised = probe.getBoundingClientRect().width;
  probe.remove();
  return { rendered: img.getBoundingClientRect().width, promised };
})()`;

let site: Awaited<ReturnType<typeof serveDist>>;
beforeAll(async () => {
  site = await serveDist();
});
afterAll(() => site?.close());

describe.skipIf(!chromePath)('Masterclass banner sizes', () => {
  it.each([360, 390, 700, 768, 1280])(
    'promises within a few px of the rendered width at a %ipx viewport',
    async (width) => {
      const tab = await openPage(`${site.origin}/`, { width, reducedMotion: true });
      try {
        const { rendered, promised } = await tab.evaluate<{ rendered: number; promised: number }>(
          bannerWidths,
        );
        // Never smaller (blurry), and at most the card's 2px border larger.
        expect(promised).toBeGreaterThanOrEqual(rendered);
        expect(promised - rendered).toBeLessThanOrEqual(4);
      } finally {
        await tab.close();
      }
    },
  );
});

/**
 * In the page, per résumé entry: the vertical center of the dot between
 * employer and period, and of the en dash's ink in the same line, in px.
 */
const resumeDotCenters = `document.fonts.ready.then(() =>
  [...document.querySelectorAll('#resume [data-meta]')].map((meta) => {
    const ctx = document.createElement('canvas').getContext('2d');
    const style = getComputedStyle(meta);
    ctx.font = style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
    const range = document.createRange();
    range.selectNodeContents([...meta.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()));
    const baseline = range.getBoundingClientRect().top + ctx.measureText('–').fontBoundingBoxAscent;
    const dash = ctx.measureText('–');
    const dot = meta.querySelector('svg').getBoundingClientRect();
    return {
      dot: dot.top + dot.height / 2,
      dash: baseline - (dash.actualBoundingBoxAscent - dash.actualBoundingBoxDescent) / 2,
    };
  }),
)`;

describe.skipIf(!chromePath)('résumé employer · period separator', () => {
  it('centers the dot on the line of the period’s dash', async () => {
    const tab = await openPage(`${site.origin}/`, { reducedMotion: true });
    try {
      const rows = await tab.evaluate<{ dot: number; dash: number }[]>(resumeDotCenters);
      expect(rows).toHaveLength(4);
      for (const { dot, dash } of rows) expect(Math.abs(dot - dash)).toBeLessThanOrEqual(0.5);
    } finally {
      await tab.close();
    }
  });
});

describe.skipIf(!chromePath)('education cards', () => {
  it('put the university logo on the card’s left, vertically centred on the text', async () => {
    const tab = await openPage(`${site.origin}/`, { reducedMotion: true });
    try {
      const cards = await tab.evaluate<{ logoRight: number; textLeft: number; logoMid: number; textMid: number }[]>(
        `[...document.querySelectorAll('#resume [data-timeline] ~ ul > li')].map((li) => {
          const logo = li.querySelector('[data-logo]').getBoundingClientRect();
          const text = li.firstElementChild.getBoundingClientRect();
          return { logoRight: logo.right, textLeft: text.left, logoMid: logo.top + logo.height / 2, textMid: text.top + text.height / 2 };
        })`,
      );
      expect(cards).toHaveLength(3);
      for (const card of cards) {
        expect(card.logoRight).toBeLessThan(card.textLeft);
        expect(Math.abs(card.logoMid - card.textMid)).toBeLessThanOrEqual(1);
      }
    } finally {
      await tab.close();
    }
  });
});

describe.skipIf(!chromePath)('the dark footer', () => {
  it('meets the last band with no line along its top edge', async () => {
    const tab = await openPage(`${site.origin}/`, { reducedMotion: true });
    try {
      const lastBandRule = await tab.evaluate<string>(
        `getComputedStyle(document.querySelector('main > section:last-child')).borderBottomWidth`,
      );
      expect(lastBandRule).toBe('0px');
    } finally {
      await tab.close();
    }
  });
});

describe.skipIf(!chromePath)('curved band edges', () => {
  /** Page-side: each band's (and the footer's) edges, overlap, fill and stacking. */
  const edges = `[...document.querySelectorAll('main > section'), document.querySelector('body > footer')].map((el) => {
    const s = getComputedStyle(el);
    return {
      top: [s.borderTopLeftRadius, s.borderTopRightRadius],
      bottom: [s.borderBottomLeftRadius, s.borderBottomRightRadius],
      marginTop: s.marginTop,
      fade: s.backgroundImage.startsWith('linear-gradient'),
      z: s.zIndex,
      clip: s.clipPath,
      rule: s.borderTopWidth,
    };
  })`;
  type Edge = { top: string[]; bottom: string[]; marginTop: string; fade: boolean; z: string; clip: string; rule: string };

  it.each([
    [390, '32px'],
    [1280, '64px'],
  ])('shapes each meeting of two bands its own way at %ipx', async (width, h) => {
    const tab = await openPage(`${site.origin}/`, { width, reducedMotion: true });
    try {
      const [hero, about, courses, tools, testimonials, resume, footer] = await tab.evaluate<Edge[]>(edges);
      const flat = ['0px', '0px'];
      const dome = [`50% ${h}`, `50% ${h}`];
      const wave = { top: [`100% ${h}`, '0px'], bottom: ['0px', `100% ${h}`], marginTop: `-${h}`, z: '10' };
      // About is a wave like the Toolbox: it rises over the Hero and lies over Courses, which tucks
      // under it. It keeps a gray gradient (not a fade to white).
      expect(hero).toMatchObject({ top: flat, bottom: flat, marginTop: '0px', z: 'auto', clip: 'none' });
      expect(about).toMatchObject({ ...wave, fade: true, clip: 'none' });
      expect(courses).toMatchObject({ top: flat, bottom: flat, marginTop: `-${h}`, fade: false, z: 'auto' });
      // The Toolbox is a sweep at both ends, the bottom one its top turned 180°: the top bends at
      // the left (top-left radius), the bottom at the right (bottom-right), so both edges rise to
      // the right. It rises over Courses and lies over Testimonials, which tucks under it.
      expect(tools).toMatchObject(wave);
      expect(testimonials).toMatchObject({ top: flat, bottom: flat, marginTop: `-${h}`, rule: '0px' });
      // A 1px rule above the (white) Résumé.
      expect(resume).toMatchObject({ top: flat, bottom: flat, marginTop: '0px', fade: false, clip: 'none', rule: '1px' });
      expect(footer).toMatchObject({ top: dome, marginTop: `-${h}` });
    } finally {
      await tab.close();
    }
  });
});
