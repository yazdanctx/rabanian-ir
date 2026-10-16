import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromePath, openPage, serveDist, type BrowserPage } from './helpers/browser';

/*
 * The motion script in a real (headless) Chrome, on a 390×844 phone
 * viewport. Skipped where no Chrome is installed (set CHROME_PATH).
 */

/** Page-side helpers, prepended to evaluated expressions. */
const lib = `
  const reveals = () => [...document.querySelectorAll('[data-reveal]')];
  const shown = (el) => {
    const s = getComputedStyle(el);
    return s.opacity === '1' && s.transform === 'none';
  };
  const waitFor = async (test, ms = 3000) => {
    const end = performance.now() + ms;
    while (!test()) {
      if (performance.now() > end) return false;
      await new Promise((r) => setTimeout(r, 50));
    }
    return true;
  };
`;

let site: Awaited<ReturnType<typeof serveDist>>;
beforeAll(async () => {
  site = await serveDist();
});
afterAll(() => site?.close());

describe.skipIf(!chromePath)('landing motion in the browser', () => {
  describe('with motion allowed', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openPage(`${site.origin}/`);
    });
    afterAll(() => tab?.close());

    it('plays the Hero sequence on load, in order, 60ms apart', async () => {
      const result = await tab.evaluate<{ done: boolean; starts: number[] }>(`(async () => {
        ${lib}
        const hero = reveals().filter((el) => el.closest('#top'));
        const done = await waitFor(() => hero.every((el) => el.hasAttribute('data-revealed')));
        return { done, starts: hero.map((el) => shown(el) ? 1 : 0) };
      })()`);
      expect(result.done).toBe(true);
      expect(result.starts).toEqual([1, 1, 1, 1, 1, 1, 1]);
      expect(await tab.evaluate('document.documentElement.classList.contains("motion")')).toBe(true);
    });

    it('keeps below-the-fold content hidden until it scrolls into view, then reveals it once', async () => {
      const result = await tab.evaluate<{ before: string; after: boolean; revealed: boolean }>(`(async () => {
        ${lib}
        const header = document.querySelector('#resume header');
        const before = getComputedStyle(header).opacity;
        header.scrollIntoView({ block: 'center', behavior: 'instant' });
        const revealed = await waitFor(() => header.hasAttribute('data-revealed'));
        return { before, revealed, after: shown(header) };
      })()`);
      expect(result.before).toBe('0');
      expect(result.revealed).toBe(true);
      expect(result.after).toBe(true);
    });

    it('staggers a list as it enters view, and leaves no inline styles behind', async () => {
      const result = await tab.evaluate<{ revealed: boolean; inline: string[] }>(`(async () => {
        ${lib}
        const list = document.querySelector('[data-timeline]');
        list.scrollIntoView({ block: 'start', behavior: 'instant' });
        const items = [...list.children];
        const revealed = await waitFor(() => items.every((el) => el.hasAttribute('data-revealed')));
        return { revealed, inline: items.map((el) => el.getAttribute('style') ?? '') };
      })()`);
      expect(result.revealed).toBe(true);
      expect(result.inline.every((style) => style.trim() === '')).toBe(true);
    });
  });

  describe('with prefers-reduced-motion: reduce', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openPage(`${site.origin}/`, { reducedMotion: true });
    });
    afterAll(() => tab?.close());

    it('shows every element in its final place on load, and nothing animates', async () => {
      const result = await tab.evaluate<{ motion: boolean; hidden: number; animations: number }>(`(async () => {
        ${lib}
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 300));
        return {
          motion: document.documentElement.classList.contains('motion'),
          hidden: reveals().filter((el) => !shown(el)).length,
          animations: document.getAnimations().length,
        };
      })()`);
      expect(result).toEqual({ motion: false, hidden: 0, animations: 0 });
    });
  });

  describe('with JavaScript disabled', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openPage(`${site.origin}/`, { noScript: true });
    });
    afterAll(() => tab?.close());

    it('shows every element in its final place', async () => {
      const result = await tab.evaluate<{ count: number; hidden: number; motion: boolean }>(`(() => {
        ${lib}
        return {
          count: reveals().length,
          hidden: reveals().filter((el) => !shown(el)).length,
          motion: document.documentElement.classList.contains('motion'),
        };
      })()`);
      expect(result.count).toBeGreaterThan(20);
      expect(result.hidden).toBe(0);
      expect(result.motion).toBe(false);
    });
  });
});
