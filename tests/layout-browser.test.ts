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
